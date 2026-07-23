/**
 * Temperamento automático de comunicação pelo VÍNCULO do convidado.
 *
 * Vínculo pessoal, papel no casamento, família e status são conceitos
 * DIFERENTES e nunca se substituem — só se COMBINAM. Ex.: uma irmã que também
 * é madrinha recebe a intimidade de irmã + o reconhecimento de madrinha, sem
 * perder nenhuma das duas camadas.
 *
 * Função pura e determinística: mesma entrada → mesma saída. Não decide nada
 * sozinha em situações sensíveis (sempre sinaliza `requiresApproval`) e nunca
 * autoriza apelido/humor/áudio sem que o operador tenha autorizado no cadastro.
 */

export type VinculoPrincipal =
  | "guilherme"
  | "helena"
  | "ambos"
  | "familia_guilherme"
  | "familia_helena"
  | "convidado_por_outro"
  | "relacao_profissional"
  | "outro";

export const VINCULOS_PRINCIPAIS: { value: VinculoPrincipal; label: string }[] = [
  { value: "guilherme", label: "Guilherme" },
  { value: "helena", label: "Helena" },
  { value: "ambos", label: "Ambos" },
  { value: "familia_guilherme", label: "Família de Guilherme" },
  { value: "familia_helena", label: "Família de Helena" },
  { value: "convidado_por_outro", label: "Convidado por outro integrante" },
  { value: "relacao_profissional", label: "Relação profissional" },
  { value: "outro", label: "Outro" },
];

export type TipoVinculo =
  | "pai" | "mae" | "padrasto" | "madrasta"
  | "irmao" | "irma" | "cunhado" | "cunhada"
  | "avo" | "avoa" | "tio" | "tia" | "primo" | "prima" | "sobrinho" | "sobrinha"
  | "familiar_proximo" | "familiar" | "familiar_distante"
  | "melhor_amigo" | "melhor_amiga" | "amigo_intimo" | "amiga_intima"
  | "amigo_proximo" | "amiga_proxima" | "amigo" | "amiga"
  | "amigo_casal" | "amiga_casal" | "amigo_infancia" | "amiga_infancia"
  | "colega_trabalho" | "ex_colega_trabalho" | "socio" | "parceiro_profissional"
  | "cliente" | "fornecedor" | "vizinho" | "vizinha" | "conhecido" | "conhecida"
  | "lider_religioso" | "convidado_institucional" | "outro";

export const TIPOS_VINCULO: { value: TipoVinculo; label: string }[] = [
  { value: "pai", label: "Pai" },
  { value: "mae", label: "Mãe" },
  { value: "padrasto", label: "Padrasto" },
  { value: "madrasta", label: "Madrasta" },
  { value: "irmao", label: "Irmão" },
  { value: "irma", label: "Irmã" },
  { value: "cunhado", label: "Cunhado" },
  { value: "cunhada", label: "Cunhada" },
  { value: "avo", label: "Avô" },
  { value: "avoa", label: "Avó" },
  { value: "tio", label: "Tio" },
  { value: "tia", label: "Tia" },
  { value: "primo", label: "Primo" },
  { value: "prima", label: "Prima" },
  { value: "sobrinho", label: "Sobrinho" },
  { value: "sobrinha", label: "Sobrinha" },
  { value: "familiar_proximo", label: "Familiar próximo" },
  { value: "familiar", label: "Familiar" },
  { value: "familiar_distante", label: "Familiar distante" },
  { value: "melhor_amigo", label: "Melhor amigo" },
  { value: "melhor_amiga", label: "Melhor amiga" },
  { value: "amigo_intimo", label: "Amigo íntimo" },
  { value: "amiga_intima", label: "Amiga íntima" },
  { value: "amigo_proximo", label: "Amigo próximo" },
  { value: "amiga_proxima", label: "Amiga próxima" },
  { value: "amigo", label: "Amigo" },
  { value: "amiga", label: "Amiga" },
  { value: "amigo_casal", label: "Amigo do casal" },
  { value: "amiga_casal", label: "Amiga do casal" },
  { value: "amigo_infancia", label: "Amigo de infância" },
  { value: "amiga_infancia", label: "Amiga de infância" },
  { value: "colega_trabalho", label: "Colega de trabalho" },
  { value: "ex_colega_trabalho", label: "Ex-colega de trabalho" },
  { value: "socio", label: "Sócio" },
  { value: "parceiro_profissional", label: "Parceiro profissional" },
  { value: "cliente", label: "Cliente" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "vizinho", label: "Vizinho" },
  { value: "vizinha", label: "Vizinha" },
  { value: "conhecido", label: "Conhecido" },
  { value: "conhecida", label: "Conhecida" },
  { value: "lider_religioso", label: "Líder religioso" },
  { value: "convidado_institucional", label: "Convidado institucional" },
  { value: "outro", label: "Outro vínculo personalizado" },
];

