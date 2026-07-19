"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface RsvpState {
  ok: boolean;
  message: string;
}

/**
 * Confirmação de presença por TOKEN do convite (fluxo seguro, PROJECT_SPEC §7).
 * Usa a função SECURITY DEFINER `hg_rsvp_confirm` — o convidado só altera o próprio
 * registro pelo token, sem acesso à tabela (LGPD / regra 36).
 */
export async function confirmarPresenca(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const token = String(formData.get("token") ?? "").trim();
  const presenca = String(formData.get("presenca") ?? "");
  const mensagem = String(formData.get("mensagem") ?? "").trim();

  if (!token) return { ok: false, message: "Link do convite inválido." };
  if (presenca !== "sim" && presenca !== "nao") {
    return { ok: false, message: "Diga se você poderá comparecer." };
  }

  const status = presenca === "sim" ? "confirmado" : "recusado";
  const supabase = createClient();

  if (!supabase) {
    return {
      ok: true,
      message: status === "confirmado" ? "Presença confirmada (modo demonstração)." : "Ausência registrada (modo demonstração).",
    };
  }

  const { data, error } = await supabase.rpc("hg_rsvp_confirm", {
    p_token: token,
    p_status: status,
    p_mensagem: mensagem,
  });

  if (error) {
    logger.error("Falha ao confirmar RSVP", { code: error.code });
    return { ok: false, message: "Não foi possível confirmar. Verifique o link do seu convite." };
  }

  const primeiroNome = String(data ?? "").split(" ")[0];
  return {
    ok: true,
    message:
      status === "confirmado"
        ? `Obrigado, ${primeiroNome}! Sua presença está confirmada. 🤍`
        : `Vamos sentir sua falta, ${primeiroNome}. Obrigado por avisar!`,
  };
}
