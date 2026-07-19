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

export const NAV_LINKS = [
  { href: "#historia", label: "Nossa história" },
  { href: "#detalhes", label: "O grande dia" },
  { href: "#galeria", label: "Galeria" },
  { href: "#infantil", label: "Espaço infantil" },
  { href: "#presentes", label: "Presentes" },
] as const;
