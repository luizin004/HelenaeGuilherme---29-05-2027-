import { describe, expect, it } from "vitest";
import {
  buildSchedule,
  isOverdue,
  splitEqualInstallments,
  validateResponsibleSplit,
} from "@/domain/finance/installments";
import { parseBRLToCents, sumCents } from "@/domain/money";

describe("parcelamento (regra 1: fechamento exato)", () => {
  it("R$ 1.893,50 em 6 parcelas fecha EXATAMENTE R$ 1.893,50", () => {
    const total = parseBRLToCents("R$ 1.893,50"); // 189350
    expect(total).toBe(189350);

    const parcelas = splitEqualInstallments(total, 6);
    expect(parcelas).toHaveLength(6);
    expect(sumCents(parcelas)).toBe(189350); // fechamento exato
    // resto de 2 centavos vai para as 2 primeiras
    expect(parcelas).toEqual([31559, 31559, 31558, 31558, 31558, 31558]);
  });

  it("fecha exato para vários totais e números de parcelas", () => {
    const casos: Array<[number, number]> = [
      [189350, 6], [10000, 3], [99999, 7], [1, 4], [50000, 1], [123456, 11],
    ];
    for (const [total, n] of casos) {
      const parcelas = splitEqualInstallments(total, n);
      expect(sumCents(parcelas)).toBe(total);
      expect(parcelas).toHaveLength(n);
      // diferença máxima entre parcelas é 1 centavo
      expect(Math.max(...parcelas) - Math.min(...parcelas)).toBeLessThanOrEqual(1);
    }
  });

  it("rejeita entradas inválidas", () => {
    expect(() => splitEqualInstallments(1000, 0)).toThrow();
    expect(() => splitEqualInstallments(-1, 3)).toThrow();
    expect(() => splitEqualInstallments(100.5, 3)).toThrow();
  });
});

describe("item gratuito (regras 4/38)", () => {
  it("não gera parcelas", () => {
    expect(buildSchedule({ totalCents: 50000, n: 3, gratuito: true })).toEqual([]);
  });
  it("total zero não gera parcelas", () => {
    expect(buildSchedule({ totalCents: 0, n: 3 })).toEqual([]);
  });
});

describe("divisão por responsáveis (regra 2)", () => {
  it("aceita divisão que fecha o desembolso", () => {
    expect(validateResponsibleSplit(189350, [94675, 94675])).toBe(true);
    expect(validateResponsibleSplit(189350, [63117, 63117, 63116])).toBe(true);
  });
  it("rejeita divisão que não fecha", () => {
    expect(validateResponsibleSplit(189350, [94675, 94674])).toBe(false);
  });
});

describe("parcela vencida (regra 5/37)", () => {
  const hoje = "2026-07-19";
  it("sem vencimento nunca está vencida", () => {
    expect(isOverdue({ numero: 1, valorCents: 100, vencimento: null }, false, hoje)).toBe(false);
  });
  it("vencimento no passado e não paga → vencida", () => {
    expect(isOverdue({ numero: 1, valorCents: 100, vencimento: "2026-01-01" }, false, hoje)).toBe(true);
  });
  it("paga nunca está vencida", () => {
    expect(isOverdue({ numero: 1, valorCents: 100, vencimento: "2026-01-01" }, true, hoje)).toBe(false);
  });
});
