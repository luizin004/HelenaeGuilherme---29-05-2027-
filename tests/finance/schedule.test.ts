import { describe, expect, it } from "vitest";
import { gerarDatas, addMonths, addDays } from "@/domain/finance/schedule";

describe("condição de pagamento — datas do cronograma (§16)", () => {
  it("1ª parcela = 1º vencimento; demais por intervalo em dias (30)", () => {
    const d = gerarDatas("2026-08-22", 4, { mensal: false, intervaloDias: 30 });
    expect(d).toEqual(["2026-08-22", "2026-09-21", "2026-10-21", "2026-11-20"]);
  });

  it("intervalo de 15 dias (quinzenal)", () => {
    const d = gerarDatas("2026-01-01", 3, { mensal: false, intervaloDias: 15 });
    expect(d).toEqual(["2026-01-01", "2026-01-16", "2026-01-31"]);
  });

  it("mensal mantém o mesmo dia do mês", () => {
    const d = gerarDatas("2026-01-31", 3, { mensal: true, intervaloDias: 30 });
    // fevereiro não tem 31 → cai no último dia
    expect(d).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
  });

  it("mensal por 12 meses cai no mesmo dia", () => {
    const d = gerarDatas("2026-05-10", 12, { mensal: true, intervaloDias: 30 });
    expect(d[0]).toBe("2026-05-10");
    expect(d[11]).toBe("2027-04-10");
    expect(d).toHaveLength(12);
  });

  it("sem 1º vencimento → todas as datas nulas", () => {
    expect(gerarDatas("", 3, { mensal: false, intervaloDias: 30 })).toEqual([null, null, null]);
  });

  it("intervalo inválido cai em 30 dias", () => {
    const d = gerarDatas("2026-01-01", 2, { mensal: false, intervaloDias: 0 });
    expect(d).toEqual(["2026-01-01", "2026-01-31"]);
  });

  it("addMonths e addDays", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
});
