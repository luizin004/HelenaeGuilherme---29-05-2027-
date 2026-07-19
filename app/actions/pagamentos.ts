"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";
import { validarPagamento } from "@/domain/finance/status";

export interface PagamentoFormState {
  ok: boolean;
  message: string;
}

/** Telas que dependem de um pagamento — revalidadas juntas (§25). */
const TELAS_FINANCEIRAS = [
  "/admin/contas",
  "/admin/contas-a-pagar",
  "/admin/contas-pagas",
  "/admin/financeiro",
  "/admin/financeiro-dashboard",
  "/admin/calendario",
  "/admin/parcelas",
  "/admin/projecao",
  "/admin/fluxo-caixa",
  "/admin/relatorios",
  "/admin/comprovantes",
];

function revalidarFinanceiro() {
  for (const t of TELAS_FINANCEIRAS) revalidatePath(t);
}

/**
 * Registra um pagamento (total ou PARCIAL) numa parcela ou despesa (§15).
 * Vários pagamentos podem quitar a mesma conta; o saldo é recalculado sempre
 * a partir do histórico — o registro nunca é duplicado nem movido.
 */
export async function registrarPagamento(_prev: PagamentoFormState, formData: FormData): Promise<PagamentoFormState> {
  const expenseId = String(formData.get("expense_id") ?? "").trim();
  const installmentId = String(formData.get("installment_id") ?? "").trim() || null;
  const valorStr = String(formData.get("valor") ?? "").trim();
  const data = String(formData.get("data") ?? "").trim();
  const metodoId = String(formData.get("metodo_id") ?? "").trim() || null;
  const contaId = String(formData.get("conta_id") ?? "").trim() || null;
  const responsavel = String(formData.get("responsavel") ?? "").trim() || null;
  const observacao = String(formData.get("observacao") ?? "").trim() || null;

  if (!expenseId) return { ok: false, message: "Conta inválida." };
  if (!data) return { ok: false, message: "Informe a data do pagamento." };

  let valorCents: number;
  try {
    valorCents = parseBRLToCents(valorStr);
  } catch {
    return { ok: false, message: "Valor inválido. Use o formato R$ 0,00." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  // Saldo atual (fonte de verdade no servidor — §30).
  let alvoCents = 0;
  if (installmentId) {
    const { data: inst } = await supabase
      .from("hg_expense_installments")
      .select("valor_cents, pago")
      .eq("id", installmentId)
      .maybeSingle();
    if (!inst) return { ok: false, message: "Parcela não encontrada." };
    alvoCents = inst.valor_cents as number;
  } else {
    const { data: exp } = await supabase
      .from("hg_expenses")
      .select("valor_total_cents")
      .eq("id", expenseId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!exp) return { ok: false, message: "Despesa não encontrada." };
    alvoCents = (exp.valor_total_cents as number) ?? 0;
  }

  const { data: pays } = await supabase
    .from("hg_expense_payments")
    .select("valor_cents, estornado_em, installment_id")
    .eq("expense_id", expenseId);
  const jaPago = (pays ?? [])
    .filter((p) => !p.estornado_em && (installmentId ? p.installment_id === installmentId : !p.installment_id))
    .reduce((n, p) => n + (p.valor_cents as number), 0);

  const saldo = Math.max(0, alvoCents - jaPago);
  const v = validarPagamento(valorCents, saldo);
  if (!v.ok) {
    return v.motivo === "excede_saldo"
      ? { ok: false, message: `O valor excede o saldo pendente. Saldo atual: ${(saldo / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.` }
      : { ok: false, message: "Valor inválido." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("hg_expense_payments").insert({
    expense_id: expenseId,
    installment_id: installmentId,
    valor_cents: valorCents,
    data,
    metodo_id: metodoId,
    conta_id: contaId,
    responsavel,
    observacao,
    criado_por: user?.id ?? null,
  });
  if (error) return { ok: false, message: "Não foi possível registrar o pagamento." };

  // Quitou? Sincroniza a flag legada da parcela (compat com telas antigas).
  const novoTotal = jaPago + valorCents;
  if (installmentId && novoTotal >= alvoCents) {
    await supabase.from("hg_expense_installments").update({ pago: true, pago_em: data }).eq("id", installmentId);
  }

  await logAudit(supabase, {
    modulo: "financeiro",
    acao: "pay",
    registro: `hg_expense_payments:${expenseId}`,
    valorNovo: { valorCents, data, parcial: novoTotal < alvoCents },
  });
  revalidarFinanceiro();
  return {
    ok: true,
    message: novoTotal >= alvoCents ? "Pagamento registrado — conta quitada." : "Pagamento parcial registrado.",
  };
}

/** Estorna um pagamento: preserva o histórico e o saldo volta a ficar pendente (§10). */
export async function estornarPagamento(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;

  const { data: pay } = await supabase
    .from("hg_expense_payments")
    .select("id, installment_id, expense_id")
    .eq("id", id)
    .is("estornado_em", null)
    .maybeSingle();
  if (!pay) return;

  await supabase.from("hg_expense_payments").update({ estornado_em: new Date().toISOString() }).eq("id", id);

  // A parcela volta a ficar em aberto se o total válido não cobre mais o valor.
  if (pay.installment_id) {
    const [{ data: inst }, { data: pays }] = await Promise.all([
      supabase.from("hg_expense_installments").select("valor_cents").eq("id", pay.installment_id).maybeSingle(),
      supabase.from("hg_expense_payments").select("valor_cents, estornado_em").eq("installment_id", pay.installment_id),
    ]);
    const valido = (pays ?? []).filter((p) => !p.estornado_em).reduce((n, p) => n + (p.valor_cents as number), 0);
    if (inst && valido < (inst.valor_cents as number)) {
      await supabase.from("hg_expense_installments").update({ pago: false, pago_em: null }).eq("id", pay.installment_id);
    }
  }

  await logAudit(supabase, { modulo: "financeiro", acao: "refund", registro: `hg_expense_payments:${id}` });
  revalidarFinanceiro();
}
