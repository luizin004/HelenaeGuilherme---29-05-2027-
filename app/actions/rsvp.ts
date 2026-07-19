"use server";

import { createClient } from "@/lib/supabase/server";
import { rsvpSchema } from "@/validations/rsvp";
import { logger } from "@/lib/logger";

export interface RsvpState {
  ok: boolean;
  message: string;
}

/**
 * Confirmação de presença (RSVP) do site público.
 * Valida com Zod e grava/atualiza o convidado no banco. Em modo demonstração
 * (sem backend), apenas valida e responde.
 */
export async function submitRsvp(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const parsed = rsvpSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    acompanhantes: formData.get("acompanhantes"),
    presenca: formData.get("presenca"),
    mensagem: formData.get("mensagem"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Verifique os dados e tente novamente.";
    return { ok: false, message: first };
  }

  const { nome, email, telefone, acompanhantes, presenca, mensagem } = parsed.data;
  const primeiroNome = nome.split(" ")[0];
  const status = presenca === "sim" ? "confirmado" : "recusado";

  const supabase = createClient();

  if (supabase) {
    const observacao =
      acompanhantes > 0 ? `Acompanhantes: ${acompanhantes}. ${mensagem ?? ""}`.trim() : mensagem || null;

    const { error } = await supabase.from("guests").insert({
      nome,
      email: email || null,
      telefone: telefone || null,
      status,
      mensagem: observacao,
      respondeu_em: new Date().toISOString(),
    });

    if (error) {
      logger.error("Falha ao registrar RSVP", { code: error.code });
      return { ok: false, message: "Não foi possível registrar agora. Tente novamente em instantes." };
    }
  }

  return {
    ok: true,
    message:
      status === "confirmado"
        ? `Obrigado, ${primeiroNome}! Sua presença está confirmada. 🤍`
        : `Vamos sentir sua falta, ${primeiroNome}. Obrigado por avisar!`,
  };
}
