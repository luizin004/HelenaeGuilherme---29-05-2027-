"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";

export interface ConfigFormState {
  ok: boolean;
  message: string;
}

function revalidar() {
  for (const t of ["/admin/metodos-pagamento", "/admin/contas-financeiras", "/admin/contas", "/admin/fluxo-caixa"])
    revalidatePath(t);
}

/** Ativa/inativa um método de pagamento. */
export async function alternarMetodo(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const ativo = String(formData.get("ativo") ?? "") === "true";
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_payment_methods").update({ ativo: !ativo }).eq("id", id);
  revalidar();
}

/** Cria uma conta financeira (conta, carteira, cartão de crédito…). */
export async function criarContaFinanceira(_prev: ConfigFormState, formData: FormData): Promise<ConfigFormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "conta");
  const saldoStr = String(formData.get("saldo_inicial") ?? "").trim();
  const titular = String(formData.get("titular") ?? "").trim() || null;
  const fech = Number(formData.get("dia_fechamento"));
  const venc = Number(formData.get("dia_vencimento"));

  if (!nome) return { ok: false, message: "Informe o nome da conta." };

  let saldoCents = 0;
  if (saldoStr) {
    try {
      saldoCents = parseBRLToCents(saldoStr);
    } catch {
      return { ok: false, message: "Saldo inicial inválido. Use R$ 0,00." };
    }
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };
  const { error } = await supabase.from("hg_financial_accounts").insert({
    nome,
    tipo: ["conta", "carteira", "cartao_credito", "poupanca", "outro"].includes(tipo) ? tipo : "conta",
    saldo_inicial_cents: saldoCents,
    titular,
    dia_fechamento: tipo === "cartao_credito" && Number.isInteger(fech) && fech >= 1 && fech <= 31 ? fech : null,
    dia_vencimento: tipo === "cartao_credito" && Number.isInteger(venc) && venc >= 1 && venc <= 31 ? venc : null,
  });
  if (error) return { ok: false, message: "Não foi possível salvar." };
  await logAudit(supabase, { modulo: "financeiro", acao: "create", registro: "hg_financial_accounts", valorNovo: { nome, tipo } });
  revalidar();
  return { ok: true, message: "Conta financeira criada." };
}

/** Ativa/inativa uma conta financeira (não exclui — preserva vínculos). */
export async function alternarContaFinanceira(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const ativo = String(formData.get("ativo") ?? "") === "true";
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_financial_accounts").update({ ativo: !ativo }).eq("id", id);
  revalidar();
}
