"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { buildSchedule } from "@/domain/finance/installments";

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

/** Soma N meses a uma data ISO (YYYY-MM-DD), tratando fim de mês. */
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(d, lastDay));
  return base.toISOString().slice(0, 10);
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

  if (!expenseId) return { ok: false, message: "Despesa inválida." };
  if (!Number.isInteger(n) || n < 1 || n > 60) return { ok: false, message: "Número de parcelas entre 1 e 60." };

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

  // Cronograma novo (fechamento exato garantido pelo motor).
  const vencimentos = primeiroVenc
    ? Array.from({ length: n }, (_, i) => addMonths(primeiroVenc, i))
    : undefined;
  const schedule = buildSchedule({ totalCents: Number(expense.valor_total_cents), n, vencimentos });

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
    valorNovo: { n, primeiroVenc: primeiroVenc || null, motivo: motivo || null },
  });
  revalidatePath("/admin/parcelas");
  revalidatePath("/admin/financeiro");
  return { ok: true, message: `Cronograma de ${n}× salvo para ${expense.descricao}.` };
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
    revalidatePath("/admin/parcelas");
    revalidatePath("/admin/financeiro");
  }
}
