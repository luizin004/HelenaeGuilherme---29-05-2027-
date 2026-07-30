import { describe, expect, it } from "vitest";
import {
  buildSchedule,
  calcularEntrada,
  reequilibrarParcelas,
  splitComEntrada,
} from "@/domain/finance/installments";
import { diasEntre, gerarDatasAte } from "@/domain/finance/schedule";
import { sumCents } from "@/domain/money";

describe("calcularEntrada", () => {
  it("calcula o percentual padrão de casamento (30%)", () => {
    expect(calcularEntrada(1_200_000, 30)).toBe(360_000);
  });

  it("arredonda ao centavo", () => {
    expect(calcularEntrada(540_300, 30)).toBe(162_090);
    expect(calcularEntrada(333, 30)).toBe(100);
  });

  it("0% não gera entrada e 100% leva tudo", () => {
    expect(calcularEntrada(1000, 0)).toBe(0);
    expect(calcularEntrada(1000, 100)).toBe(1000);
  });

  it("nunca passa do total", () => {
    expect(calcularEntrada(1000, 150)).toBe(1000);
  });
});

describe("splitComEntrada", () => {
  it("entrada + saldo dividido fecham o total exatamente", () => {
    const p = splitComEntrada(1_200_000, 360_000, 3);
    expect(p).toEqual([360_000, 280_000, 280_000, 280_000]);
    expect(sumCents(p)).toBe(1_200_000);
  });

  it("resto de centavo vai para as primeiras parcelas do saldo", () => {
    const p = splitComEntrada(1000, 301, 3);
    expect(sumCents(p)).toBe(1000);
    expect(p[0]).toBe(301);
    expect(p.slice(1)).toEqual([233, 233, 233]);
  });

  it("entrada zero degrada para divisão simples", () => {
    expect(splitComEntrada(900, 0, 3)).toEqual([300, 300, 300]);
  });

  it("entrada igual ao total vira parcela única", () => {
    expect(splitComEntrada(900, 900, 3)).toEqual([900]);
  });

  it("sem parcelas restantes, a entrada é o cronograma", () => {
    expect(splitComEntrada(900, 300, 0)).toEqual([300]);
  });

  it("recusa entrada maior que o total", () => {
    expect(() => splitComEntrada(900, 1000, 2)).toThrow();
  });
});

describe("buildSchedule com entrada", () => {
  it("primeira parcela é a entrada e o total fecha", () => {
    const s = buildSchedule({ totalCents: 1_200_000, n: 4, entradaPct: 30 });
    expect(s).toHaveLength(4);
    expect(s[0].valorCents).toBe(360_000);
    expect(sumCents(s.map((p) => p.valorCents))).toBe(1_200_000);
  });

  it("sem entradaPct mantém a divisão igual de antes", () => {
    const s = buildSchedule({ totalCents: 900, n: 3 });
    expect(s.map((p) => p.valorCents)).toEqual([300, 300, 300]);
  });

  it("item gratuito não gera parcela nem com entrada", () => {
    expect(buildSchedule({ totalCents: 1000, n: 3, entradaPct: 30, gratuito: true })).toEqual([]);
  });
});

describe("reequilibrarParcelas", () => {
  it("editar uma parcela redistribui a diferença nas seguintes", () => {
    const novo = reequilibrarParcelas([300, 300, 300], 0, 600);
    expect(novo).toEqual([600, 150, 150]);
    expect(sumCents(novo)).toBe(900);
  });

  it("sem parcelas à frente, redistribui nas anteriores", () => {
    const novo = reequilibrarParcelas([300, 300, 300], 2, 600);
    expect(sumCents(novo)).toBe(900);
    expect(novo[2]).toBe(600);
  });

  it("parcelas pagas nunca mudam", () => {
    const novo = reequilibrarParcelas([300, 300, 300], 1, 400, [true, false, false]);
    expect(novo[0]).toBe(300);
    expect(novo[1]).toBe(400);
    expect(sumCents(novo)).toBe(900);
  });

  it("recusa editar uma parcela já paga", () => {
    const original = [300, 300, 300];
    expect(reequilibrarParcelas(original, 0, 999, [true, false, false])).toEqual(original);
  });

  it("recusa valor acima do que sobra depois das pagas", () => {
    const original = [300, 300, 300];
    expect(reequilibrarParcelas(original, 1, 700, [true, false, false])).toEqual(original);
  });

  it("sem nenhuma parcela ajustável, mantém tudo", () => {
    const original = [300, 300];
    expect(reequilibrarParcelas(original, 0, 100, [false, true])).toEqual(original);
  });

  it("zerar uma parcela joga tudo nas seguintes", () => {
    expect(reequilibrarParcelas([300, 300, 300], 0, 0)).toEqual([0, 450, 450]);
  });

  it("valor negativo é rejeitado", () => {
    expect(() => reequilibrarParcelas([300, 300], 0, -1)).toThrow();
  });
});

describe("gerarDatasAte", () => {
  it("espalha as parcelas entre a primeira data e o casamento", () => {
    const datas = gerarDatasAte("2026-08-05", 4, "2027-05-29");
    expect(datas).toHaveLength(4);
    expect(datas[0]).toBe("2026-08-05");
    expect(datas[3]).toBe("2027-05-29");
  });

  it("as datas ficam em ordem crescente", () => {
    const datas = gerarDatasAte("2026-08-05", 6, "2027-05-29") as string[];
    const ordenadas = [...datas].sort();
    expect(datas).toEqual(ordenadas);
  });

  it("parcela única cai no primeiro vencimento", () => {
    expect(gerarDatasAte("2026-08-05", 1, "2027-05-29")).toEqual(["2026-08-05"]);
  });

  it("data final anterior à primeira colapsa tudo no primeiro vencimento", () => {
    expect(gerarDatasAte("2027-06-01", 3, "2027-05-29")).toEqual(["2027-06-01", "2027-06-01", "2027-06-01"]);
  });

  it("sem datas devolve nulos (parcela sem data não vence)", () => {
    expect(gerarDatasAte("", 2, "2027-05-29")).toEqual([null, null]);
  });
});

describe("diasEntre", () => {
  it("conta os dias entre duas datas", () => {
    expect(diasEntre("2026-08-05", "2026-08-15")).toBe(10);
  });

  it("é negativo quando a segunda data é anterior", () => {
    expect(diasEntre("2026-08-15", "2026-08-05")).toBe(-10);
  });

  it("atravessa virada de ano", () => {
    expect(diasEntre("2026-12-31", "2027-01-01")).toBe(1);
  });
});
