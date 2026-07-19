/**
 * Perfil de relacionamento (§3): o contexto da família pode ser herdado e o
 * perfil individual sobrescreve campo a campo (§3, Fase 3).
 */

export interface ContextoFamilia {
  tom?: string | null;
  formalidade?: string | null;
  tratamento?: string | null;
  assuntosPermitidos?: string | null;
  assuntosProibidos?: string | null;
  historiaAutorizada?: string | null;
}

export interface PerfilIndividual extends ContextoFamilia {
  herdarFamilia?: boolean;
}

/**
 * Resolve o contexto final. Quando `herdarFamilia` é true (padrão), começa da
 * família e sobrescreve com os campos preenchidos do indivíduo. Quando false,
 * usa apenas o indivíduo (a família é ignorada).
 */
export function resolverContexto(
  individual: PerfilIndividual | null | undefined,
  familia: ContextoFamilia | null | undefined,
): ContextoFamilia {
  const ind = individual ?? {};
  const herdar = ind.herdarFamilia !== false;
  const base: ContextoFamilia = herdar ? { ...(familia ?? {}) } : {};

  const campos: (keyof ContextoFamilia)[] = [
    "tom",
    "formalidade",
    "tratamento",
    "assuntosPermitidos",
    "assuntosProibidos",
    "historiaAutorizada",
  ];
  const out: ContextoFamilia = { ...base };
  for (const c of campos) {
    const v = ind[c];
    if (v !== undefined && v !== null && v !== "") out[c] = v;
  }
  return out;
}
