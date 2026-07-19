/**
 * Dinheiro em CENTAVOS inteiros (bigint-safe como number até 2^53).
 * Nunca usar ponto flutuante para armazenar ou somar dinheiro (regra 12).
 * Todas as operações internas são em centavos; a formatação é só na borda.
 */

export type Cents = number; // inteiro, em centavos

/** Converte reais (ex.: 1893.5) para centavos inteiros, com arredondamento seguro. */
export function reaisToCents(reais: number): Cents {
  return Math.round(reais * 100);
}

/**
 * Converte string monetária para centavos, aceitando os dois formatos:
 *  - BR "R$ 1.893,50" / "1893,50" → vírgula é decimal, ponto é milhar;
 *  - US "1893.50"                 → sem vírgula, o ponto é decimal.
 */
export function parseBRLToCents(input: string): Cents {
  const base = input.replace(/\s/g, "").replace(/R\$/i, "");
  const normalized = base.includes(",")
    ? base.replace(/\./g, "").replace(",", ".") // vírgula presente → formato BR
    : base; // sem vírgula → ponto (se houver) é decimal
  const value = Number(normalized);
  if (!Number.isFinite(value)) throw new Error(`Valor monetário inválido: "${input}"`);
  return Math.round(value * 100);
}

/** Formata centavos para "R$ 1.893,50" (pt-BR). */
export function formatCents(cents: Cents): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Soma segura de centavos. */
export function sumCents(values: Cents[]): Cents {
  return values.reduce((acc, v) => acc + v, 0);
}
