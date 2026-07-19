/**
 * Montagem de audiência da campanha (§7). Função pura: recebe a lista de pessoas
 * e os filtros e devolve incluídos + excluídos (com o motivo). A deduplicação e a
 * checagem de consentimento por pessoa ficam no fluxo da campanha (idempotency/consent).
 */

export interface PessoaAudiencia {
  id: string;
  nome: string;
  lado?: string | null;
  status?: string | null; // RSVP: confirmado | pendente | recusado
  telefone?: string | null;
  ehCrianca?: boolean | null;
  ehPadrinho?: boolean | null;
  cidadePartida?: string | null;
  optOut?: boolean | null;
}

export interface FiltrosAudiencia {
  lado?: "" | "helena" | "guilherme" | "ambos";
  status?: "" | "confirmado" | "pendente" | "recusado";
  telefone?: "" | "com" | "sem";
  incluirCriancas?: boolean;
  apenasPadrinhos?: boolean;
  apenasOutraCidade?: boolean;
  incluirOptOut?: boolean; // padrão: false (nunca envia a quem saiu)
}

export interface ResultadoAudiencia {
  incluidos: PessoaAudiencia[];
  excluidos: { pessoa: PessoaAudiencia; motivo: string }[];
}

/** Aplica os filtros e explica cada exclusão. Não remove duplicados aqui. */
export function filtrarAudiencia(
  pessoas: PessoaAudiencia[],
  filtros: FiltrosAudiencia,
): ResultadoAudiencia {
  const incluidos: PessoaAudiencia[] = [];
  const excluidos: { pessoa: PessoaAudiencia; motivo: string }[] = [];

  for (const p of pessoas) {
    let motivo: string | null = null;

    if (!filtros.incluirOptOut && p.optOut) motivo = "opt_out";
    else if (filtros.lado && p.lado && p.lado !== filtros.lado && p.lado !== "ambos") motivo = "lado";
    else if (filtros.status && (p.status ?? "pendente") !== filtros.status) motivo = "rsvp";
    else if (filtros.telefone === "com" && !p.telefone) motivo = "sem_telefone";
    else if (filtros.telefone === "sem" && p.telefone) motivo = "tem_telefone";
    else if (!filtros.incluirCriancas && p.ehCrianca) motivo = "crianca";
    else if (filtros.apenasPadrinhos && !p.ehPadrinho) motivo = "nao_padrinho";
    else if (filtros.apenasOutraCidade && !p.cidadePartida) motivo = "sem_cidade_partida";

    if (motivo) excluidos.push({ pessoa: p, motivo });
    else incluidos.push(p);
  }

  return { incluidos, excluidos };
}

/** Rótulos legíveis para os motivos de exclusão. */
export const MOTIVO_LABEL: Record<string, string> = {
  opt_out: "Optou por não receber",
  lado: "Lado diferente do filtro",
  rsvp: "RSVP fora do filtro",
  sem_telefone: "Sem telefone",
  tem_telefone: "Já tem telefone",
  crianca: "Criança (excluída)",
  nao_padrinho: "Não é padrinho",
  sem_cidade_partida: "Sem cidade de partida",
};
