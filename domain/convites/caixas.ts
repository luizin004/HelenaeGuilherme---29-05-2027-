/**
 * Cálculo CENTRALIZADO de padrinhos, casais e produção de caixas/convites.
 * Regras de negócio ficam AQUI (nunca espalhadas nos componentes). Funções
 * puras e testáveis. Nada é inventado: tudo vem dos dados reais do banco.
 *
 * Conceitos (mantidos separados de propósito):
 *  • Pessoa/convidado  → tem um "papel" no casamento.
 *  • Par/casal         → exatamente 2 padrinhos/madrinhas vinculados.
 *  • Caixa             → 1 por casal; ou 1 por padrinho marcado como individual.
 *  • Kit               → o que é entregue (caixa + convites grande/pequenos).
 */

export type PapelCasamento =
  | "convidado"
  | "padrinho"
  | "madrinha"
  | "pai_noiva"
  | "mae_noiva"
  | "pai_noivo"
  | "mae_noivo"
  | "dama"
  | "pajem"
  | "familiar_cerimonia"
  | "responsavel_crianca"
  | "convidado_especial"
  | "fornecedor"
  | "cerimonial"
  | "outro";

export const PAPEIS: { value: PapelCasamento; label: string }[] = [
  { value: "convidado", label: "Convidado" },
  { value: "padrinho", label: "Padrinho" },
  { value: "madrinha", label: "Madrinha" },
  { value: "pai_noiva", label: "Pai da noiva" },
  { value: "mae_noiva", label: "Mãe da noiva" },
  { value: "pai_noivo", label: "Pai do noivo" },
  { value: "mae_noivo", label: "Mãe do noivo" },
  { value: "dama", label: "Dama" },
  { value: "pajem", label: "Pajem" },
  { value: "familiar_cerimonia", label: "Familiar com participação na cerimônia" },
  { value: "responsavel_crianca", label: "Responsável por criança" },
  { value: "convidado_especial", label: "Convidado especial" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "cerimonial", label: "Cerimonial" },
  { value: "outro", label: "Outro" },
];

/** Padrinho e madrinha entram na lista de padrinhos (e na contagem de caixas). */
export function ehPadrinho(papel: string | null | undefined): boolean {
  return papel === "padrinho" || papel === "madrinha";
}

// ————————————————————————————————————————————————— Contagem de caixas

export interface PadrinhoBase {
  id: string;
  papel: string;
  caixa_individual: boolean;
}

export interface ParBase {
  member_a: string | null;
  member_b: string | null;
}

export interface CaixasResumo {
  totalPadrinhos: number;
  totalPadrinhosHomens: number;
  totalMadrinhas: number;
  casaisVinculados: number;
  semPar: number;
  caixasConfirmadas: number;
  caixasIndividuais: number;
  caixasPendentes: number;
  /** Previsão MÁXIMA: cada pendente vira 1 caixa individual (não é o total final). */
  previsaoMaxCaixas: number;
}

/**
 * Resumo de padrinhos e caixas a partir dos dados reais.
 *  • casaisVinculados = pares ativos com 2 integrantes válidos (padrinhos existentes).
 *  • semPar = padrinhos sem par ativo E sem caixa individual (pendentes).
 *  • caixasConfirmadas = casais + caixas individuais.
 *  • caixasPendentes = padrinhos sem definição.
 *  • previsaoMaxCaixas = confirmadas + pendentes.
 */
export function resumoCaixas(padrinhos: PadrinhoBase[], pares: ParBase[]): CaixasResumo {
  const ativos = padrinhos.filter((p) => ehPadrinho(p.papel));
  const validos = new Set(ativos.map((p) => p.id));

  // Pares válidos: 2 membros distintos, ambos padrinhos existentes.
  const emPar = new Set<string>();
  let casaisVinculados = 0;
  for (const par of pares) {
    const a = par.member_a;
    const b = par.member_b;
    if (!a || !b || a === b) continue;
    if (!validos.has(a) || !validos.has(b)) continue;
    if (emPar.has(a) || emPar.has(b)) continue; // pessoa em no máximo 1 par
    emPar.add(a);
    emPar.add(b);
    casaisVinculados += 1;
  }

  const foraDePar = ativos.filter((p) => !emPar.has(p.id));
  const caixasIndividuais = foraDePar.filter((p) => p.caixa_individual).length;
  const semPar = foraDePar.filter((p) => !p.caixa_individual).length;

  const caixasConfirmadas = casaisVinculados + caixasIndividuais;
  const caixasPendentes = semPar;

  return {
    totalPadrinhos: ativos.length,
    totalPadrinhosHomens: ativos.filter((p) => p.papel === "padrinho").length,
    totalMadrinhas: ativos.filter((p) => p.papel === "madrinha").length,
    casaisVinculados,
    semPar,
    caixasConfirmadas,
    caixasIndividuais,
    caixasPendentes,
    previsaoMaxCaixas: caixasConfirmadas + caixasPendentes,
  };
}

