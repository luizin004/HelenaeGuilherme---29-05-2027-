import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/**
 * Webhook do Asaas — confirma pagamentos de presentes.
 * Configure a URL e o token de autenticação no painel do Asaas.
 */
export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");
  if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: { event?: string; payment?: { id?: string } };
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
  if (supabase) {
    const pago = novoStatus === "confirmado" || novoStatus === "recebido";
    await supabase
      .from("hg_payments")
      .update({ status: novoStatus, ...(pago ? { pago_em: new Date().toISOString() } : {}) })
      .eq("asaas_payment_id", asaasId);
  }

  return NextResponse.json({ ok: true });
}
