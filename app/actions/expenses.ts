"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";

export interface ClassifyState {
  ok: boolean;
  message: string;
}

export interface ExpenseFormState {
  ok: boolean;
  message: string;
}

const ESTADOS = ["previsto", "orcado", "contratado", "pago", "gratuito"];

/** Lê valor (R$) do form → centavos. Retorna undefined se vazio (mantém "a definir"). */
function lerValorCents(raw: string): number | null | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  return parseBRLToCents(v); // pode lançar → tratado no chamador
}

/** Cadastra uma nova despesa (painel, autenticado). Dinheiro em centavos (regra 1). */
export async function criarDespesa(_prev: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const descricao = String(formData.get("descricao") ?? "").trim();
  const estado = String(formData.get("estado") ?? "previsto");
  const gratuito = formData.get("gratuito") === "on";
  const observacao = String(formData.get("observacao") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();

  if (!descricao) return { ok: false, message: "Informe a descrição da despesa." };
  if (!ESTADOS.includes(estado)) return { ok: false, message: "Estado inválido." };

  let valorCents: number | null | undefined;
  try {
    valorCents = gratuito ? null : lerValorCents(String(formData.get("valor") ?? ""));
  } catch {
    return { ok: false, message: "Valor inválido." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_expenses").insert({
    descricao,
    estado: gratuito ? "gratuito" : estado,
    gratuito,
    valor_total_cents: gratuito ? null : valorCents ?? null,
    observacao: observacao || null,
    categoria: categoria || null,
  });

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique se você está autenticado." };

  await logAudit(supabase, { modulo: "financeiro", acao: "create", valorNovo: { descricao, estado, gratuito } });
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/parcelas");
  return { ok: true, message: `Despesa "${descricao}" cadastrada.` };
}

/** Edita uma despesa: descrição, estado, gratuito, valor total, observação. */
export async function atualizarDespesa(_prev: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const estado = String(formData.get("estado") ?? "previsto");
  const gratuito = formData.get("gratuito") === "on";
  const observacao = String(formData.get("observacao") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();

  if (!id) return { ok: false, message: "Despesa inválida." };
  if (!descricao) return { ok: false, message: "Informe a descrição." };
  if (!ESTADOS.includes(estado)) return { ok: false, message: "Estado inválido." };

  let valorCents: number | null | undefined;
  try {
    valorCents = lerValorCents(String(formData.get("valor") ?? ""));
  } catch {
    return { ok: false, message: "Valor inválido." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  // Item gratuito não tem valor (regra 4). Campo de valor vazio mantém "a definir".
  const patch: Record<string, unknown> = {
    descricao,
    estado: gratuito ? "gratuito" : estado,
    gratuito,
    observacao: observacao || null,
    categoria: categoria || null,
  };
  if (gratuito) patch.valor_total_cents = null;
  else if (valorCents !== undefined) patch.valor_total_cents = valorCents;

  const { error } = await supabase.from("hg_expenses").update(patch).eq("id", id).is("deleted_at", null);
  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, {
    modulo: "financeiro",
    acao: "update",
    registro: `hg_expenses:${id}`,
    valorNovo: { descricao, estado, gratuito, valor_total_cents: patch.valor_total_cents },
  });
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/parcelas");
  return { ok: true, message: `Despesa "${descricao}" atualizada.` };
}

/** Define o valor de mercado de um item gratuito/cortesia (economia estimada,
 *  sem desembolso). */
export async function definirValorMercado(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const raw = String(formData.get("valor_mercado") ?? "").trim();
  if (!id) return;

  let cents: number | null = null;
  try {
    cents = raw ? parseBRLToCents(raw) : null;
  } catch {
    return;
  }
  if (cents !== null && cents < 0) return;

  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("hg_expenses")
    .update({ valor_mercado_cents: cents })
    .eq("id", id)
    .is("deleted_at", null);
  if (!error) {
    await logAudit(supabase, { modulo: "financeiro", acao: "valor_mercado", registro: `hg_expenses:${id}`, valorNovo: { cents } });
    revalidatePath("/admin/cortesias");
    revalidatePath("/admin/relatorios");
  }
}

/** Exclusão LÓGICA (soft-delete) de uma despesa. */
export async function excluirDespesa(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (!error) {
    await logAudit(supabase, { modulo: "financeiro", acao: "delete", registro: `hg_expenses:${id}` });
    revalidatePath("/admin/financeiro");
    revalidatePath("/admin/parcelas");
  }
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
