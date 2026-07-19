/** Dados centrais do casamento (fallback quando o banco não está conectado). */
export const WEDDING = {
  noiva: "Helena",
  noivo: "Guilherme",
  /** Data e hora oficial (horário de Brasília, UTC-3). */
  dataISO: "2027-05-29T16:00:00-03:00",
  dataExtenso: "29 de Maio de 2027",
  cidade: "",
} as const;

export const NAV_LINKS = [
  { href: "#historia", label: "Nossa história" },
  { href: "#detalhes", label: "O grande dia" },
  { href: "#galeria", label: "Galeria" },
  { href: "#infantil", label: "Espaço infantil" },
  { href: "#presentes", label: "Presentes" },
] as const;
