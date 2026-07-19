"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";
import { validateResponsibleSplit } from "@/domain/finance/installments";

export interface SplitState {
  ok: boolean;
  message: string;
}

/**
 * Define a divisão de uma despesa entre responsáveis (Helena/Guilherme/Toninho).
 * A soma das partes deve fechar EXATAMENTE o valor da despesa (regra 2).
 * Campos do form: `valor_<payerId>` em reais (vazio = 0). Partes zero são omitidas.
 */
export async function definirDivisao(_prev: SplitState, formData: FormData): Promise<SplitState> {
  const expenseId = String(formData.get("expense_id") ?? "").trim();
  if (!expenseId) return { ok: false, message: "Despesa inválida." };

  const partes: { payer_id: string; valor_cents: number }[] = [];
  try {
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("valor_")) continue;
      const payerId = key.slice("valor_".length);
      const raw = String(value).trim();
      if (!raw) continue;
      const cents = parseBRLToCents(raw);
      if (cents > 0) partes.push({ payer_id: payerId, valor_cents: cents });
    }
  } catch {
    return { ok: false, message: "Valor inválido em uma das partes." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { data: exp } = await supabase
    .from("hg_expenses")
    .select("valor_total_cents, gratuito")
    .eq("id", expenseId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!exp) return { ok: false, message: "Despesa não encontrada." };
  if (exp.gratuito) return { ok: false, message: "Item gratuito não tem desembolso para dividir." };
  if (exp.valor_total_cents === null) return { ok: false, message: "Defina o valor da despesa antes de dividir." };

  const total = Number(exp.valor_total_cents);
  if (partes.length === 0) {
    // Limpa a divisão.
    await supabase.from("hg_expense_payer_splits").delete().eq("expense_id", expenseId);
    await logAudit(supabase, { modulo: "financeiro", acao: "divisao_limpa", registro: `hg_expenses:${expenseId}` });
    revalidatePath("/admin/divisao");
    revalidatePath("/admin/responsaveis");
    return { ok: true, message: "Divisão removida." };
  }

  if (!validateResponsibleSplit(total, partes.map((p) => p.valor_cents))) {
    const soma = partes.reduce((n, p) => n + p.valor_cents, 0);
    return {
      ok: false,
      message: `A soma das partes (${(soma / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}) não fecha o total (${(total / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}).`,
    };
  }

  await supabase.from("hg_expense_payer_splits").delete().eq("expense_id", expenseId);
  const { error } = await supabase
    .from("hg_expense_payer_splits")
    .insert(partes.map((p) => ({ expense_id: expenseId, payer_id: p.payer_id, valor_cents: p.valor_cents })));
  if (error) return { ok: false, message: "Não foi possível salvar a divisão." };

  await logAudit(supabase, { modulo: "financeiro", acao: "divisao", registro: `hg_expenses:${expenseId}`, valorNovo: { partes: partes.length } });
  revalidatePath("/admin/divisao");
  revalidatePath("/admin/responsaveis");
  revalidatePath("/admin/relatorios");
  return { ok: true, message: "Divisão salva (fecha exato)." };
}
