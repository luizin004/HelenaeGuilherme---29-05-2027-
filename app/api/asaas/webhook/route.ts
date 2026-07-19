import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type { StatusPagamento } from "@/lib/database.types";

export const runtime = "nodejs";

/** Mapeia o evento do Asaas para o status interno do pagamento. */
const EVENT_STATUS: Record<string, StatusPagamento> = {
  PAYMENT_CONFIRMED: "confirmado",
  PAYMENT_RECEIVED: "recebido",
  PAYMENT_REFUNDED: "estornado",
  PAYMENT_DELETED: "cancelado",
  PAYMENT_OVERDUE: "pendente",
};

interface AsaasWebhookPayload {
  id?: string;
  event?: string;
  payment?: { id?: string };
}

/**
 * Webhook do Asaas — confirma pagamentos de presentes.
 * Segurança: token de autenticação + IDEMPOTÊNCIA (dedup por evento em
 * hg_webhook_events, com payload armazenado) — regras 30–32 da spec.
 */
export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");
  if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: AsaasWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const event = payload.event ?? "";
  const asaasId = payload.payment?.id;
  const novoStatus = EVENT_STATUS[event];

  if (!asaasId || !novoStatus) {
    // Evento não tratado — responde 200 para o Asaas não reenfileirar.
    return NextResponse.json({ ok: true, ignored: event });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    // Sem service_role configurada não há como processar com segurança.
    logger.warn("Webhook Asaas recebido sem service_role configurada");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  // Idempotência: registra o evento primeiro; duplicado (23505) não reprocessa.
  const eventKey = payload.id ?? `${event}:${asaasId}`;
  const { error: dupError } = await supabase.from("hg_webhook_events").insert({
    provedor: "asaas",
    event_key: eventKey,
    event_type: event,
    payload,
  });
  if (dupError) {
    if (dupError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    logger.error("Falha ao registrar evento de webhook", { code: dupError.code });
    return NextResponse.json({ error: "storage failure" }, { status: 500 });
  }

  const pago = novoStatus === "confirmado" || novoStatus === "recebido";
  const { error } = await supabase
    .from("hg_payments")
    .update({ status: novoStatus, ...(pago ? { pago_em: new Date().toISOString() } : {}) })
    .eq("asaas_payment_id", asaasId);

  if (error) {
    logger.error("Falha ao atualizar pagamento via webhook", { code: error.code });
    return NextResponse.json({ error: "update failure" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
