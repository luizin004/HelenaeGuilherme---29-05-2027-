"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { buildSchedule, reequilibrarParcelas } from "@/domain/finance/installments";
import { gerarDatas, gerarDatasAte } from "@/domain/finance/schedule";
import { parseBRLToCents } from "@/domain/money";
import { WEDDING } from "@/lib/constants";

export interface InstallmentState {
  ok: boolean;
  message: string;
}

interface ExistingInstallment {
  numero: number;
  valor_cents: number;
  vencimento: string | null;
  pago: boolean;
}

/** Telas que dependem do cronograma — revalidadas juntas (fonte única, §25). */
function revalidarFinanceiro() {
  for (const t of [
    "/admin/financeiro", "/admin/calendario",
    "/admin/financeiro-dashboard", "/admin/responsaveis", "/admin/divisao",
  ]) revalidatePath(t);
}

/**
 * Gera (ou RENEGOCIA) o cronograma de parcelas de uma despesa.
 * - As parcelas fecham EXATAMENTE o total (motor `buildSchedule`, regra 1).
 * - Se já houver parcelas, o cronograma anterior é versionado em
 *   `hg_expense_schedule_versions` (snapshot + motivo) antes de ser substituído.
 * - Item gratuito não gera parcela (regra 4/38).
 */