// ————————————————————————————————————————————————— Kits e convites pequenos

export type RegraPequenos =
  | "por_integrante"
  | "por_adulto"
  | "por_adulto_jovem"
  | "fixo"
  | "nenhum";

export interface Kit {
  id: string;
  label: string;
  caixas: number;
  convitesGrandes: number;
  regraPequenos: RegraPequenos;
  fixoPequenos?: number;
}

/** Catálogo inicial de kits (configurável no futuro; regra centralizada aqui). */
export const KITS: Record<string, Kit> = {
  familiar: { id: "familiar", label: "Convite familiar", caixas: 0, convitesGrandes: 1, regraPequenos: "por_adulto_jovem" },
  solo: { id: "solo", label: "Convite solo", caixas: 0, convitesGrandes: 1, regraPequenos: "nenhum" },
  padrinhos_casal: { id: "padrinhos_casal", label: "Kit padrinhos (casal)", caixas: 1, convitesGrandes: 1, regraPequenos: "por_integrante" },
  padrinhos_individual: { id: "padrinhos_individual", label: "Kit padrinho (individual)", caixas: 1, convitesGrandes: 1, regraPequenos: "por_integrante" },
  pais: { id: "pais", label: "Kit pais", caixas: 1, convitesGrandes: 1, regraPequenos: "por_integrante" },
  personalizado: { id: "personalizado", label: "Kit personalizado", caixas: 0, convitesGrandes: 1, regraPequenos: "nenhum" },
};

export type FaixaEtaria = "adulto" | "jovem" | "crianca";

/** Normaliza o campo (compat: eh_crianca → 'crianca'). */
export function normalizarFaixa(faixa: string | null | undefined, ehCrianca = false): FaixaEtaria {
  if (faixa === "adulto" || faixa === "jovem" || faixa === "crianca") return faixa;
  return ehCrianca ? "crianca" : "adulto";
}

/** Quantidade de convites pequenos de um grupo, conforme a regra do kit. */
export function convitesPequenos(
  kit: Kit,
  integrantes: { faixa: FaixaEtaria }[],
  manual?: number | null,
): number {
  if (manual != null && manual >= 0) return Math.floor(manual); // ajuste manual vence
  switch (kit.regraPequenos) {
    case "por_integrante":
      return integrantes.length;
    case "por_adulto":
      return integrantes.filter((i) => i.faixa === "adulto").length;
    case "por_adulto_jovem":
      return integrantes.filter((i) => i.faixa === "adulto" || i.faixa === "jovem").length;
    case "fixo":
      return Math.max(0, kit.fixoPequenos ?? 0);
    case "nenhum":
    default:
      return 0;
  }
}

export interface ProducaoGrupo {
  caixas: number;
  convitesGrandes: number;
  convitesPequenos: number;
}

/** Produção de UM grupo (caixas + convites) a partir do kit e dos integrantes. */
export function producaoGrupo(
  kitId: string,
  integrantes: { faixa: FaixaEtaria }[],
  manualPequenos?: number | null,
): ProducaoGrupo {
  const kit = KITS[kitId] ?? KITS.familiar;
  return {
    caixas: kit.caixas,
    convitesGrandes: kit.convitesGrandes,
    convitesPequenos: convitesPequenos(kit, integrantes, manualPequenos),
  };
}

/** Soma a produção de vários grupos (lista para gráfica / resumo). */
export function somarProducao(grupos: ProducaoGrupo[]): ProducaoGrupo {
  return grupos.reduce<ProducaoGrupo>(
    (t, g) => ({
      caixas: t.caixas + g.caixas,
      convitesGrandes: t.convitesGrandes + g.convitesGrandes,
      convitesPequenos: t.convitesPequenos + g.convitesPequenos,
    }),
    { caixas: 0, convitesGrandes: 0, convitesPequenos: 0 },
  );
}
