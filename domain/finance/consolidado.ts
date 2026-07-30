/**
 * Relatório CONSOLIDADO — o resumo para decidir.
 *
 * O relatório detalhado lista tudo (cada item, cada parcela, cada evento).
 * Este cruza os mesmos números e responde às perguntas que importam:
 * o dinheiro em caixa cobre o que já foi assumido? quanto ainda falta
 * contratar? o que está vencido ou vencendo? onde o orçamento se concentra?
 *
 * Módulo puro: recebe os agregados, devolve as conclusões.
 */

import type { Cents } from "@/domain/money";

export interface EntradaConsolidado {
  /** Entradas registradas pelos responsáveis. */
  aportesCents: Cents;
  /** Pagamentos válidos já realizados. */
  pagoCents: Cents;
  /** Saldo em aberto das contas geradas. */
  pendenteCents: Cents;
  /** Pendente com vencimento no passado. */
  vencidoCents: Cents;
  /** Soma dos valores conhecidos das despesas não gratuitas. */
  custoConhecidoCents: Cents;
  /** Parcela do custo já em estado contratado/pago. */
  contratadoCents: Cents;
  /** Valor de mercado das cortesias (economia, não é saída). */
  economiaCents: Cents;
  itens: { total: number; comValor: number; semValor: number; gratuitos: number };
}

export type SituacaoCaixa = "coberto" | "apertado" | "descoberto";

export interface Consolidado extends EntradaConsolidado {
  /** Aportes − pagamentos: o que existe hoje em caixa. */
  saldoDisponivelCents: Cents;
  /** Aportes − custo conhecido: sobra (ou falta) se tudo for pago. */
  saldoAposCompromissosCents: Cents;
  /** Custo conhecido ainda não contratado (previsto/orçado com valor). */
  aContratarCents: Cents;
  /** Quanto do custo conhecido os aportes cobrem (0–100+, arredondado). */
  coberturaPct: number;
  /** Quanto do custo conhecido já foi pago (0–100, arredondado). */
  execucaoPct: number;
  situacao: SituacaoCaixa;
}

/** Percentual inteiro e seguro (base 0 não divide). */
function pct(parte: Cents, base: Cents): number {
  if (base <= 0) return 0;
  return Math.round((parte / base) * 100);
}

/**
 * Classifica a saúde do caixa:
 *  - descoberto: os aportes não cobrem o custo já conhecido;
 *  - apertado: cobrem, mas a folga é menor que 10% do custo;
 *  - coberto: folga confortável.
 * Sem custo conhecido ainda, considera-se coberto (não há o que cobrir).
 */
export function classificarCaixa(saldoAposCompromissos: Cents, custoConhecido: Cents): SituacaoCaixa {
  if (custoConhecido <= 0) return "coberto";
  if (saldoAposCompromissos < 0) return "descoberto";
  return saldoAposCompromissos < custoConhecido * 0.1 ? "apertado" : "coberto";
}

export function consolidar(e: EntradaConsolidado): Consolidado {
  const saldoDisponivelCents = e.aportesCents - e.pagoCents;
  const saldoAposCompromissosCents = e.aportesCents - e.custoConhecidoCents;
  const aContratarCents = Math.max(0, e.custoConhecidoCents - e.contratadoCents);

  return {
    ...e,
    saldoDisponivelCents,
    saldoAposCompromissosCents,
    aContratarCents,
    coberturaPct: pct(e.aportesCents, e.custoConhecidoCents),
    execucaoPct: pct(e.pagoCents, e.custoConhecidoCents),
    situacao: classificarCaixa(saldoAposCompromissosCents, e.custoConhecidoCents),
  };
}

/** Frase de leitura rápida no topo do relatório. */
export function leituraDoCaixa(c: Consolidado, formatar: (v: Cents) => string): string {
  if (c.custoConhecidoCents <= 0) {
    return "Ainda não há custos com valor definido — defina valores para o relatório projetar o caixa.";
  }
  if (c.situacao === "descoberto") {
    return `Os aportes cobrem ${c.coberturaPct}% do custo já conhecido. Faltam ${formatar(
      Math.abs(c.saldoAposCompromissosCents),
    )} para fechar tudo que já foi assumido.`;
  }
  if (c.situacao === "apertado") {
    return `Os aportes cobrem todo o custo conhecido, mas a folga é curta: ${formatar(
      c.saldoAposCompromissosCents,
    )} (${c.coberturaPct}% de cobertura). Novos itens sem valor podem virar o jogo.`;
  }
  return `Caixa confortável: os aportes cobrem ${c.coberturaPct}% do custo conhecido, com folga de ${formatar(
    c.saldoAposCompromissosCents,
  )} depois de pagar tudo que já foi assumido.`;
}

/** Pontos de atenção, do mais urgente ao menos — vazio significa tudo em dia. */
export function pontosDeAtencao(
  c: Consolidado,
  extras: { contratacoesVencidas: number; semPrazo: number; venceEm7Dias: number },
  formatar: (v: Cents) => string,
): string[] {
  const avisos: string[] = [];
  if (c.vencidoCents > 0) avisos.push(`${formatar(c.vencidoCents)} em contas vencidas — regularizar primeiro.`);
  if (extras.contratacoesVencidas > 0)
    avisos.push(`${extras.contratacoesVencidas} item(ns) passaram do prazo de contratação.`);
  if (c.situacao === "descoberto")
    avisos.push(`Faltam ${formatar(Math.abs(c.saldoAposCompromissosCents))} de aporte para cobrir o custo conhecido.`);
  if (extras.venceEm7Dias > 0) avisos.push(`${extras.venceEm7Dias} conta(s) vencem nos próximos 7 dias.`);
  if (c.itens.semValor > 0)
    avisos.push(`${c.itens.semValor} item(ns) ainda sem valor — o custo total tende a subir.`);
  if (extras.semPrazo > 0)
    avisos.push(`${extras.semPrazo} item(ns) pendentes sem prazo de contratação definido.`);
  return avisos;
}
