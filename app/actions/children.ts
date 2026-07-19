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
