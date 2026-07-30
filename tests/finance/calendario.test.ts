import { describe, expect, it } from "vitest";
import {
  agruparEventosPorMes,
  montarEventos,
  totaisPorTipo,
  type FonteCalendario,
  type ContaCalendario,
} from "@/domain/finance/calendario";

function conta(over: Partial<ContaCalendario> & { descricao: string }): ContaCalendario {
  return {
    classificacao: null,
    valorCents: 10000,
    saldoCents: 10000,
    vencimento: "2026-08-05",
    previsao: null,
    status: "a_pagar",
    numero: null,
    totalParcelas: null,
    ...over,
  };
}

const vazio: FonteCalendario = { contas: [], pagamentos: [], aportes: [] };

describe("montarEventos", () => {
  it("gera vencimento a partir das contas, com parcela no título", () => {
    const evs = montarEventos({
      ...vazio,
      contas: [conta({ descricao: "Fotógrafo", numero: 1, totalParcelas: 2, classificacao: "Fotografia" })],
    });
    expect(evs).toHaveLength(1);
    expect(evs[0].titulo).toBe("Fotógrafo · 1/2");
    expect(evs[0].detalhe).toBe("Fotografia");
    expect(evs[0].tipo).toBe("vencimento");
  });

  it("usa a previsão quando não há vencimento", () => {
    const evs = montarEventos({
      ...vazio,
      contas: [conta({ descricao: "Tenda", vencimento: null, previsao: "2026-09-10" })],
    });
    expect(evs[0].data).toBe("2026-09-10");
  });

  it("ignora conta sem data e conta gratuita", () => {
    const evs = montarEventos({
      ...vazio,
      contas: [
        conta({ descricao: "Sem data", vencimento: null, previsao: null }),
        conta({ descricao: "Cortesia", status: "gratuito" }),
      ],
    });
    expect(evs).toHaveLength(0);
  });

  it("conta parcial mostra o saldo, não o valor cheio", () => {
    const evs = montarEventos({
      ...vazio,
      contas: [conta({ descricao: "Buffet", valorCents: 100000, saldoCents: 40000, status: "parcial" })],
    });
    expect(evs[0].valorCents).toBe(40000);
  });

  it("conta quitada mostra o valor cheio", () => {
    const evs = montarEventos({
      ...vazio,
      contas: [conta({ descricao: "Buffet", valorCents: 100000, saldoCents: 0, status: "pago" })],
    });
    expect(evs[0].valorCents).toBe(100000);
  });

  it("inclui pagamentos e ignora estornados", () => {
    const evs = montarEventos({
      ...vazio,
      pagamentos: [
        { data: "2026-08-06", valor_cents: 5000, responsavel: "Toninho", estornado_em: null },
        { data: "2026-08-07", valor_cents: 9999, responsavel: null, estornado_em: "2026-08-08" },
      ],
    });
    expect(evs).toHaveLength(1);
    expect(evs[0].tipo).toBe("pagamento");
    expect(evs[0].detalhe).toBe("Toninho");
  });

  it("inclui aportes com o nome do responsável e ignora aporte sem data", () => {
    const evs = montarEventos({
      ...vazio,
      aportes: [
        { data: "2026-07-22", valorCents: 150000, responsavel: "Toninho" },
        { data: null, valorCents: 1, responsavel: "Fulano" },
      ],
    });
    expect(evs).toHaveLength(1);
    expect(evs[0].titulo).toBe("Aporte · Toninho");
  });

  it("ordena tudo por data", () => {
    const evs = montarEventos({
      contas: [conta({ descricao: "B", vencimento: "2026-09-01" })],
      pagamentos: [{ data: "2026-07-01", valor_cents: 100, responsavel: null, estornado_em: null }],
      aportes: [{ data: "2026-08-01", valorCents: 200, responsavel: "X" }],
    });
    expect(evs.map((e) => e.data)).toEqual(["2026-07-01", "2026-08-01", "2026-09-01"]);
  });
});

describe("agruparEventosPorMes", () => {
  it("agrupa por AAAA-MM preservando a ordem", () => {
    const evs = montarEventos({
      ...vazio,
      contas: [
        conta({ descricao: "A", vencimento: "2026-08-05" }),
        conta({ descricao: "B", vencimento: "2026-08-20" }),
        conta({ descricao: "C", vencimento: "2027-03-15" }),
      ],
    });
    const porMes = agruparEventosPorMes(evs);
    expect([...porMes.keys()]).toEqual(["2026-08", "2027-03"]);
    expect(porMes.get("2026-08")).toHaveLength(2);
  });
});

describe("totaisPorTipo", () => {
  it("soma quantidade e valor de cada tipo", () => {
    const evs = montarEventos({
      contas: [conta({ descricao: "A", valorCents: 1000, saldoCents: 1000 })],
      pagamentos: [{ data: "2026-08-06", valor_cents: 500, responsavel: null, estornado_em: null }],
      aportes: [{ data: "2026-07-22", valorCents: 9000, responsavel: "X" }],
    });
    const t = totaisPorTipo(evs);
    expect(t.vencimento).toEqual({ qtde: 1, cents: 1000 });
    expect(t.pagamento).toEqual({ qtde: 1, cents: 500 });
    expect(t.aporte).toEqual({ qtde: 1, cents: 9000 });
  });
});
