import { sumCents, type Cents } from "@/domain/money";

/**
 * Regras financeiras (PROJECT_SPEC §6):
 *  - a soma das parcelas fecha EXATAMENTE o total (regra 1);
 *  - a soma da divisão por responsáveis fecha EXATAMENTE o desembolso (regra 2);
 *  - item gratuito não gera parcela (regras 4/38);
 *  - parcela sem vencimento não é vencida (regra 5/37).
 */

export interface Installment {
  numero: number;
  valorCents: Cents;
  vencimento: string | null; // ISO date ou null (não vencível)
}

/**
 * Divide `totalCents` em `n` parcelas inteiras que somam EXATAMENTE o total.
 * O resto (em centavos) é distribuído 1 a 1 nas primeiras parcelas.
 * Ex.: 189350 em 6 → [31559, 31559, 31558, 31558, 31558, 31558] (soma 189350).
 */
export function splitEqualInstallments(totalCents: Cents, n: number): Cents[] {
  if (!Number.isInteger(totalCents)) throw new Error("totalCents deve ser inteiro (centavos).");
  if (n <= 0) throw new Error("Número de parcelas deve ser >= 1.");
  if (totalCents < 0) throw new Error("Total não pode ser negativo.");

  const base = Math.floor(totalCents / n);
  const resto = totalCents - base * n; // 0..n-1
  const parcelas = Array.from({ length: n }, (_, i) => base + (i < resto ? 1 : 0));

  // Invariante: fechamento exato.
  if (sumCents(parcelas) !== totalCents) {
    throw new Error("Falha de invariante: parcelas não fecham o total.");
  }
  return parcelas;
}

/**
 * Monta o cronograma. Item gratuito (`gratuito=true`) não gera parcelas.
 * Vencimentos ausentes ficam null (não vencíveis).
 */
export function buildSchedule(params: {
  totalCents: Cents;
  n: number;
  vencimentos?: (string | null)[];
  gratuito?: boolean;
}): Installment[] {
  if (params.gratuito || params.totalCents === 0) return [];
  const valores = splitEqualInstallments(params.totalCents, params.n);
  return valores.map((valorCents, i) => ({
    numero: i + 1,
    valorCents,
    vencimento: params.vencimentos?.[i] ?? null,
  }));
}

/** Verifica se a divisão por responsáveis fecha exatamente o desembolso (regra 2). */
export function validateResponsibleSplit(desembolsoCents: Cents, partesCents: Cents[]): boolean {
  return sumCents(partesCents) === desembolsoCents;
}

/**
 * Uma parcela só está vencida se tem vencimento no passado E não foi paga (regra 5/37).
 * `hojeISO` é injetado para testabilidade determinística.
 */
export function isOverdue(parcela: Installment, pago: boolean, hojeISO: string): boolean {
  if (pago) return false;
  if (!parcela.vencimento) return false; // sem data → nunca vencida
  return parcela.vencimento < hojeISO;
}
