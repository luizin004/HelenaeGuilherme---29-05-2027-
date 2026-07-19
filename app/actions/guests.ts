"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface GuestFormState {
  ok: boolean;
  message: string;
}

/** Cadastra um convidado (painel, autenticado). Gera qr_token automaticamente no banco. */
export async function criarConvidado(_prev: GuestFormState, formData: FormData): Promise<GuestFormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const ehCrianca = formData.get("eh_crianca") === "on";

  if (!nome) return { ok: false, message: "Informe o nome do convidado." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_guests").insert({
    nome,
    email: email || null,
    telefone: telefone || null,
    eh_crianca: ehCrianca,
  });

  if (error) {
    return { ok: false, message: "Não foi possível salvar. Verifique se você está autenticado." };
  }

  await logAudit(supabase, { modulo: "convidados", acao: "create", valorNovo: { nome, ehCrianca } });
  revalidatePath("/admin/convidados");
  return { ok: true, message: `${nome.split(" ")[0]} foi adicionado à lista.` };
}

/** Edita um convidado (nome, contato, criança, mesa). */
export async function atualizarConvidado(_prev: GuestFormState, formData: FormData): Promise<GuestFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const mesa = String(formData.get("mesa") ?? "").trim();
  const ehCrianca = formData.get("eh_crianca") === "on";

  if (!id) return { ok: false, message: "Convidado inválido." };
  if (!nome) return { ok: false, message: "Informe o nome do convidado." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_guests")
    .update({
      nome,
      email: email || null,
      telefone: telefone || null,
      mesa: mesa || null,
      eh_crianca: ehCrianca,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique se você está autenticado." };

  await logAudit(supabase, {
    modulo: "convidados",
    acao: "update",
    registro: `hg_guests:${id}`,
    valorNovo: { nome, mesa: mesa || null, ehCrianca },
  });
  revalidatePath("/admin/convidados");
  return { ok: true, message: `${nome.split(" ")[0]} atualizado.` };
}

/** Exclusão LÓGICA (soft-delete) de um convidado. */
export async function excluirConvidado(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_guests")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (!error) {
    await logAudit(supabase, { modulo: "convidados", acao: "delete", registro: `hg_guests:${id}` });
    revalidatePath("/admin/convidados");
  }
}
