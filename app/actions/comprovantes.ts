"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";

export interface ComprovanteState {
  ok: boolean;
  message: string;
}

const BUCKET = "hg-documentos";

/**
 * Registra os metadados de um comprovante já enviado ao Storage privado e o
 * VINCULA a uma despesa. Opcionalmente amarra a uma parcela — e, nesse caso,
 * marca a parcela como paga (com a data do comprovante). Assim o comprovante
 * fica ligado ao pagamento (spec: nada de pagamento solto).
 */
export async function registrarComprovante(_prev: ComprovanteState, formData: FormData): Promise<ComprovanteState> {
  const expenseId = String(formData.get("expense_id") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const installmentId = String(formData.get("installment_id") ?? "").trim();
  const dataPagamento = String(formData.get("data_pagamento") ?? "").trim();
  const observacao = String(formData.get("observacao") ?? "").trim();
  const valorRaw = String(formData.get("valor") ?? "").trim();

  if (!expenseId || !path) return { ok: false, message: "Despesa e arquivo são obrigatórios." };

  let valorCents: number | null = null;
  try {
    valorCents = valorRaw ? parseBRLToCents(valorRaw) : null;
  } catch {
    return { ok: false, message: "Valor do comprovante inválido." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_comprovantes").insert({
    expense_id: expenseId,
    installment_id: installmentId || null,
    titulo: titulo || null,
    arquivo_url: path,
    valor_cents: valorCents,
    data_pagamento: dataPagamento || null,
    observacao: observacao || null,
  });

  if (error) return { ok: false, message: "Não foi possível registrar o comprovante." };

  // Se veio ligado a uma parcela, marca como paga (data do comprovante ou hoje).
  if (installmentId) {
    await supabase
      .from("hg_expense_installments")
      .update({ pago: true, pago_em: dataPagamento || new Date().toISOString().slice(0, 10) })
      .eq("id", installmentId)
      .eq("expense_id", expenseId);
  }

  await logAudit(supabase, {
    modulo: "comprovantes",
    acao: "create",
    registro: `hg_expenses:${expenseId}`,
    valorNovo: { valorCents, installmentId: installmentId || null },
  });
  revalidatePath("/admin/comprovantes");
  revalidatePath("/admin/financeiro");
  return { ok: true, message: "Comprovante anexado." + (installmentId ? " Parcela marcada como paga." : "") };
}

/** Exclusão LÓGICA do comprovante + remoção do arquivo no Storage. */
export async function excluirComprovante(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_comprovantes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return;

  if (path) await supabase.storage.from(BUCKET).remove([path]);
  await logAudit(supabase, { modulo: "comprovantes", acao: "delete", registro: `hg_comprovantes:${id}` });
  revalidatePath("/admin/comprovantes");
}
