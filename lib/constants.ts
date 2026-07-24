import type { Venue } from "@/lib/database.types";

/** Dados centrais do casamento (fallback quando o banco não está conectado). */
export const WEDDING = {
  noiva: "Helena",
  noivo: "Guilherme",
  conceito: "O início do nosso maior projeto",
  /** Data e hora oficial — 29/05/2027 15h (America/Sao_Paulo, UTC-3). */
  dataISO: "2027-05-29T15:00:00-03:00",
  dataExtenso: "29 de Maio de 2027",
  timezone: "America/Sao_Paulo",
  /** Prazo inicial do RSVP (configurável no painel). */
  rsvpDeadlineISO: "2027-03-30T23:59:59-03:00",
  traje: "Esporte fino completo",
  cidade: "Itabira — Minas Gerais",
} as const;

/**
 * Locais confirmados (endereços fornecidos pelo cliente).
 * Coordenadas/links de mapa: PENDENTE (ver docs/PENDING_DECISIONS.md → PEND-002).
 * `maps_url` nulo → o site usa busca por nome; o painel exibe "Localização digital pendente".
 */
export const VENUES_FALLBACK: Venue[] = [
  {
    id: "cerimonia",
    tipo: "cerimonia",
    nome: "Igreja Nossa Senhora da Piedade",
    endereco: "Campestre, Itabira — MG",
    cidade: "Itabira — MG",
    horario: "15h00",
    latitude: null,
    longitude: null,
    maps_url: null,
    ordem: 1,
  },
  {
    id: "recepcao",
    tipo: "recepcao",
    nome: "Sítio Rancho das Águas",
    endereco: "Itabira — MG (sentido João Monlevade)",
    cidade: "Itabira — MG",
    horario: null,
    latitude: null,
    longitude: null,
    maps_url: null,
    ordem: 2,
  },
];

/**
 * Navegação principal do site — TODAS as telas acessíveis pelo cabeçalho.
 * Âncoras (#) rolam para as seções da home; caminhos (/) abrem as páginas.
 * Mantida em sincronia com o rodapé (components/public/Footer.tsx).
 */
export const NAV_LINKS = [
  { href: "/#historia", label: "Nossa história" },
  { href: "/#detalhes", label: "O grande dia" },
  { href: "/#festa", label: "A festa" },
  { href: "/#galeria", label: "Galeria" },
  { href: "/cerimonia", label: "Cerimônia" },
  { href: "/recepcao", label: "Recepção" },
  { href: "/como-chegar", label: "Como chegar" },
  { href: "/hospedagem", label: "Hospedagem" },
  { href: "/programacao", label: "Programação" },
  { href: "/duvidas", label: "Dúvidas" },
  { href: "/presentes", label: "Presentes" },
  { href: "/rancho", label: "O espaço (Rancho)" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos" },
] as const;

/** Cardápio da recepção (dados fornecidos pelo casal). */
export const CARDAPIO: { nome: string; descricao: string; tag: string }[] = [
  { nome: "Churrasco fogo de chão", descricao: "Costelão, picanha, leitoa e salmão na brasa", tag: "Principal" },
  { nome: "Buffet gourmet", descricao: "Pratos quentes e acompanhamentos", tag: "Buffet" },
  { nome: "Mesa gourmet", descricao: "Estação com curadoria especial", tag: "Estação" },
  { nome: "Pizza volante", descricao: "Pizzas artesanais passando pela festa", tag: "Volante" },
  { nome: "Doces finos", descricao: "Confeitaria para adoçar a noite", tag: "Doce" },
  { nome: "Açaí", descricao: "Estação de açaí", tag: "Estação" },
  { nome: "Sorvete", descricao: "Para refrescar a celebração", tag: "Estação" },
];

/** Atrações musicais (dados fornecidos pelo casal). */
export const ATRACOES: { nome: string; tipo: string }[] = [
  { nome: "Rock Bar", tipo: "Banda" },
  { nome: "Na Ideia", tipo: "Banda" },
  { nome: "Calangodum", tipo: "Banda" },
  { nome: "Zé Pretim", tipo: "Banda" },
  { nome: "DJ Vinicius Mendes", tipo: "DJ" },
];

/**
 * Etapas da rota até o Rancho das Águas (base: mapa enviado pelo casal).
 * A coordenada exata do portão ainda deve ser cadastrada para Maps/Waze precisos.
 */
export const ROTA_ETAPAS: { titulo: string; detalhe: string }[] = [
  { titulo: "Parque de Exposições", detalhe: "Siga em direção ao Parque de Exposições e continue pela via indicada." },
  { titulo: "Estrada do Forninho", detalhe: "Continue em direção à Estrada do Forninho." },
  { titulo: "Radar de 60 km/h", detalhe: "Após passar pelo radar de 60 km/h, siga por aproximadamente 1,5 km." },
  { titulo: "Placa do Sítio Rancho das Águas", detalhe: "Na placa indicativa do Sítio Rancho das Águas, vire à esquerda." },
  { titulo: "Pontos de referência", detalhe: "Use como referência o Pau de Angú, o Sítio Santa Cruz e o Sítio Drumond." },
  { titulo: "Trecho final", detalhe: "No trecho final, o Rancho das Águas estará à esquerda." },
];
