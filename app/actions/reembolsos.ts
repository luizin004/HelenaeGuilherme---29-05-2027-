"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";

export interface ReembolsoState {
  ok: boolean;
  message: string;
}

const STATUS = ["a_reembolsar", "parcial", "reembolsado", "compensado", "cancelado"];

/** Registra um reembolso: quem pagou × quem deveria pagar. */
export async function criarReembolso(_prev: ReembolsoState, formData: FormData): Promise<ReembolsoState> {
  const pagador = String(formData.get("pagador_payer_id") ?? "").trim();
  const pagadorNome = String(formData.get("pagador_nome") ?? "").trim();
  const devedor = String(formData.get("devedor_payer_id") ?? "").trim();
  const devedorNome = String(formData.get("devedor_nome") ?? "").trim();
  const data = String(formData.get("data") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!data) return { ok: false, message: "Informe a data." };
  if (!pagador && !pagadorNome) return { ok: false, message: "Informe quem pagou." };
  if (!devedor && !devedorNome) return { ok: false, message: "Informe quem deve reembolsar." };

  let valorCents = 0;
  try {
    valorCents = parseBRLToCents(String(formData.get("valor") ?? ""));
  } catch {
    return { ok: false, message: "Valor inválido." };
  }
  if (valorCents <= 0) return { ok: false, message: "O valor deve ser maior que zero." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_reembolsos").insert({
    pagador_payer_id: pagador || null,
    pagador_nome: pagadorNome || null,
    devedor_payer_id: devedor || null,
    devedor_nome: devedorNome || null,
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
