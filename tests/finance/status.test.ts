import { describe, expect, it } from "vitest";
import {
  statusConta,
  saldoCents,
  diasAtraso,
  agruparPorMes,
  totalPago,
  validarPagamento,
  ymOf,
  labelCompetencia,
  labelMesPT,
} from "@/domain/finance/status";

const hoje = "2026-07-19";

describe("status automático da conta (§10)", () => {
  const base = { valorCents: 10000, pagoCents: 0, vencimento: null as string | null, hoje };

  it("pago quando valor pago >= valor final", () => {
    expect(statusConta({ ...base, pagoCents: 10000, vencimento: "2026-01-01" })).toBe("pago");
    expect(statusConta({ ...base, pagoCents: 12000 })).toBe("pago");
  });
  it("parcial quando 0 < pago < valor (mesmo vencida)", () => {
    expect(statusConta({ ...base, pagoCents: 4000, vencimento: "2026-01-01" })).toBe("parcial");
  });
  it("vencido / vence hoje / a pagar pelo vencimento", () => {
    expect(statusConta({ ...base, vencimento: "2026-07-18" })).toBe("vencido");
    expect(statusConta({ ...base, vencimento: hoje })).toBe("vence_hoje");
    expect(statusConta({ ...base, vencimento: "2026-08-01" })).toBe("a_pagar");
  });
  it("previsto sem vencimento; cancelado e gratuito têm prioridade", () => {
    expect(statusConta(base)).toBe("previsto");
    expect(statusConta({ ...base, cancelado: true, pagoCents: 10000 })).toBe("cancelado");
    expect(statusConta({ ...base, gratuito: true })).toBe("gratuito");
  });
});

describe("saldo e atraso", () => {
  it("saldo nunca negativo", () => {
    expect(saldoCents(10000, 4000)).toBe(6000);
    expect(saldoCents(10000, 12000)).toBe(0);
  });
  it("dias de atraso", () => {
    expect(diasAtraso("2026-07-09", hoje)).toBe(10);
    expect(diasAtraso("2026-07-19", hoje)).toBe(0);
    expect(diasAtraso(null, hoje)).toBe(0);
  });
});

describe("pagamentos parciais e estorno (§15/§10)", () => {
  it("soma só pagamentos não estornados", () => {
    expect(totalPago([{ valorCents: 200000 }, { valorCents: 150000 }, { valorCents: 150000 }])).toBe(500000);
    expect(totalPago([{ valorCents: 200000 }, { valorCents: 150000, estornado: true }])).toBe(200000);
  });
  it("conta de R$ 5.000 com 3 pagamentos fecha e vira paga", () => {
    const pagos = totalPago([{ valorCents: 200000 }, { valorCents: 150000 }, { valorCents: 150000 }]);
    expect(statusConta({ valorCents: 500000, pagoCents: pagos, vencimento: "2026-01-01", hoje })).toBe("pago");
  });
  it("estorno volta a gerar saldo pendente", () => {
    const pagos = totalPago([{ valorCents: 500000, estornado: true }]);
    expect(saldoCents(500000, pagos)).toBe(500000);
    expect(statusConta({ valorCents: 500000, pagoCents: pagos, vencimento: "2026-01-01", hoje })).toBe("vencido");
  });
  it("valida pagamento parcial", () => {
    expect(validarPagamento(200000, 500000).ok).toBe(true);
    expect(validarPagamento(600000, 500000).motivo).toBe("excede_saldo");
    expect(validarPagamento(0, 500000).motivo).toBe("valor_invalido");
    expect(validarPagamento(100.5 as unknown as number, 500000).motivo).toBe("valor_invalido");
  });
});

describe("agrupamento mensal (§18/§19)", () => {
  it("parcela de 12x cai no mês certo — nunca tudo num mês só", () => {
    const parcelas = Array.from({ length: 12 }, (_, i) => ({
      data: `2026-${String(i + 1).padStart(2, "0")}-10`,
      valorCents: 100000,
    }));
    const { meses } = agruparPorMes(parcelas);
    expect(meses).toHaveLength(12);
    for (const m of meses) expect(m.previstoCents).toBe(100000);
  });

  it("calcula saldo mensal e acumulado com entradas e saídas", () => {
    const { meses } = agruparPorMes([
      { data: "2026-07-01", valorCents: 300000, tipo: "entrada" }, // aporte
      { data: "2026-07-10", valorCents: 100000, pagoCents: 100000 }, // saída paga
      { data: "2026-08-10", valorCents: 150000, vencido: false },
    ]);
    expect(meses[0].saldoCents).toBe(200000); // 3000 − 1000
    expect(meses[0].acumuladoCents).toBe(200000);
    expect(meses[1].saldoCents).toBe(-150000);
    expect(meses[1].acumuladoCents).toBe(50000);
  });

  it("separa itens sem data e computa vencido por saldo pendente", () => {
    const { meses, semData } = agruparPorMes([
      { data: null, valorCents: 50000 },
      { data: "2026-06-01", valorCents: 100000, pagoCents: 40000, vencido: true },
    ]);
    expect(semData).toHaveLength(1);
    expect(meses[0].vencidoCents).toBe(60000); // só o saldo pendente conta
    expect(meses[0].pendenteCents).toBe(60000);
  });
});

describe("formatação de competência", () => {
  it("ym, competência e label pt-BR", () => {
    expect(ymOf("2027-05-29")).toBe("2027-05");
    expect(labelCompetencia("2027-05")).toBe("05/2027");
    expect(labelMesPT("2027-05")).toBe("mai/2027");
  });
});
