import { describe, expect, it } from "vitest";
import {
  classificarCaixa,
  consolidar,
  leituraDoCaixa,
  pontosDeAtencao,
  type EntradaConsolidado,
} from "@/domain/finance/consolidado";
import { formatCents } from "@/domain/money";

const base: EntradaConsolidado = {
  aportesCents: 15_000_000,
  pagoCents: 0,
  pendenteCents: 5_406_930,
  vencidoCents: 0,
  custoConhecidoCents: 5_406_930,
  contratadoCents: 3_956_930,
  economiaCents: 0,
  itens: { total: 24, comValor: 7, semValor: 15, gratuitos: 2 },
};

describe("consolidar", () => {
  const c = consolidar(base);

  it("saldo disponível é aportes menos pago", () => {
    expect(consolidar({ ...base, pagoCents: 1_000_000 }).saldoDisponivelCents).toBe(14_000_000);
  });

  it("saldo após compromissos é aportes menos o custo conhecido", () => {
    expect(c.saldoAposCompromissosCents).toBe(15_000_000 - 5_406_930);
  });

  it("a contratar é o custo conhecido ainda não contratado", () => {
    expect(c.aContratarCents).toBe(5_406_930 - 3_956_930);
  });

  it("nunca devolve 'a contratar' negativo", () => {
    expect(consolidar({ ...base, contratadoCents: 9_999_999 }).aContratarCents).toBe(0);
  });

  it("calcula cobertura e execução em percentual", () => {
    expect(c.coberturaPct).toBe(277);
    expect(consolidar({ ...base, pagoCents: 2_703_465 }).execucaoPct).toBe(50);
  });

  it("base zero não quebra o percentual", () => {
    const vazio = consolidar({ ...base, custoConhecidoCents: 0, contratadoCents: 0 });
    expect(vazio.coberturaPct).toBe(0);
    expect(vazio.execucaoPct).toBe(0);
  });
});

describe("classificarCaixa", () => {
  it("descoberto quando falta dinheiro", () => {
    expect(classificarCaixa(-1, 1000)).toBe("descoberto");
  });

  it("apertado quando a folga é menor que 10% do custo", () => {
    expect(classificarCaixa(50, 1000)).toBe("apertado");
  });

  it("coberto quando a folga é confortável", () => {
    expect(classificarCaixa(500, 1000)).toBe("coberto");
  });

  it("sem custo conhecido é coberto", () => {
    expect(classificarCaixa(0, 0)).toBe("coberto");
  });
});

describe("leituraDoCaixa", () => {
  it("caixa confortável cita a folga", () => {
    const txt = leituraDoCaixa(consolidar(base), formatCents);
    expect(txt).toContain("confortável");
    expect(txt).toContain("277%");
  });

  it("descoberto diz quanto falta", () => {
    const c = consolidar({ ...base, aportesCents: 1_000_000 });
    const txt = leituraDoCaixa(c, formatCents);
    expect(txt).toContain("Faltam");
    expect(txt).toContain(formatCents(4_406_930));
  });

  it("apertado avisa da folga curta", () => {
    const c = consolidar({ ...base, aportesCents: 5_500_000 });
    expect(leituraDoCaixa(c, formatCents)).toContain("folga é curta");
  });

  it("sem custo definido orienta a preencher valores", () => {
    const c = consolidar({ ...base, custoConhecidoCents: 0 });
    expect(leituraDoCaixa(c, formatCents)).toContain("defina valores");
  });
});

describe("pontosDeAtencao", () => {
  const semExtras = { contratacoesVencidas: 0, semPrazo: 0, venceEm7Dias: 0 };

  it("tudo em dia devolve lista vazia", () => {
    const c = consolidar({ ...base, itens: { total: 5, comValor: 5, semValor: 0, gratuitos: 0 } });
    expect(pontosDeAtencao(c, semExtras, formatCents)).toEqual([]);
  });

  it("vencido vem primeiro", () => {
    const c = consolidar({ ...base, vencidoCents: 100_000 });
    const avisos = pontosDeAtencao(c, { ...semExtras, venceEm7Dias: 3 }, formatCents);
    expect(avisos[0]).toContain("vencidas");
  });

  it("junta contratação vencida, itens sem valor e sem prazo", () => {
    const avisos = pontosDeAtencao(
      consolidar(base),
      { contratacoesVencidas: 2, semPrazo: 15, venceEm7Dias: 0 },
      formatCents,
    );
    expect(avisos.some((a) => a.includes("prazo de contratação"))).toBe(true);
    expect(avisos.some((a) => a.includes("15 item(ns) ainda sem valor"))).toBe(true);
    expect(avisos.some((a) => a.includes("sem prazo de contratação definido"))).toBe(true);
  });

  it("caixa descoberto entra como ponto de atenção", () => {
    const c = consolidar({ ...base, aportesCents: 100 });
    expect(pontosDeAtencao(c, semExtras, formatCents).some((a) => a.includes("de aporte"))).toBe(true);
  });
});
