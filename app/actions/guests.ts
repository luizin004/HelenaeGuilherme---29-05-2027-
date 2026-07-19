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
