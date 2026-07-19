import { describe, expect, it } from "vitest";
import { formatCents, parseBRLToCents, reaisToCents, sumCents } from "@/domain/money";

describe("money (centavos)", () => {
  it("converte reais para centavos com arredondamento seguro", () => {
    expect(reaisToCents(1893.5)).toBe(189350);
    expect(reaisToCents(0.1)).toBe(10);
    expect(reaisToCents(19.99)).toBe(1999);
  });

  it("faz o parse de formatos BRL comuns", () => {
    expect(parseBRLToCents("R$ 1.893,50")).toBe(189350);
    expect(parseBRLToCents("1893,50")).toBe(189350);
    expect(parseBRLToCents("1893.50")).toBe(189350);
    expect(parseBRLToCents("R$ 300,00")).toBe(30000);
  });

  it("formata centavos em BRL", () => {
    expect(formatCents(189350)).toBe("R$ 1.893,50");
    expect(formatCents(30000)).toBe("R$ 300,00");
  });

  it("soma sem erro de ponto flutuante", () => {
    // 0.1 + 0.2 em reais daria 0.30000000000000004; em centavos é exato.
    expect(sumCents([10, 20])).toBe(30);
  });

  it("rejeita valor inválido", () => {
    expect(() => parseBRLToCents("abc")).toThrow();
  });
});
