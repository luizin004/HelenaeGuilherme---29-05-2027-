"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";
import { getPayers } from "@/lib/admin-data";

export interface ReembolsoState {
  ok: boolean;
  message: string;
}

const STATUS = ["a_reembolsar", "parcial", "reembolsado", "compensado", "cancelado"];

/**
 * Registra um reembolso: quem pagou × quem deve devolver.
 * O campo "quem pagou/deve" é LIVRE (qualquer pessoa, mesmo fora dos
 * responsáveis fixos) — guardamos o nome sempre. Se o nome digitado bater
 * com um responsável cadastrado, também vinculamos o payer_id para o valor
 * refletir nos relatórios por responsável.
 */
export async function criarReembolso(_prev: ReembolsoState, formData: FormData): Promise<ReembolsoState> {
  const pagadorNome = String(formData.get("pagador_nome") ?? "").trim();
  const devedorNome = String(formData.get("devedor_nome") ?? "").trim();
  const data = String(formData.get("data") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!data) return { ok: false, message: "Informe a data." };
  if (!pagadorNome) return { ok: false, message: "Informe quem pagou." };
  if (!devedorNome) return { ok: false, message: "Informe quem deve reembolsar." };

  let valorCents = 0;
  try {
    valorCents = parseBRLToCents(String(formData.get("valor") ?? ""));
  } catch {
    return { ok: false, message: "Valor inválido." };
  }
  if (valorCents <= 0) return { ok: false, message: "O valor deve ser maior que zero." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  // Casa o texto livre com um responsável cadastrado (opcional, para relatórios).
  const payers = await getPayers();
  const acha = (nome: string) => payers.find((p) => p.nome.toLowerCase() === nome.toLowerCase())?.id ?? null;

  const { error } = await supabase.from("hg_reembolsos").insert({
    pagador_payer_id: acha(pagadorNome),
    pagador_nome: pagadorNome,
    devedor_payer_id: acha(devedorNome),
    devedor_nome: devedorNome,
    valor_cents: valorCents,
    data,
    motivo: motivo || null,
    status: "a_reembolsar",
  });
  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "reembolsos", acao: "create", valorNovo: { valorCents } });
  revalidatePath("/admin/reembolsos");
  return { ok: true, message: "Reembolso registrado." };
}

/** Atualiza o status de um reembolso. */
export async function atualizarStatusReembolso(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !STATUS.includes(status)) return;
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase.from("hg_reembolsos").update({ status }).eq("id", id).is("deleted_at", null);
  if (!error) {
    await logAudit(supabase, { modulo: "reembolsos", acao: "update", registro: `hg_reembolsos:${id}`, valorNovo: { status } });
    revalidatePath("/admin/reembolsos");
  }
}

/** Exclusão LÓGICA de um reembolso. */
export async function excluirReembolso(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("hg_reembolsos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (!error) {
    await logAudit(supabase, { modulo: "reembolsos", acao: "delete", registro: `hg_reembolsos:${id}` });
    revalidatePath("/admin/reembolsos");
  }
}
