"use server";

import { createClient } from "@/lib/supabase/server";

export interface RsvpState {
  ok: boolean;
  message: string;
}

/**
 * Confirmação de presença (RSVP) do site público.
 * Grava/atualiza o convidado no banco. Em modo demonstração (sem backend),
 * apenas valida e responde.
 */
export async function submitRsvp(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const acompanhantes = Number(formData.get("acompanhantes") ?? 0);
  const presenca = String(formData.get("presenca") ?? "");
  const mensagem = String(formData.get("mensagem") ?? "").trim();

  if (!nome) return { ok: false, message: "Por favor, informe seu nome." };
  if (presenca !== "sim" && presenca !== "nao") {
    return { ok: false, message: "Diga se você poderá comparecer." };
  }

  const primeiroNome = nome.split(" ")[0];
  const status = presenca === "sim" ? "confirmado" : "recusado";

  const supabase = createClient();

  if (supabase) {
    const observacao =
      acompanhantes > 0 ? `Acompanhantes: ${acompanhantes}. ${mensagem}`.trim() : mensagem || null;

    const { error } = await supabase.from("guests").insert({
      nome,
      email: email || null,
      telefone: telefone || null,
      status,
      mensagem: observacao,
      respondeu_em: new Date().toISOString(),
    });

    if (error) {
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
