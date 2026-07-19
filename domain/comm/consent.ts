/**
 * Regras de envio (§19) e validações obrigatórias (§31).
 * Funções puras: recebem o estado e decidem se PODE enviar, sem efeitos colaterais.
 * Nada aqui envia — o envio real depende do canal validado (provedor).
 */

export type Canal = "whatsapp" | "email" | "audio";

export interface PerfilEnvio {
  optOut?: boolean;
  aceitaWhatsapp?: boolean;
  aceitaEmail?: boolean;
  aceitaAudio?: boolean;
  aceitaLembretes?: boolean;
  telefone?: string | null;
  email?: string | null;
}

export interface JanelaEnvio {
  /** minutos desde a meia-noite (horário local America/Sao_Paulo) do momento do envio */
  agoraMin: number;
  inicioMin: number; // ex.: 8h = 480
  fimMin: number; // ex.: 20h = 1200
}

export interface ContextoEnvio {
  canal: Canal;
  perfil: PerfilEnvio;
  /** canal oficial validado? (WhatsApp pendente => não envia — §31.1) */
  canalValidado: boolean;
  /** mensagens já enviadas à pessoa na janela de frequência */
  enviosRecentes: number;
  limitePorPessoa: number;
  /** a mensagem exige aprovação e ainda não foi aprovada? (§20/§31.6) */
  aprovacaoPendente?: boolean;
  /** mensagem opcional (lembrete não essencial) — exige aceitaLembretes */
  opcional?: boolean;
  janela?: JanelaEnvio;
}

export interface ResultadoEnvio {
  ok: boolean;
  motivo?: string;
}

/** Valida telefone brasileiro em formato mínimo (DDD + número). Não formata. */
export function telefoneValido(tel?: string | null): boolean {
  if (!tel) return false;
  const digitos = tel.replace(/\D/g, "");
  // com DDI 55: 12–13 dígitos; sem DDI: 10–11 dígitos
  return digitos.length >= 10 && digitos.length <= 13;
}

/** True se `agoraMin` está dentro de [inicioMin, fimMin]. */
export function dentroDaJanela(j: JanelaEnvio): boolean {
  return j.agoraMin >= j.inicioMin && j.agoraMin <= j.fimMin;
}

/**
 * Hora local (minutos desde meia-noite) num fuso IANA. Usa Intl — determinístico
 * dado um Date. Mantido fora de `podeEnviar` para os testes serem puros.
 */
export function minutosLocais(date: Date, timeZone = "America/Sao_Paulo"): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const partes = fmt.formatToParts(date);
  const h = Number(partes.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(partes.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

/**
 * Decide se uma mensagem pode ser enviada AGORA para a pessoa.
 * Ordem de checagem espelha as validações do §31.
 */
export function podeEnviar(ctx: ContextoEnvio): ResultadoEnvio {
  const { perfil } = ctx;

  if (!ctx.canalValidado) return { ok: false, motivo: "canal_nao_validado" };
  if (perfil.optOut) return { ok: false, motivo: "opt_out" };
  if (ctx.aprovacaoPendente) return { ok: false, motivo: "aprovacao_pendente" };

  // consentimento por canal
  if (ctx.canal === "whatsapp") {
    if (perfil.aceitaWhatsapp === false) return { ok: false, motivo: "sem_consentimento_whatsapp" };
    if (!telefoneValido(perfil.telefone)) return { ok: false, motivo: "telefone_invalido" };
  }
  if (ctx.canal === "email" && perfil.aceitaEmail === false) {
    return { ok: false, motivo: "sem_consentimento_email" };
  }
  if (ctx.canal === "audio" && perfil.aceitaAudio === false) {
    return { ok: false, motivo: "sem_consentimento_audio" };
  }

  // mensagem opcional exige aceite de lembretes
  if (ctx.opcional && perfil.aceitaLembretes === false) {
    return { ok: false, motivo: "sem_consentimento_lembretes" };
  }

  // horário silencioso
  if (ctx.janela && !dentroDaJanela(ctx.janela)) {
    return { ok: false, motivo: "fora_da_janela" };
  }

  // limite de frequência
  if (ctx.enviosRecentes >= ctx.limitePorPessoa) {
    return { ok: false, motivo: "limite_frequencia" };
  }

  return { ok: true };
}
