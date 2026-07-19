/**
 * Dados centralizados do site do Rancho das Águas (espaço para eventos).
 * Nada é inventado: endereço/coordenadas vêm do cadastro de Locais; capacidade,
 * preços, depoimentos e eventos realizados NÃO são exibidos até serem confirmados.
 */

export const RANCHO = {
  nome: "Rancho das Águas",
  tagline: "Espaço para eventos em Itabira — MG",
  cidade: "Itabira",
  estado: "MG",
  telefoneDisplay: "(31) 9 9118-8181",
  telefoneTel: "tel:+5531991188181",
  whatsappNumero: "5531991188181",
} as const;

/** Monta um link de WhatsApp com mensagem pré-preenchida. */
export function waLink(mensagem: string): string {
  return `https://wa.me/${RANCHO.whatsappNumero}?text=${encodeURIComponent(mensagem)}`;
}

export const WA_MSG = {
  visita: "Olá! Gostaria de agendar uma visita para conhecer o Rancho das Águas.",
  orcamento:
    "Olá! Conheci o Rancho das Águas pelo site e gostaria de solicitar um orçamento.\n\nTipo de evento:\nData prevista:\nNúmero aproximado de convidados:\nOutras informações:",
  informacoes: "Olá! Encontrei o Rancho das Águas pelo site e gostaria de mais informações sobre o espaço.",
  disponibilidade: "Olá! Gostaria de consultar a disponibilidade do Rancho das Águas para uma data.",
} as const;

/** Estrutura — apenas características confirmadas (natureza + ambiente do sítio). */
export const ESTRUTURA: { icone: string; titulo: string; descricao: string }[] = [
  { icone: "🌳", titulo: "Área ao ar livre", descricao: "Espaços abertos em meio à natureza para cerimônia e recepção." },
  { icone: "🌿", titulo: "Jardins e paisagem", descricao: "Ambiente verde e tranquilo, ideal para fotos e celebrações." },
  { icone: "⛺", titulo: "Área para estrutura", descricao: "Espaço para montagem de tenda e cobertura conforme o evento." },
  { icone: "🚗", titulo: "Estacionamento", descricao: "Estacionamento no local (capacidade limitada — combine caronas)." },
  { icone: "📸", titulo: "Cenários para fotos", descricao: "Diferentes pontos naturais para ensaios e registros." },
  { icone: "🤝", titulo: "Área de apoio", descricao: "Espaço de apoio para a operação do evento." },
];

/** Tipos de evento possíveis (mediante consulta — sem prometer nada). */
export const EVENTOS: string[] = [
  "Casamentos",
  "Aniversários",
  "Confraternizações",
  "Eventos familiares",
  "Encontros empresariais",
  "Ensaios fotográficos",
  "Outros eventos mediante consulta",
];

export const EVENTO_OPCOES: string[] = [
  "Casamento",
  "Aniversário",
  "Confraternização",
  "Evento empresarial",
  "Ensaio fotográfico",
  "Outro",
];

export const FAQ_RANCHO: { p: string; r: string }[] = [
  { p: "Como faço para conhecer o espaço?", r: "É só falar com a gente pelo WhatsApp (31) 9 9118-8181 e combinar uma visita." },
  { p: "É necessário agendar uma visita?", r: "Sim, as visitas devem ser combinadas previamente pelo WhatsApp ou telefone." },
  { p: "Como solicitar um orçamento?", r: "Envie uma mensagem com o tipo de evento, a data prevista e o número aproximado de convidados. Preparamos uma proposta personalizada." },
  { p: "Quais tipos de eventos podem ser realizados?", r: "Casamentos, aniversários, confraternizações, encontros e ensaios — outros formatos mediante consulta." },
  { p: "Onde o Rancho das Águas está localizado?", r: "Em Itabira — MG. O endereço e a rota detalhada são enviados no contato e estão na seção de localização." },
  { p: "Existe estacionamento?", r: "Sim, no local, com capacidade limitada — sugerimos combinar caronas entre os convidados." },
  { p: "Posso realizar cerimônia e recepção no mesmo local?", r: "Sim, o espaço comporta cerimônia e recepção — os detalhes são alinhados na visita." },
  { p: "Qual é o telefone de contato?", r: "(31) 9 9118-8181 — atendimento também por WhatsApp." },
];
