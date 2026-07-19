/**
 * Idempotência e deduplicação (§19, §31.13-14).
 * Impede mensagens duplicadas e a mesma pessoa em dois segmentos da campanha.
 */

/**
 * Chave determinística de idempotência para uma mensagem. A mesma combinação de
 * (campanha/fase, destinatário, canal, dia) gera SEMPRE a mesma chave → o índice
 * único em hg_comm_messages.idem_key barra o reenvio.
 */
export function chaveIdempotencia(p: {
  campaignId?: string | null;
  journeyStageId?: string | null;
  destinatarioId: string;
  canal: string;
  diaISO: string; // "2027-05-01" (dia local do agendamento)
}): string {
  const origem = p.campaignId ? `c:${p.campaignId}` : p.journeyStageId ? `s:${p.journeyStageId}` : "manual";
  return [origem, p.destinatarioId, p.canal, p.diaISO].join("|");
}

export interface AlvoAudiencia {
  destinatarioId: string;
  segmento?: string;
}

export interface DedupResult<T extends AlvoAudiencia> {
  unicos: T[];
  duplicados: T[];
  /** ids que apareceram em mais de um segmento (§31.14) */
  emVariosSegmentos: string[];
}

/** Remove destinatários repetidos, mantendo a primeira ocorrência. */
export function dedupAudiencia<T extends AlvoAudiencia>(alvos: T[]): DedupResult<T> {
  const vistos = new Set<string>();
  const segmentosPorId = new Map<string, Set<string>>();
  const unicos: T[] = [];
  const duplicados: T[] = [];

  for (const a of alvos) {
    if (a.segmento) {
      const set = segmentosPorId.get(a.destinatarioId) ?? new Set<string>();
      set.add(a.segmento);
      segmentosPorId.set(a.destinatarioId, set);
    }
    if (vistos.has(a.destinatarioId)) {
      duplicados.push(a);
    } else {
      vistos.add(a.destinatarioId);
      unicos.push(a);
    }
  }

  const emVariosSegmentos = [...segmentosPorId.entries()]
    .filter(([, segs]) => segs.size > 1)
    .map(([id]) => id);

  return { unicos, duplicados, emVariosSegmentos };
}
