"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface ChildFormState {
  ok: boolean;
  message: string;
}

/** Cadastra uma criança para o espaço infantil (painel, autenticado). */
export async function criarCrianca(_prev: ChildFormState, formData: FormData): Promise<ChildFormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const idadeRaw = String(formData.get("idade") ?? "").trim();
  const responsavelId = String(formData.get("responsavel_id") ?? "");
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  if (!nome) return { ok: false, message: "Informe o nome da criança." };

  const idade = idadeRaw ? Number.parseInt(idadeRaw, 10) : null;

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_children").insert({
    nome,
    idade: idade !== null && Number.isFinite(idade) ? idade : null,
    responsavel_id: responsavelId || null,
    observacoes: observacoes || null,
  });

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "infantil", acao: "create", valorNovo: { nome } });
  revalidatePath("/admin/infantil");
  return { ok: true, message: `${nome.split(" ")[0]} foi cadastrado(a).` };
}

/** Edita uma criança (nome, idade, responsável, cuidados, uso do espaço). */
export async function atualizarCrianca(_prev: ChildFormState, formData: FormData): Promise<ChildFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const idadeRaw = String(formData.get("idade") ?? "").trim();
  const responsavelId = String(formData.get("responsavel_id") ?? "");
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  const usaraEspaco = formData.get("usara_espaco") === "on";

  if (!id) return { ok: false, message: "Criança inválida." };
  if (!nome) return { ok: false, message: "Informe o nome." };

  const idade = idadeRaw ? Number.parseInt(idadeRaw, 10) : null;

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_children")
    .update({
      nome,
      idade: idade !== null && Number.isFinite(idade) ? idade : null,
      responsavel_id: responsavelId || null,
      observacoes: observacoes || null,
      usara_espaco: usaraEspaco,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "infantil", acao: "update", registro: `hg_children:${id}`, valorNovo: { nome, usaraEspaco } });
  revalidatePath("/admin/infantil");
  return { ok: true, message: `${nome.split(" ")[0]} atualizado(a).` };
}

/** Exclusão LÓGICA (soft-delete) de uma criança. */
export async function excluirCrianca(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_children")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (!error) {
    await logAudit(supabase, { modulo: "infantil", acao: "delete", registro: `hg_children:${id}` });
    revalidatePath("/admin/infantil");
  }
}
