"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";

export interface AporteState {
  ok: boolean;
  message: string;
}

/** Registra um aporte (entrada de recurso) de um responsável ou terceiro. */
export async function criarAporte(_prev: AporteState, formData: FormData): Promise<AporteState> {
  const payerId = String(formData.get("payer_id") ?? "").trim();
  const nome = String(formData.get("responsavel_nome") ?? "").trim();
  const data = String(formData.get("data") ?? "").trim();
  const finalidade = String(formData.get("finalidade") ?? "").trim();
  const observacao = String(formData.get("observacao") ?? "").trim();

  if (!data) return { ok: false, message: "Informe a data." };
  if (!payerId && !nome) return { ok: false, message: "Informe o responsável." };

  let valorCents = 0;
  try {
    valorCents = parseBRLToCents(String(formData.get("valor") ?? ""));
  } catch {
    return { ok: false, message: "Valor inválido." };
  }
  if (valorCents <= 0) return { ok: false, message: "O valor deve ser maior que zero." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_aportes").insert({
    payer_id: payerId || null,
    responsavel_nome: nome || null,
    valor_cents: valorCents,
    data,
    finalidade: finalidade || null,
    observacao: observacao || null,
  });
  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "aportes", acao: "create", valorNovo: { valorCents } });
  revalidatePath("/admin/aportes");
  revalidatePath("/admin/fluxo-caixa");
  revalidatePath("/admin/responsaveis");
  return { ok: true, message: "Aporte registrado." };
}

/** Exclusão LÓGICA de um aporte. */
export async function excluirAporte(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("hg_aportes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (!error) {
    await logAudit(supabase, { modulo: "aportes", acao: "delete", registro: `hg_aportes:${id}` });
    revalidatePath("/admin/aportes");
    revalidatePath("/admin/fluxo-caixa");
    revalidatePath("/admin/responsaveis");
  }
}
