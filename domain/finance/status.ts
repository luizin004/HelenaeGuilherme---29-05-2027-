/**
 * Motor de status e agregação financeira — CAMADA ÚNICA de regras (§27).
 * Todas as telas (dashboard, contas, calendário, projeção, fluxo, relatórios)
 * devem usar estas funções. Nunca reimplementar "vencido/vence hoje/saldo"
 * dentro de um componente.
 *
 * Dinheiro em CENTAVOS inteiros. Datas em ISO "YYYY-MM-DD" (America/Sao_Paulo
 * resolvido na borda, via hojeISO()).
 */

import type { Cents } from "@/domain/money";

// ---------- Status ----------

/** Status calculado de uma conta/parcela (regras do §10). */
export type ContaStatus =
  | "pago"
  | "parcial"
  | "vencido"
  | "vence_hoje"
  | "a_pagar"
  | "previsto"
  | "cancelado"
  | "gratuito";

export interface StatusInput {
  /** Valor final da obrigação (cents). */
  valorCents: Cents;
  /** Soma dos pagamentos NÃO estornados (cents). */
  pagoCents: Cents;
  /** Data de vencimento ISO ou null. */
  vencimento: string | null;
  /** Data de previsão ISO (usada quando não há vencimento). */
  previsao?: string | null;
  /** Hoje em ISO (injetado para as funções serem puras/testáveis). */
  hoje: string;
  cancelado?: boolean;
  gratuito?: boolean;
}

/** Saldo pendente — nunca negativo. */
export function saldoCents(valorCents: Cents, pagoCents: Cents): Cents {
  return Math.max(0, valorCents - pagoCents);
}

/**
 * Regras automáticas (§10):
 *  cancelado → cancelado · gratuito → gratuito · pago ≥ valor → pago ·
 *  0 < pago < valor → parcial · vencimento < hoje → vencido ·
 *  vencimento = hoje → vence_hoje · vencimento futuro → a_pagar ·
 *  sem vencimento (só previsão ou nada) → previsto.
 */
export function statusConta(i: StatusInput): ContaStatus {
  if (i.cancelado) return "cancelado";
  if (i.gratuito) return "gratuito";
  if (i.valorCents > 0 && i.pagoCents >= i.valorCents) return "pago";
  if (i.pagoCents > 0) return "parcial";
  const ref = i.vencimento ?? null;
  if (ref) {
    if (ref < i.hoje) return "vencido";
    if (ref === i.hoje) return "vence_hoje";
    return "a_pagar";
  }
  return "previsto";
}

/** Dias de atraso (0 se não vencido). */
export function diasAtraso(vencimento: string | null, hoje: string): number {
  if (!vencimento || vencimento >= hoje) return 0;
  const a = new Date(`${vencimento}T00:00:00Z`).getTime();
  const b = new Date(`${hoje}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export const STATUS_LABEL: Record<ContaStatus, string> = {
  pago: "Pago",
  parcial: "Parcialmente pago",
  vencido: "Vencido",
  vence_hoje: "Vence hoje",
  a_pagar: "A pagar",
  previsto: "Previsto",
  cancelado: "Cancelado",
  gratuito: "Cortesia",
};

// ---------- Agrupamento mensal ----------

/** "2027-05-14" → "2027-05". */
export function ymOf(dateISO: string): string {
  return dateISO.slice(0, 7);
}

/** "2027-05" → "05/2027" (competência no padrão brasileiro). */
export function labelCompetencia(ym: string): string {
  const [ano, mes] = ym.split("-");
  return `${mes}/${ano}`;
}

const MESES_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2027-05" → "mai/2027". */
export function labelMesPT(ym: string): string {
  const [ano, mes] = ym.split("-");
  const idx = Number(mes) - 1;
  return `${MESES_PT[idx] ?? mes}/${ano}`;
}

/** Item genérico datado para agregação mensal. */
export interface ItemMensal {
  data: string | null; // ISO
  valorCents: Cents;
  pagoCents?: Cents;
  vencido?: boolean;
  tipo?: "saida" | "entrada";
}

export interface MesAgregado {
  ym: string;
  previstoCents: Cents;
  pagoCents: Cents;
  pendenteCents: Cents;
  vencidoCents: Cents;
  entradasCents: Cents;
  saidasCents: Cents;
  saldoCents: Cents;      // entradas − saídas do mês
  acumuladoCents: Cents;  // saldo acumulado até o mês
  qtde: number;
}

/**
 * Agrupa itens por mês (chave = data fornecida por quem chama — vencimento,
 * previsão, pagamento ou competência, conforme a visão) e calcula saldo mensal
 * e acumulado. Itens sem data ficam de fora (o chamador decide como exibi-los).
 */
export function agruparPorMes(itens: ItemMensal[]): { meses: MesAgregado[]; semData: ItemMensal[] } {
  const map = new Map<string, MesAgregado>();
  const semData: ItemMensal[] = [];

  for (const it of itens) {
    if (!it.data) {
      semData.push(it);
      continue;
    }
    const ym = ymOf(it.data);
    const m =
      map.get(ym) ??
      ({ ym, previstoCents: 0, pagoCents: 0, pendenteCents: 0, vencidoCents: 0, entradasCents: 0, saidasCents: 0, saldoCents: 0, acumuladoCents: 0, qtde: 0 } as MesAgregado);

    const pago = it.pagoCents ?? 0;
    if (it.tipo === "entrada") {
      m.entradasCents += it.valorCents;
    } else {
      m.previstoCents += it.valorCents;
      m.pagoCents += pago;
      const pendente = saldoCents(it.valorCents, pago);
      m.pendenteCents += pendente;
      if (it.vencido) m.vencidoCents += pendente;
      m.saidasCents += it.valorCents;
    }
    m.qtde += 1;
    map.set(ym, m);
  }

  const meses = [...map.values()].sort((a, b) => a.ym.localeCompare(b.ym));
  let acumulado = 0;
  for (const m of meses) {
    m.saldoCents = m.entradasCents - m.saidasCents;
    acumulado += m.saldoCents;
    m.acumuladoCents = acumulado;
  }
  return { meses, semData };
}

// ---------- Pagamentos parciais ----------

export interface PagamentoLike {
  valorCents: Cents;
  estornado?: boolean;
}

/** Soma apenas pagamentos válidos (estorno volta a gerar saldo — §10). */
export function totalPago(pagamentos: PagamentoLike[]): Cents {
  return pagamentos.reduce((acc, p) => (p.estornado ? acc : acc + p.valorCents), 0);
}

/**
 * Valida um pagamento parcial: valor > 0 e não pode ultrapassar o saldo
 * (a não ser que permitirExcedente seja true — ex.: ajuste consciente).
 */
export function validarPagamento(
  valorCents: Cents,
  saldoAtualCents: Cents,
  permitirExcedente = false,
): { ok: boolean; motivo?: string } {
  if (!Number.isInteger(valorCents) || valorCents <= 0) return { ok: false, motivo: "valor_invalido" };
  if (!permitirExcedente && valorCents > saldoAtualCents) return { ok: false, motivo: "excede_saldo" };
  return { ok: true };
}
