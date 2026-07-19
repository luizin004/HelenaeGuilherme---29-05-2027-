"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface CommFormState {
  ok: boolean;
  message: string;
}

const CANAIS = ["email", "whatsapp", "sms"];
const PUBLICOS = ["todos", "confirmados", "pendentes", "recusados"];

/**
 * Salva um modelo/rascunho de comunicação. O ENVIO real depende de um provedor
 * (e-mail/WhatsApp) ainda não configurado — ver docs/PENDING_DECISIONS.md (PEND-006).
 */
export async function criarComunicado(_prev: CommFormState, formData: FormData): Promise<CommFormState> {
  const canal = String(formData.get("canal") ?? "email");
  const assunto = String(formData.get("assunto") ?? "").trim();
  const corpo = String(formData.get("corpo") ?? "").trim();
  const publico = String(formData.get("publico") ?? "todos");

  if (!corpo) return { ok: false, message: "Escreva a mensagem." };
  if (!CANAIS.includes(canal) || !PUBLICOS.includes(publico)) {
    return { ok: false, message: "Canal ou público inválido." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_communications").insert({
    canal,
    assunto: assunto || null,
    corpo,
    publico,
    status: "rascunho",
  });

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "comunicacao", acao: "create", valorNovo: { canal, publico } });
  revalidatePath("/admin/comunicacao");
  return { ok: true, message: "Rascunho salvo. O envio será ativado ao configurar o provedor." };
}