export type NivelProximidade = "muito_intimo" | "proximo" | "moderado" | "formal" | "pouco_proximo";

export const NIVEIS_PROXIMIDADE: { value: NivelProximidade; label: string }[] = [
  { value: "muito_intimo", label: "Muito íntimo" },
  { value: "proximo", label: "Próximo" },
  { value: "moderado", label: "Moderado" },
  { value: "formal", label: "Formal" },
  { value: "pouco_proximo", label: "Pouco próximo" },
];

export type StatusRsvp = "confirmado" | "pendente" | "recusado";
export type NivelEmoji = "none" | "low" | "moderate";
export type TamanhoMensagem = "short" | "medium" | "complete";

export interface TemperamentInput {
  nome?: string | null;
  vinculoPrincipal?: VinculoPrincipal | null;
  tipoVinculo?: TipoVinculo | null;
  proximidade?: NivelProximidade | null;
  /** Papel no casamento (fonte única: hg_guests.papel — domain/convites/caixas.ts). */
  papel?: string | null;
  status?: StatusRsvp | null;
  prazoRsvpProximo?: boolean; // true perto do prazo de confirmação
  ehCrianca?: boolean;
  ehJovem?: boolean;
  pessoaIdosa?: boolean; // sinal manual (não há data de nascimento no cadastro)
  outraCidade?: boolean; // cidadePartida preenchida e diferente da do evento
  contatoPrincipalFamilia?: boolean;
  situacaoSensivel?: boolean;
  forcarAprovacao?: boolean;
  apelidoAutorizado?: string | null; // só existe apelido se autorizado explicitamente
  humorAutorizado?: boolean; // humor nunca é ligado só pela categoria
  aceitaAudio?: boolean; // consentimento — default true
}

export interface TextoSugerido {
  tom: string;
  formalidade: string;
  tratamento: string;
  humor: string;
  tamanho: string;
}

export interface GuestCommunicationTemperament {
  profileName: string;
  formality: number; // 0-100
  affection: number; // 0-100
  objectivity: number; // 0-100
  humor: number; // 0-100
  urgency: number; // 0-100
  emojiLevel: NivelEmoji;
  messageLength: TamanhoMensagem;
  allowNickname: boolean;
  allowAudio: boolean;
  requiresApproval: boolean;
  toneInstructions: string[];
  avoidInstructions: string[];
  reasoningSummary: string;
  /** Rótulos prontos para preencher os campos de texto já existentes no perfil
   *  (tom/formalidade/tratamento/humor/tamanho) quando o operador aceita a sugestão. */
  sugestaoTexto: TextoSugerido;
}

