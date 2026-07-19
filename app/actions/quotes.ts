"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";
import { splitEqualInstallments } from "@/domain/finance/installments";

export interface QuoteFormState {
  ok: boolean;
  message: string;
}

/** Registra uma proposta de fornecedor para um item (despesa). */
export async function criarProposta(_prev: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
  const expenseId = String(formData.get("expense_id") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const fornecedorNome = String(formData.get("fornecedor_nome") ?? "").trim();
  const prazo = String(formData.get("prazo") ?? "").trim();
  const inclui = String(formData.get("inclui") ?? "").trim();
  const observacao = String(formData.get("observacao") ?? "").trim();

  if (!expenseId) return { ok: false, message: "Item inválido." };
  if (!supplierId && !fornecedorNome) return { ok: false, message: "Informe o fornecedor." };

  let valorCents = 0;
  let entradaCents: number | null = null;
  try {
    valorCents = parseBRLToCents(String(formData.get("valor") ?? ""));
    const entradaRaw = String(formData.get("entrada") ?? "").trim();
    entradaCents = entradaRaw ? parseBRLToCents(entradaRaw) : null;
  } catch {
    return { ok: false, message: "Valor ou entrada inválidos." };
  }
  if (valorCents <= 0) return { ok: false, message: "Informe o valor da proposta." };
  if (entradaCents !== null && entradaCents > valorCents) {
    return { ok: false, message: "A entrada não pode ser maior que o total." };
  }

  const parcelasRaw = String(formData.get("parcelas") ?? "").trim();
  const parcelas = parcelasRaw ? Number.parseInt(parcelasRaw, 10) : null;
  if (parcelas !== null && (!Number.isInteger(parcelas) || parcelas < 0 || parcelas > 60)) {
    return { ok: false, message: "Número de parcelas inválido." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_quotes").insert({
    expense_id: expenseId,
    supplier_id: supplierId || null,
    fornecedor_nome: fornecedorNome || null,
    valor_cents: valorCents,
    entrada_cents: entradaCents,
    parcelas,
    prazo: prazo || null,
    inclui: inclui || null,
    observacao: observacao || null,
    status: "recebida",
  });

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique se você está autenticado." };

  await logAudit(supabase, { modulo: "cotacoes", acao: "create", registro: `hg_expenses:${expenseId}`, valorNovo: { valorCents } });
  revalidatePath("/admin/cotacoes");
  return { ok: true, message: "Proposta registrada." };
}

/** Exclusão LÓGICA de uma proposta. */
export async function excluirProposta(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_quotes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (!error) {
    await logAudit(supabase, { modulo: "cotacoes", acao: "delete", registro: `hg_quotes:${id}` });
    revalidatePath("/admin/cotacoes");
  }
}

/**
 * Converte a proposta ESCOLHIDA em contratação:
 *  - marca esta como escolhida e as demais do item como recusadas;
 *  - atualiza a despesa: valor_total_cents = valor da proposta, estado
 *    'contratado', fornecedor vinculado;
 *  - se o item ainda não tem cronograma, gera as parcelas (entrada + parcelas
 *    iguais, fechando exatamente o total — regra 1). Datas ficam a definir na
 *    tela de Parcelas.
 */
export async function escolherProposta(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { data: proposta } = await supabase
    .from("hg_quotes")
    .select("id, expense_id, supplier_id, valor_cents, entrada_cents, parcelas")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!proposta) return;

  const expenseId = proposta.expense_id as string;
  const valorCents = Number(proposta.valor_cents);
  const entradaCents = proposta.entrada_cents === null ? 0 : Number(proposta.entrada_cents);
  const parcelas = proposta.parcelas === null ? 0 : Number(proposta.parcelas);

  // 1. Marca escolha (esta escolhida; as outras do item, recusadas).
  await supabase
    .from("hg_quotes")
    .update({ escolhida: false, status: "recusada" })
    .eq("expense_id", expenseId)
    .is("deleted_at", null);
  await supabase.from("hg_quotes").update({ escolhida: true, status: "escolhida" }).eq("id", id);

  // 2. Atualiza a despesa.
  await supabase
    .from("hg_expenses")
    .update({
      valor_total_cents: valorCents,
      estado: "contratado",
      supplier_id: (proposta.supplier_id as string | null) ?? undefined,
    })
    .eq("id", expenseId)
    .is("deleted_at", null);

  // 3. Gera cronograma se ainda não houver e se houver parcelamento.
  const { data: existentes } = await supabase
    .from("hg_expense_installments")
    .select("id")
    .eq("expense_id", expenseId)
    .limit(1);

  if ((!existentes || existentes.length === 0) && parcelas >= 1) {
    const resto = valorCents - entradaCents;
    const linhas: { expense_id: string; numero: number; valor_cents: number; vencimento: null; pago: boolean; is_entrada: boolean }[] = [];
    let numero = 1;
    if (entradaCents > 0) {
      linhas.push({ expense_id: expenseId, numero: numero++, valor_cents: entradaCents, vencimento: null, pago: false, is_entrada: true });
    }
    if (resto > 0) {
      for (const v of splitEqualInstallments(resto, parcelas)) {
        linhas.push({ expense_id: expenseId, numero: numero++, valor_cents: v, vencimento: null, pago: false, is_entrada: false });
      }
    }
    if (linhas.length > 0) await supabase.from("hg_expense_installments").insert(linhas);
  }

  await logAudit(supabase, {
    modulo: "cotacoes",
    acao: "escolher_proposta",
    registro: `hg_expenses:${expenseId}`,
    valorNovo: { proposta: id, valorCents },
  });
  revalidatePath("/admin/cotacoes");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/parcelas");
}
