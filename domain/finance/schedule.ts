/**
 * Datas do cronograma de parcelas (§16) — modelo "condição de pagamento":
 *   • 1º vencimento = quando cai o primeiro pagamento da 1ª parcela;
 *   • intervalo entre parcelas EM DIAS (ex.: 30) OU "mensal" (mesmo dia do mês).
 * Funções puras/testáveis. Cada data pode ainda ser ajustada individualmente
 * na tela de Parcelas, para o cronograma nunca virar um problema.
 */

export interface CondicaoDatas {
  /** true = mesmo dia de cada mês (mensal exato); false = usa intervaloDias. */
  mensal: boolean;
  /** intervalo em dias entre parcelas quando não for mensal (ex.: 30, 15, 7). */
  intervaloDias: number;
}

/** Soma `months` meses a uma data ISO (YYYY-MM-DD), tratando fim de mês. */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 + months, 1));
  const ultimoDia = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(d, ultimoDia));
  return base.toISOString().slice(0, 10);
}

/** Soma `days` dias a uma data ISO. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d + days));
  return base.toISOString().slice(0, 10);
}

/**
 * Datas do cronograma: a 1ª é o próprio `primeiroISO`; as demais avançam pela
 * condição (mensal ou intervalo em dias). Retorna `n` datas ISO. Sem 1º
 * vencimento → `n` nulos (parcelas sem data não ficam vencidas).
 */
/** Dias inteiros entre duas datas ISO (negativo se `ate` for antes de `de`). */
export function diasEntre(de: string, ate: string): number {
  const [ya, ma, da] = de.split("-").map(Number);
  const [yb, mb, db] = ate.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

/**
 * Espalha `n` vencimentos entre `primeiroISO` e `finalISO` (inclusive) —
 * o padrão de casamento: entrada hoje e o saldo distribuído até o dia.
 * A última parcela cai exatamente em `finalISO`. Datas inválidas ou final
 * anterior ao primeiro degradam para uma única data no primeiro vencimento.
 */
export function gerarDatasAte(primeiroISO: string, n: number, finalISO: string): (string | null)[] {
  if (!primeiroISO || !finalISO) return Array.from({ length: n }, () => null);
  if (n <= 1) return [primeiroISO];
  const vao = diasEntre(primeiroISO, finalISO);
  if (vao <= 0) return Array.from({ length: n }, () => primeiroISO);
  return Array.from({ length: n }, (_, i) =>
    i === n - 1 ? finalISO : addDays(primeiroISO, Math.round((vao * i) / (n - 1))),
  );
}

export function gerarDatas(primeiroISO: string, n: number, cond: CondicaoDatas): (string | null)[] {
  if (!primeiroISO) return Array.from({ length: n }, () => null);
  const dias = Number.isFinite(cond.intervaloDias) && cond.intervaloDias > 0 ? Math.floor(cond.intervaloDias) : 30;
  return Array.from({ length: n }, (_, i) => {
    if (i === 0) return primeiroISO;
    return cond.mensal ? addMonths(primeiroISO, i) : addDays(primeiroISO, dias * i);
  });
}
