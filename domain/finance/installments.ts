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
 * Entrada em % do total, arredondada ao centavo. Usada no padrão de casamento
 * ("30% de entrada e o saldo até o dia"). Nunca passa do total.
 */
export function calcularEntrada(totalCents: Cents, percentual: number): Cents {
  if (percentual <= 0) return 0;
  if (percentual >= 100) return totalCents;
  return Math.min(totalCents, Math.round((totalCents * percentual) / 100));
}

/**
 * Divide o total em: 1 entrada + `nRestantes` parcelas iguais do saldo.
 * A soma continua fechando EXATAMENTE o total (regra 1). Entrada zero ou
 * saldo zero degradam para uma divisão simples, sem parcela vazia.
 */
export function splitComEntrada(totalCents: Cents, entradaCents: Cents, nRestantes: number): Cents[] {
  if (!Number.isInteger(totalCents) || !Number.isInteger(entradaCents)) {
    throw new Error("Valores devem ser inteiros (centavos).");
  }
  if (entradaCents < 0 || entradaCents > totalCents) {
    throw new Error("Entrada deve estar entre zero e o total.");
  }
  if (nRestantes < 0) throw new Error("Número de parcelas restantes não pode ser negativo.");

  const saldo = totalCents - entradaCents;
  if (entradaCents === 0) return splitEqualInstallments(totalCents, Math.max(1, nRestantes));
  if (saldo === 0 || nRestantes === 0) return [entradaCents];
  return [entradaCents, ...splitEqualInstallments(saldo, nRestantes)];
}

/**
 * Reequilibra o cronograma depois de editar UMA parcela: o novo valor é
 * respeitado e a diferença se espalha nas parcelas ajustáveis seguintes (ou,
 * na falta delas, nas anteriores). Parcelas bloqueadas (já pagas) nunca mudam,
 * e o total continua fechando exatamente.
 *
 * Devolve o array original quando não há para onde jogar a diferença — melhor
 * recusar a edição do que quebrar o fechamento.
 */
export function reequilibrarParcelas(
  valores: Cents[],
  indice: number,
  novoValor: Cents,
  bloqueados: boolean[] = [],
): Cents[] {
  if (indice < 0 || indice >= valores.length) throw new Error("Parcela inexistente.");
  if (!Number.isInteger(novoValor) || novoValor < 0) throw new Error("Valor inválido.");
  if (bloqueados[indice]) return valores;

  const total = sumCents(valores);
  const travadoCents = valores.reduce((n, v, i) => (i !== indice && bloqueados[i] ? n + v : n), 0);
  const tetoEditavel = total - travadoCents;
  if (novoValor > tetoEditavel) return valores;

  const ajustaveis = valores
    .map((_, i) => i)
    .filter((i) => i !== indice && !bloqueados[i]);
  if (ajustaveis.length === 0) return valores;

  const restante = total - travadoCents - novoValor;
  // Prioriza as parcelas seguintes; sem nenhuma à frente, redistribui nas anteriores.
  const alvos = ajustaveis.filter((i) => i > indice);
  const destino = alvos.length > 0 ? alvos : ajustaveis;
  const naoDestino = ajustaveis.filter((i) => !destino.includes(i));
  const jaAlocado = naoDestino.reduce((n, i) => n + valores[i], 0);
  const paraDistribuir = restante - jaAlocado;
  if (paraDistribuir < 0) return valores;

  const novos = [...valores];
  novos[indice] = novoValor;
  const fatias = splitEqualInstallments(paraDistribuir, destino.length);
  destino.forEach((idx, k) => (novos[idx] = fatias[k]));

  if (sumCents(novos) !== total) return valores;
  return novos;
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
  /** % de entrada — a 1ª parcela vira a entrada e o saldo divide nas demais. */
  entradaPct?: number;
}): Installment[] {
  if (params.gratuito || params.totalCents === 0) return [];
  const pct = params.entradaPct ?? 0;
  const valores =
    pct > 0
      ? splitComEntrada(params.totalCents, calcularEntrada(params.totalCents, pct), Math.max(0, params.n - 1))
      : splitEqualInstallments(params.totalCents, params.n);
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
