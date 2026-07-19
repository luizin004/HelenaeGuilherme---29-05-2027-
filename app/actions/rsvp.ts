"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface RsvpState {
  ok: boolean;
  message: string;
}

/**
 * Confirmação de presença por TOKEN do convite, para o GRUPO inteiro
 * (regra 35 da spec: grupos familiares / acompanhantes autorizados).
 *
 * Usa a função SECURITY DEFINER `hg_rsvp_group_confirm` — o convidado só
 * altera registros do próprio grupo pelo token, sem acesso à tabela
 * (LGPD / regra 36). O prazo (30/03/2027) é validado dentro da função:
 * respostas após o prazo levantam exceção `prazo encerrado`.
 *
 * O formulário envia, para cada integrante, um campo `presenca_<id>` com
 * valor `sim`/`nao`. Montamos o array de confirmações a partir disso.
 */
export async function confirmarPresencaGrupo(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const token = String(formData.get("token") ?? "").trim();
  const mensagem = String(formData.get("mensagem") ?? "").trim();
  const transporte = String(formData.get("transporte") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "").trim();

  if (!token) return { ok: false, message: "Link do convite inválido." };

  // Extrai as respostas por integrante (campos "presenca_<uuid>" + "restricao_<uuid>").
  const confirmacoes: { guest_id: string; status: string; restricao?: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("presenca_")) continue;
    const guestId = key.slice("presenca_".length);
    const v = String(value);
    if (v !== "sim" && v !== "nao") continue;
    const restricao = String(formData.get(`restricao_${guestId}`) ?? "").trim();
    confirmacoes.push({ guest_id: guestId, status: v === "sim" ? "confirmado" : "recusado", ...(restricao ? { restricao } : {}) });
  }

  if (confirmacoes.length === 0) {
    return { ok: false, message: "Marque a presença de pelo menos um convidado." };
  }

  const anyConfirmado = confirmacoes.some((c) => c.status === "confirmado");
  const supabase = createClient();

  if (!supabase) {
    return {
      ok: true,
      message: anyConfirmado
        ? "Presença confirmada (modo demonstração)."
        : "Ausência registrada (modo demonstração).",
    };
  }

  const { data, error } = await supabase.rpc("hg_rsvp_group_confirm", {
    p_token: token,
    p_confirmacoes: confirmacoes,
    p_mensagem: mensagem,
    p_transporte: transporte,
    p_instagram: instagram,
  });

  if (error) {
    // A função levanta 'prazo encerrado' quando a resposta chega após 30/03/2027.
    if ((error.message ?? "").toLowerCase().includes("prazo")) {
      return {
        ok: false,
        message: "O prazo para confirmação (30/03/2027) foi encerrado. Fale com os noivos.",
      };
    }
    logger.error("Falha ao confirmar RSVP em grupo", { code: error.code });
    return { ok: false, message: "Não foi possível confirmar. Verifique o link do seu convite." };
  }

  const total = Number(data ?? 0);
  return {
    ok: true,
    message: anyConfirmado
      ? `Presença registrada para ${total} convidado(s). Obrigado! 🤍`
      : `Ausência registrada. Vamos sentir sua falta — obrigado por avisar!`,
  };
}