export async function gerarParcelas(_prev: InstallmentState, formData: FormData): Promise<InstallmentState> {
  const expenseId = String(formData.get("expense_id") ?? "").trim();
  const n = Number(formData.get("n") ?? 0);
  const primeiroVenc = String(formData.get("primeiro_vencimento") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim();
  // Condição de pagamento (referência): intervalo em dias OU mensal; responsável; forma.
  const responsavelPayerId = String(formData.get("responsavel_payer_id") ?? "").trim();
  const metodoId = String(formData.get("metodo_id") ?? "").trim();
  // Ritmo do cronograma: intervalo fixo em dias, mensal, ou espalhado até o casamento.
  const ritmo = String(formData.get("ritmo") ?? "intervalo");
  const mensal = ritmo === "mensal";
  const ateCasamento = ritmo === "ate_casamento";
  const intervaloDias = Number(formData.get("intervalo_dias") ?? 30);
  // Entrada em % (padrão de casamento: 30% na assinatura, saldo até o dia).
  const entradaPct = Number(formData.get("entrada_pct") ?? 0);

  if (!expenseId) return { ok: false, message: "Despesa inválida." };
  if (!Number.isInteger(n) || n < 1 || n > 60) return { ok: false, message: "Número de parcelas entre 1 e 60." };
  if (!Number.isFinite(entradaPct) || entradaPct < 0 || entradaPct > 100) {
    return { ok: false, message: "Entrada deve ser entre 0% e 100%." };
  }
  if (entradaPct > 0 && n < 2) {
    return { ok: false, message: "Com entrada, use pelo menos 2 parcelas (entrada + saldo)." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { data: expense, error: expErr } = await supabase
    .from("hg_expenses")
    .select("id, descricao, valor_total_cents, gratuito")
    .eq("id", expenseId)
    .is("deleted_at", null)
    .single();

  if (expErr || !expense) return { ok: false, message: "Despesa não encontrada." };
  if (expense.gratuito) return { ok: false, message: "Item gratuito não gera parcelas." };
  if (expense.valor_total_cents === null) return { ok: false, message: "Defina o valor total antes de parcelar." };

  // Datas do cronograma: intervalo/mensal, ou espalhadas até a data do casamento.
  let dataCasamento = WEDDING.dataISO.slice(0, 10);
  if (ateCasamento) {
    const { data: cfg } = await supabase.from("hg_wedding_settings").select("data_casamento").eq("id", 1).maybeSingle();
    if (cfg?.data_casamento) dataCasamento = String(cfg.data_casamento).slice(0, 10);
  }
  const datas = ateCasamento
    ? gerarDatasAte(primeiroVenc, n, dataCasamento)
    : gerarDatas(primeiroVenc, n, { mensal, intervaloDias });

  const schedule = buildSchedule({
    totalCents: Number(expense.valor_total_cents),
    n,
    vencimentos: datas,
    entradaPct,
  });

  // Forma de pagamento padrão da despesa (pré-preenche o registro de pagamento).
  if (formData.has("metodo_id")) {
    await supabase.from("hg_expenses").update({ metodo_id: metodoId || null }).eq("id", expenseId);
  }

  // Responsável pela cobrança: define a divisão como responsável ÚNICO (desembolso total).
  // Alimenta Responsáveis / Divisão / Projeção. Só quando há valor e responsável escolhido.
  if (responsavelPayerId) {
    await supabase.from("hg_expense_payer_splits").delete().eq("expense_id", expenseId);
    await supabase.from("hg_expense_payer_splits").insert({
      expense_id: expenseId,
      payer_id: responsavelPayerId,
      valor_cents: Number(expense.valor_total_cents),
    });
  }

  // Versiona o cronograma anterior, se existir.
  const { data: atuais } = await supabase
    .from("hg_expense_installments")
    .select("numero, valor_cents, vencimento, pago")
    .eq("expense_id", expenseId)
    .order("numero");

  if (atuais && atuais.length > 0) {
    const { data: ultima } = await supabase
      .from("hg_expense_schedule_versions")
      .select("versao")
      .eq("expense_id", expenseId)
      .order("versao", { ascending: false })
      .limit(1)
      .maybeSingle();
    const proximaVersao = (ultima?.versao ?? 0) + 1;

    await supabase.from("hg_expense_schedule_versions").insert({
      expense_id: expenseId,
      versao: proximaVersao,
      snapshot: atuais as ExistingInstallment[],
      motivo: motivo || "Renegociação do cronograma",
    });

    await supabase.from("hg_expense_installments").delete().eq("expense_id", expenseId);
  }

  const { error: insErr } = await supabase.from("hg_expense_installments").insert(
    schedule.map((p) => ({
      expense_id: expenseId,
      numero: p.numero,
      valor_cents: p.valorCents,
      vencimento: p.vencimento,
      pago: false,
    })),
  );

  if (insErr) return { ok: false, message: "Não foi possível salvar as parcelas." };

  await logAudit(supabase, {
    modulo: "financeiro",
    acao: atuais && atuais.length > 0 ? "renegociar_parcelas" : "gerar_parcelas",
    registro: `hg_expenses:${expenseId}`,
    valorNovo: { n, primeiroVenc: primeiroVenc || null, ritmo, intervaloDias, entradaPct, responsavelPayerId: responsavelPayerId || null, motivo: motivo || null },
  });
  revalidarFinanceiro();

  const como = !primeiroVenc
    ? "sem datas"
    : ateCasamento
      ? "até o casamento"
      : mensal
        ? "mensal"
        : `a cada ${intervaloDias} dias`;
  const comEntrada = entradaPct > 0 ? ` com entrada de ${entradaPct}%` : "";
  return { ok: true, message: `Cronograma de ${n}×${comEntrada} (${como}) salvo para ${expense.descricao}.` };
}

/**
 * Edita o valor de UMA parcela. A diferença é redistribuída nas parcelas
 * seguintes ainda não pagas, para o cronograma continuar fechando exatamente o
 * total (regra 1) — nunca se altera o valor da despesa por aqui.
 */
export async function atualizarValorParcela(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const expenseId = String(formData.get("expense_id") ?? "").trim();
  const raw = String(formData.get("valor") ?? "").trim();
  if (!id || !expenseId || !raw) return;

  let novoValor: number;
  try {
    novoValor = parseBRLToCents(raw);
  } catch {
    return;
  }

  const supabase = createClient();
  if (!supabase) return;

  const { data: parcelas } = await supabase
    .from("hg_expense_installments")
    .select("id, numero, valor_cents, pago")
    .eq("expense_id", expenseId)
    .order("numero");
  if (!parcelas || parcelas.length === 0) return;

  const indice = parcelas.findIndex((p) => p.id === id);
  if (indice === -1) return;

  const novos = reequilibrarParcelas(
    parcelas.map((p) => Number(p.valor_cents)),
    indice,
    novoValor,
    parcelas.map((p) => !!p.pago),
  );

  // Só grava o que realmente mudou.
  await Promise.all(
    parcelas.map((p, i) =>
      Number(p.valor_cents) === novos[i]
        ? Promise.resolve()
        : supabase.from("hg_expense_installments").update({ valor_cents: novos[i] }).eq("id", p.id),
    ),
  );

  await logAudit(supabase, {
    modulo: "financeiro",
    acao: "ajustar_valor_parcela",
    registro: `hg_expense_installments:${id}`,
    valorNovo: { valorCents: novos[indice] },
  });
  revalidarFinanceiro();
}

/** Ajusta o vencimento de UMA parcela (para o cronograma nunca virar um problema). */
export async function atualizarVencimentoParcela(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const vencimento = String(formData.get("vencimento") ?? "").trim() || null;
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase.from("hg_expense_installments").update({ vencimento }).eq("id", id);
  if (!error) {
    await logAudit(supabase, {
      modulo: "financeiro",
      acao: "ajustar_vencimento",
      registro: `hg_expense_installments:${id}`,
      valorNovo: { vencimento },
    });
    revalidarFinanceiro();
  }
}

/** Marca/desmarca uma parcela como paga (regra 5: sem alterar vencimento). */
export async function pagarParcela(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const pago = String(formData.get("pago") ?? "") === "true";
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_expense_installments")
    .update({ pago, pago_em: pago ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", id);

  if (!error) {
    await logAudit(supabase, {
      modulo: "financeiro",
      acao: pago ? "pagar_parcela" : "estornar_parcela",
      registro: `hg_expense_installments:${id}`,
    });
    revalidatePath("/admin/financeiro");
  }
}
