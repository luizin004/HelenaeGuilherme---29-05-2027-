"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface ClassifyState {
  ok: boolean;
  message: string;
}

/**
 * Classifica uma despesa: centro de custo + responsável.
 * O responsável recebe o desembolso total (caso simples de 1 pagador).
 * Item gratuito não gera split (regra 4).
 */
export async function classificarDespesa(_prev: ClassifyState, formData: FormData): Promise<ClassifyState> {
  const expenseId = String(formData.get("expense_id") ?? "");
  const costCenterId = String(formData.get("cost_center_id") ?? "");
  const payerId = String(formData.get("payer_id") ?? "");
  if (!expenseId) return { ok: false, message: "Despesa inválida." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { data: exp } = await supabase.from("hg_expenses").select("*").eq("id", expenseId).maybeSingle();
  if (!exp) return { ok: false, message: "Despesa não encontrada." };

  const { error: upErr } = await supabase
    .from("hg_expenses")
    .update({ cost_center_id: costCenterId || null })
    .eq("id", expenseId);
  if (upErr) return { ok: false, message: "Não foi possível salvar (verifique o login)." };

  // Responsável: substitui o split existente por um único (desembolso total).
  await supabase.from("hg_expense_payer_splits").delete().eq("expense_id", expenseId);
  const valor = exp.valor_total_cents as number | null;
  if (payerId && !exp.gratuito && valor && valor > 0) {
    await supabase
      .from("hg_expense_payer_splits")
      .insert({ expense_id: expenseId, payer_id: payerId, valor_cents: valor });
  }

  await logAudit(supabase, {
    modulo: "financeiro",
    acao: "classify",
    registro: `hg_expenses:${expenseId}`,
    valorNovo: { cost_center_id: costCenterId || null, payer_id: payerId || null },
  });
  revalidatePath("/admin/financeiro");
  return { ok: true, message: "Classificação salva." };
}
