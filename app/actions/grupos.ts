"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface GrupoState {
  ok: boolean;
  message: string;
}

const LADOS = ["", "noiva", "noivo", "ambos"];

/** Cria um grupo familiar (convite). */
export async function criarGrupo(_prev: GrupoState, formData: FormData): Promise<GrupoState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const lado = String(formData.get("lado") ?? "").trim();
  const maxRaw = String(formData.get("max_convidados") ?? "").trim();
  const observacao = String(formData.get("observacao") ?? "").trim();
  if (!nome) return { ok: false, message: "Informe o nome do grupo." };
  if (!LADOS.includes(lado)) return { ok: false, message: "Lado inválido." };
  const max = maxRaw ? Number.parseInt(maxRaw, 10) : null;

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_guest_groups").insert({
    nome,
    lado: lado || null,
    max_convidados: max !== null && Number.isFinite(max) ? max : null,
    observacao: observacao || null,
  });
  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "convidados", acao: "create_grupo", valorNovo: { nome } });
  revalidatePath("/admin/grupos");
  revalidatePath("/admin/convidados");
  return { ok: true, message: `Grupo "${nome}" criado.` };
}

/** Edita um grupo. */
export async function atualizarGrupo(_prev: GrupoState, formData: FormData): Promise<GrupoState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const lado = String(formData.get("lado") ?? "").trim();
  const maxRaw = String(formData.get("max_convidados") ?? "").trim();
  const observacao = String(formData.get("observacao") ?? "").trim();
  if (!id) return { ok: false, message: "Grupo inválido." };
  if (!nome) return { ok: false, message: "Informe o nome." };
  if (!LADOS.includes(lado)) return { ok: false, message: "Lado inválido." };
  const max = maxRaw ? Number.parseInt(maxRaw, 10) : null;

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_guest_groups")
    .update({ nome, lado: lado || null, max_convidados: max !== null && Number.isFinite(max) ? max : null, observacao: observacao || null })
    .eq("id", id);
  if (error) return { ok: false, message: "Não foi possível salvar." };

  await logAudit(supabase, { modulo: "convidados", acao: "update_grupo", registro: `hg_guest_groups:${id}`, valorNovo: { nome } });
  revalidatePath("/admin/grupos");
  revalidatePath("/admin/convidados");
  return { ok: true, message: `${nome} atualizado.` };
}

/** Exclui um grupo — desvincula os convidados (group_id nulo) e remove o grupo. */
export async function excluirGrupo(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;

  await supabase.from("hg_guests").update({ group_id: null }).eq("group_id", id);
  const { error } = await supabase.from("hg_guest_groups").delete().eq("id", id);
  if (!error) {
    await logAudit(supabase, { modulo: "convidados", acao: "delete_grupo", registro: `hg_guest_groups:${id}` });
    revalidatePath("/admin/grupos");
    revalidatePath("/admin/convidados");
  }
}
