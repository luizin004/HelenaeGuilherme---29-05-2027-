"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface RsvpState {
  ok: boolean;
  message: string;
  /** Preenchido quando alguém do grupo ficou confirmado: leva às credenciais. */
  conviteToken?: string;
}

/**
 * Registra os recados deixados no RSVP (texto, áudio e vídeo). Cada um vira uma
 * linha em `hg_recados` pela função SECURITY DEFINER — o convidado nunca toca a
 * tabela. Falha de recado não derruba a confirmação: a presença é o que importa.
 */
async function registrarRecados(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  token: string,
  formData: FormData,
): Promise<void> {
  const mensagem = String(formData.get("mensagem") ?? "").trim();
  const audioPath = String(formData.get("recado_audio_path") ?? "").trim();
  const audioDuracao = Number(formData.get("recado_audio_duracao") ?? 0);
  const videoPath = String(formData.get("recado_video_path") ?? "").trim();

  const recados: { tipo: string; mensagem?: string; arquivo?: string; duracao?: number }[] = [];
  if (mensagem) recados.push({ tipo: "texto", mensagem });
  if (audioPath) recados.push({ tipo: "audio", arquivo: audioPath, duracao: audioDuracao || undefined });
  if (videoPath) recados.push({ tipo: "video", arquivo: videoPath });

  for (const r of recados) {
    const { error } = await supabase.rpc("hg_rsvp_recado", {
      p_token: token,
      p_tipo: r.tipo,
      p_mensagem: r.mensagem ?? null,
      p_arquivo: r.arquivo ?? null,
      p_mime: null,
      p_duracao: r.duracao ?? null,
    });
    if (error) logger.error("Falha ao registrar recado do convidado", { tipo: r.tipo, code: error.code });
  }
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

  // Espaço infantil: crianças declaradas no RSVP alimentam a tela dos monitores.
  const nomes = formData.getAll("crianca_nome").map((v) => String(v).trim());
  const idades = formData.getAll("crianca_idade").map((v) => String(v).trim());
  const responsaveis = formData.getAll("crianca_responsavel").map((v) => String(v).trim());
  const obs = formData.getAll("crianca_obs").map((v) => String(v).trim());
  const criancas = nomes
    .map((nome, i) => ({ nome, idade: idades[i] ?? "", responsavel: responsaveis[i] ?? "", observacoes: obs[i] ?? "" }))
    .filter((c) => c.nome !== "");

  const usaEspaco = formData.get("espaco_infantil") === "on";
  let criancasRegistradas = 0;
  if (usaEspaco && criancas.length > 0) {
    const { data: kidsData, error: kidsErr } = await supabase.rpc("hg_rsvp_kids", {
      p_token: token,
      p_criancas: criancas,
    });
    if (kidsErr) {
      logger.error("Falha ao registrar crianças do espaço infantil", { code: kidsErr.code });
    } else {
      criancasRegistradas = Number(kidsData ?? 0);
    }
  }

  // Recados (texto, áudio, vídeo) — depois da confirmação, para nunca bloqueá-la.
  await registrarRecados(supabase, token, formData);

  const total = Number(data ?? 0);
  const sufixoKids = criancasRegistradas > 0 ? ` ${criancasRegistradas} criança(s) no espaço infantil.` : "";
  return {
    ok: true,
    message: anyConfirmado
      ? `Presença registrada para ${total} convidado(s).${sufixoKids} Obrigado! 🤍`
      : `Ausência registrada. Vamos sentir sua falta — obrigado por avisar!`,
    ...(anyConfirmado ? { conviteToken: token } : {}),
  };
}