interface Baseline {
  grupo: string;
  formality: number;
  affection: number;
  objectivity: number;
  humor: number;
  emojiLevel: NivelEmoji;
  messageLength: TamanhoMensagem;
  allowNicknameBase: boolean;
  toneInstructions: string[];
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Baseline por TIPO DE VÍNCULO (Fase 3 do spec). Bucketizado por categoria. */
function baselinePorVinculo(tipo: TipoVinculo | null | undefined): Baseline {
  const b = (grupo: string, formality: number, affection: number, objectivity: number, humor: number, emojiLevel: NivelEmoji, messageLength: TamanhoMensagem, allowNicknameBase: boolean, toneInstructions: string[]): Baseline => ({
    grupo, formality, affection, objectivity, humor, emojiLevel, messageLength, allowNicknameBase, toneInstructions,
  });

  switch (tipo) {
    case "pai":
    case "mae":
      return b("pais_dos_noivos", 25, 95, 55, 15, "low", "complete", true, [
        "reconhecer a importância deles no casamento — não são apenas convidados",
        "tratar cronograma, preparação, fotos e cerimônia com prioridade",
        "permitir mensagens assinadas diretamente pelos noivos",
      ]);
    case "padrasto":
    case "madrasta":
      return b("padrasto_madrasta", 35, 70, 50, 15, "low", "medium", false, [
        "afetivo e respeitoso, mas sem presumir a mesma intimidade de pai/mãe",
        "ajustar o tom ao nível de proximidade cadastrado",
      ]);
    case "irmao":
    case "irma":
      return b("irmaos", 10, 90, 30, 55, "moderate", "short", true, [
        "íntimo, afetivo e espontâneo",
      ]);
    case "cunhado":
    case "cunhada":
      return b("cunhados", 25, 65, 35, 40, "low", "short", false, [
        "acolhedor e próximo, seguindo a proximidade cadastrada",
      ]);
    case "avo":
    case "avoa":
      return b("avos", 40, 90, 70, 5, "none", "complete", false, [
        "linguagem simples e clara",
        "não depender exclusivamente de links, site ou QR Code",
        "mensagens mais cuidadosas",
      ]);
    case "tio":
    case "tia":
    case "familiar_proximo":
      return b("tios_familiares_proximos", 30, 75, 40, 30, "low", "medium", false, [
        "acolhedor, familiar e respeitoso",
      ]);
    case "primo":
    case "prima":
    case "sobrinho":
    case "sobrinha":
      return b("primos_sobrinhos", 20, 75, 30, 55, "moderate", "short", false, [
        "familiar, leve e acolhedor",
      ]);
    case "familiar":
    case "familiar_distante":
      return b("familiares_distantes", 65, 45, 55, 10, "low", "medium", false, [
        "elegante, respeitoso e cordial — menos íntimo",
        "sem apelidos automáticos",
      ]);
    case "melhor_amigo":
    case "melhor_amiga":
    case "amigo_intimo":
    case "amiga_intima":
      return b("melhores_amigos", 10, 95, 30, 60, "moderate", "short", true, [
        "afeto muito alto, espontâneo, formalidade baixa",
      ]);
    case "amigo_proximo":
    case "amiga_proxima":
      return b("amigos_proximos", 25, 75, 35, 45, "low", "short", false, [
        "afetivo, natural e alegre",
      ]);
    case "amigo_casal":
    case "amiga_casal":
      return b("amigos_do_casal", 25, 70, 40, 40, "low", "short", false, [
        "acolhedor e plural — tratar a relação com os dois noivos",
      ]);
    case "amigo_infancia":
    case "amiga_infancia":
      return b("amigos_infancia", 20, 80, 30, 50, "low", "short", true, [
        "afetivo e espontâneo, nostalgia na medida certa",
        "não inventar lembranças ou histórias que não estejam cadastradas",
      ]);
    case "amigo":
    case "amiga":
    case "conhecido":
    case "conhecida":
      return b("amigos_conhecidos", 45, 55, 45, 25, "low", "medium", false, [
        "cordial, elegante e acolhedor",
      ]);
    case "colega_trabalho":
    case "ex_colega_trabalho":
      return b("colegas_trabalho", 65, 40, 65, 10, "none", "medium", false, [
        "cordial, elegante e objetivo",
        "sem apelidos, salvo autorização",
      ]);
    case "socio":
    case "parceiro_profissional":
    case "cliente":
      return b("socios_clientes", 80, 40, 70, 5, "none", "medium", false, [
        "respeitoso, sofisticado e objetivo",
        "a comunicação deve parecer convite de casamento, não mensagem comercial",
      ]);
    case "fornecedor":
      return b("fornecedores", 75, 20, 85, 0, "none", "medium", false, [
        "profissional, direto, claro e organizado",
        "não incluir automaticamente nas jornadas dos convidados",
      ]);
    case "vizinho":
    case "vizinha":
      return b("vizinhos", 50, 55, 45, 20, "low", "medium", false, [
        "cordial, acolhedor e educado",
      ]);
    case "lider_religioso":
      return b("lideres_religiosos", 75, 45, 55, 5, "none", "medium", false, [
        "respeitoso, sensível e elegante",
        "não presumir crenças, títulos ou formas de tratamento — usar só o cadastrado",
      ]);
    case "convidado_institucional":
      return b("institucionais", 85, 30, 65, 0, "none", "medium", false, [
        "formal, elegante e objetivo",
        "sem apelidos, sem humor automático",
      ]);
    case "outro":
    default:
      return b("geral", 50, 50, 50, 20, "low", "medium", false, []);
  }
}

/** Ajuste pelo nível de proximidade cadastrado (Fase 1/3). */
function aplicarProximidade(base: Baseline, prox: NivelProximidade | null | undefined): Baseline {
  const ajustes: Record<NivelProximidade, { formality: number; affection: number; humor: number }> = {
    muito_intimo: { formality: -15, affection: 15, humor: 10 },
    proximo: { formality: -5, affection: 5, humor: 5 },
    moderado: { formality: 0, affection: 0, humor: 0 },
    formal: { formality: 15, affection: -10, humor: -10 },
    pouco_proximo: { formality: 20, affection: -20, humor: -15 },
  };
  const a = prox ? ajustes[prox] : ajustes.moderado;
  return {
    ...base,
    formality: clamp(base.formality + a.formality),
    affection: clamp(base.affection + a.affection),
    humor: clamp(base.humor + a.humor),
  };
}

/** Camada de papel no casamento (padrinhos, pais, etc.) — SOMA, não substitui. */
function aplicarPapel(
  base: Baseline,
  papel: string | null | undefined,
): { base: Baseline; requiresApproval: boolean; toneAdd: string[] } {
  const toneAdd: string[] = [];
  let requiresApproval = false;
  let { formality, affection, objectivity, humor } = base;

  if (papel === "padrinho" || papel === "madrinha") {
    affection = clamp(affection + 10);
    objectivity = clamp(objectivity + 10);
    requiresApproval = true;
    toneAdd.push(
      "honroso, participativo e exclusivo — reconhecer o papel de padrinho/madrinha",
      "incluir orientações práticas da jornada de padrinhos",
    );
  } else if (["pai_noivo", "mae_noivo", "pai_noiva", "mae_noiva"].includes(papel ?? "")) {
    affection = clamp(affection + 10);
    formality = clamp(formality - 10);
    requiresApproval = true;
  } else if (papel === "responsavel_crianca") {
    objectivity = clamp(objectivity + 15);
    toneAdd.push(
      "clareza e tranquilização sobre a criança",
      "usar nome e idade da criança somente se oficialmente confirmados",
    );
  } else if (papel === "fornecedor" || papel === "cerimonial") {
    formality = clamp(formality + 15);
    humor = clamp(humor - 15);
    objectivity = clamp(objectivity + 15);
    toneAdd.push("profissional e direto — não romantizar desnecessariamente");
  } else if (papel === "convidado_especial") {
    affection = clamp(affection + 10);
  }

  return { base: { ...base, formality, affection, objectivity, humor }, requiresApproval, toneAdd };
}

const REASONING_PAPEL: Record<string, string> = {
  padrinho: "padrinho do casamento",
  madrinha: "madrinha do casamento",
  pai_noivo: "pai do noivo",
  mae_noivo: "mãe do noivo",
  pai_noiva: "pai da noiva",
  mae_noiva: "mãe da noiva",
  responsavel_crianca: "responsável por criança",
  fornecedor: "fornecedor",
  cerimonial: "parte do cerimonial",
  convidado_especial: "convidado especial",
};

const TEXTO_FORMALIDADE = (v: number) => (v >= 70 ? "formal" : v >= 40 ? "moderada" : "informal");
const TEXTO_AFETO = (v: number) => (v >= 70 ? "afetuoso" : v >= 40 ? "cordial" : "neutro");
const TEXTO_HUMOR = (v: number) => (v >= 50 ? "leve, com humor quando autorizado" : v >= 20 ? "sóbrio, humor raro" : "sério, sem humor");
const TEXTO_TAMANHO: Record<TamanhoMensagem, string> = { short: "curto", medium: "médio", complete: "completo e detalhado" };

/**
 * Combina vínculo + proximidade + papel + status + modificadores (Fase 5).
 * Determinística e pura — sem acesso a rede/banco. A configuração manual do
 * operador tem prioridade e é aplicada FORA desta função (via sugestaoTexto).
 */
export function resolveGuestCommunicationTemperament(input: TemperamentInput): GuestCommunicationTemperament {
  const toneInstructions: string[] = [];
  const avoidInstructions: string[] = [];

  let base = baselinePorVinculo(input.tipoVinculo);
  toneInstructions.push(...base.toneInstructions);
  base = aplicarProximidade(base, input.proximidade ?? "moderado");

  const { base: comPapel, requiresApproval: reqPapel, toneAdd } = aplicarPapel(base, input.papel);
  toneInstructions.push(...toneAdd);
  let { formality, affection, objectivity, humor } = comPapel;
  let emojiLevel: NivelEmoji = comPapel.emojiLevel;
  let messageLength: TamanhoMensagem = comPapel.messageLength;
  let urgency = 15; // baseline sempre baixa — só sobe perto do prazo (regra 4)
  let requiresApproval = reqPapel;

  // ————— Modificadores de contexto (Fase 4)
  const status = input.status ?? "pendente";
  if (status === "confirmado") {
    affection = clamp(affection + 10);
    urgency = 0;
    toneInstructions.push("alegre e acolhedor, sem cobrança");
    avoidInstructions.push("pedir nova confirmação de presença");
  } else if (status === "pendente") {
    objectivity = clamp(objectivity + 10);
    if (input.prazoRsvpProximo) urgency = clamp(urgency + 30);
    avoidInstructions.push("constranger o convidado pela demora em responder");
  } else if (status === "recusado") {
    affection = clamp(affection + 5);
    formality = clamp(formality + 5);
    urgency = 0;
    avoidInstructions.push("pedir presença novamente", "novos pedidos de RSVP ou presentes");
    toneInstructions.push("respeito e delicadeza — encerrar o assunto de RSVP e presentes");
  }

  if (input.outraCidade) {
    objectivity = clamp(objectivity + 10);
    toneInstructions.push("incluir hospedagem, rota e transporte quando aplicável");
  }

  const pessoaIdosa = Boolean(input.pessoaIdosa);
  if (pessoaIdosa) {
    emojiLevel = "none";
    messageLength = "complete";
    toneInstructions.push("linguagem clara, instruções passo a passo, reduzir dependência de links/QR Code");
  }

  if (input.contatoPrincipalFamilia) {
    toneInstructions.push("linguagem coletiva para a família, evitando disparos duplicados");
  }

  const situacaoSensivel = Boolean(input.situacaoSensivel);
  if (situacaoSensivel) {
    humor = 0;
    requiresApproval = true;
    toneInstructions.push("cuidado redobrado — não tomar decisões automaticamente");
  }

  if (input.forcarAprovacao) requiresApproval = true;

  // Humor só é liberado com autorização explícita — nunca só pela categoria.
  if (!input.humorAutorizado) humor = Math.min(humor, 20);

  // Apelido e áudio: gated pelo consentimento real, nunca pela categoria sozinha.
  const allowNickname = base.allowNicknameBase && Boolean(input.apelidoAutorizado?.trim());
  const allowAudio = input.aceitaAudio !== false;

  formality = clamp(formality);
  affection = clamp(affection);
  objectivity = clamp(objectivity);
  humor = clamp(humor);
  urgency = clamp(urgency);

  const primeiroNome = (input.nome ?? "").trim().split(/\s+/)[0] || "A pessoa";
  const tipoLabel = TIPOS_VINCULO.find((t) => t.value === input.tipoVinculo)?.label?.toLowerCase();
  const proxLabel = NIVEIS_PROXIMIDADE.find((p) => p.value === input.proximidade)?.label?.toLowerCase();
  const papelLabel = input.papel ? REASONING_PAPEL[input.papel] : null;

  const partes: string[] = [];
  if (tipoLabel) partes.push(`é ${tipoLabel}`);
  if (papelLabel) partes.push(papelLabel);
  if (proxLabel) partes.push(`possui proximidade ${proxLabel}`);
  if (allowNickname) partes.push("permite o uso de apelido");
  const reasoningSummary = partes.length
    ? `Perfil sugerido porque ${primeiroNome} ${partes.join(", ")}.`
    : `Perfil sugerido com base nas informações disponíveis para ${primeiroNome}.`;

  const profileName = [base.grupo.replace(/_/g, " "), papelLabel].filter(Boolean).join(" · ");

  return {
    profileName,
    formality,
    affection,
    objectivity,
    humor,
    urgency,
    emojiLevel,
    messageLength,
    allowNickname,
    allowAudio,
    requiresApproval,
    toneInstructions: [...new Set(toneInstructions)],
    avoidInstructions: [...new Set(avoidInstructions)],
    reasoningSummary,
    sugestaoTexto: {
      tom: TEXTO_AFETO(affection),
      formalidade: TEXTO_FORMALIDADE(formality),
      tratamento: formality >= 70 ? "senhor(a)" : "você",
      humor: TEXTO_HUMOR(humor),
      tamanho: TEXTO_TAMANHO[messageLength],
    },
  };
}
