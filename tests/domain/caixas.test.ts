import { describe, expect, it } from "vitest";
import {
  ehPadrinho,
  resumoCaixas,
  convitesPequenos,
  producaoGrupo,
  somarProducao,
  normalizarFaixa,
  KITS,
  type PadrinhoBase,
} from "@/domain/convites/caixas";

const p = (id: string, papel: string, caixa_individual = false): PadrinhoBase => ({ id, papel, caixa_individual });

describe("papéis", () => {
  it("padrinho e madrinha contam como padrinhos", () => {
    expect(ehPadrinho("padrinho")).toBe(true);
    expect(ehPadrinho("madrinha")).toBe(true);
    expect(ehPadrinho("convidado")).toBe(false);
    expect(ehPadrinho(null)).toBe(false);
  });
});

describe("resumoCaixas (FASE 5)", () => {
  it("exemplo 1 do enunciado: 20 padrinhos, 8 casais, 4 sem par", () => {
    // 16 em 8 casais + 4 sem par + ninguém individual = 20
    const padrinhos: PadrinhoBase[] = [];
    const pares = [];
    for (let i = 0; i < 8; i++) {
      const a = `a${i}`, b = `b${i}`;
      padrinhos.push(p(a, "padrinho"), p(b, "madrinha"));
      pares.push({ member_a: a, member_b: b });
    }
    for (let i = 0; i < 4; i++) padrinhos.push(p(`x${i}`, "padrinho"));

    const r = resumoCaixas(padrinhos, pares);
    expect(r.totalPadrinhos).toBe(20);
    expect(r.casaisVinculados).toBe(8);
    expect(r.semPar).toBe(4);
    expect(r.caixasConfirmadas).toBe(8);
    expect(r.caixasPendentes).toBe(4);
    expect(r.previsaoMaxCaixas).toBe(12);
  });

  it("exemplo 2: vincular 2 dos sem par entre si → 9 casais, 2 sem par", () => {
    const padrinhos: PadrinhoBase[] = [];
    const pares = [];
    for (let i = 0; i < 9; i++) {
      const a = `a${i}`, b = `b${i}`;
      padrinhos.push(p(a, "padrinho"), p(b, "madrinha"));
      pares.push({ member_a: a, member_b: b });
    }
    for (let i = 0; i < 2; i++) padrinhos.push(p(`x${i}`, "padrinho"));

    const r = resumoCaixas(padrinhos, pares);
    expect(r.totalPadrinhos).toBe(20);
    expect(r.casaisVinculados).toBe(9);
    expect(r.semPar).toBe(2);
    expect(r.caixasConfirmadas).toBe(9);
    expect(r.caixasPendentes).toBe(2);
    expect(r.previsaoMaxCaixas).toBe(11);
  });

  it("caixa individual marcada conta como confirmada, não como pendente", () => {
    const padrinhos = [p("a", "padrinho"), p("b", "madrinha"), p("c", "padrinho", true), p("d", "madrinha")];
    const r = resumoCaixas(padrinhos, [{ member_a: "a", member_b: "b" }]);
    expect(r.casaisVinculados).toBe(1);
    expect(r.caixasIndividuais).toBe(1); // c
    expect(r.semPar).toBe(1); // d
    expect(r.caixasConfirmadas).toBe(2); // casal + individual
    expect(r.caixasPendentes).toBe(1); // d
    expect(r.previsaoMaxCaixas).toBe(3);
  });

  it("duas madrinhas ou dois padrinhos podem formar par (sem regra de gênero)", () => {
    const padrinhos = [p("a", "madrinha"), p("b", "madrinha"), p("c", "padrinho"), p("d", "padrinho")];
    const r = resumoCaixas(padrinhos, [
      { member_a: "a", member_b: "b" },
      { member_a: "c", member_b: "d" },
    ]);
    expect(r.casaisVinculados).toBe(2);
    expect(r.semPar).toBe(0);
  });

  it("ignora par inválido: membro inexistente ou repetido", () => {
    const padrinhos = [p("a", "padrinho"), p("b", "madrinha")];
    const r = resumoCaixas(padrinhos, [
      { member_a: "a", member_b: "zzz" }, // b inexistente
      { member_a: "a", member_b: "a" }, // repetido
    ]);
    expect(r.casaisVinculados).toBe(0);
    expect(r.semPar).toBe(2);
  });

  it("pessoa não entra em dois pares (o segundo é ignorado)", () => {
    const padrinhos = [p("a", "padrinho"), p("b", "madrinha"), p("c", "padrinho")];
    const r = resumoCaixas(padrinhos, [
      { member_a: "a", member_b: "b" },
      { member_a: "a", member_b: "c" }, // a já pareado
    ]);
    expect(r.casaisVinculados).toBe(1);
    expect(r.semPar).toBe(1); // c
  });

  it("convidado comum não entra nas contagens de padrinhos", () => {
    const r = resumoCaixas([p("a", "convidado"), p("b", "padrinho")], []);
    expect(r.totalPadrinhos).toBe(1);
  });
});

describe("convites pequenos (FASE 6)", () => {
  const gente = [{ faixa: "adulto" as const }, { faixa: "jovem" as const }, { faixa: "crianca" as const }];

  it("por integrante", () => {
    expect(convitesPequenos(KITS.padrinhos_casal, gente)).toBe(3);
  });
  it("por adulto", () => {
    expect(convitesPequenos({ ...KITS.familiar, regraPequenos: "por_adulto" }, gente)).toBe(1);
  });
  it("por adulto e jovem (kit familiar)", () => {
    expect(convitesPequenos(KITS.familiar, gente)).toBe(2);
  });
  it("nenhum (kit solo)", () => {
    expect(convitesPequenos(KITS.solo, gente)).toBe(0);
  });
  it("ajuste manual vence o cálculo", () => {
    expect(convitesPequenos(KITS.familiar, gente, 5)).toBe(5);
    expect(convitesPequenos(KITS.familiar, gente, 0)).toBe(0);
  });
});

describe("produção de grupos", () => {
  it("kit padrinhos casal: 1 caixa, 1 grande, pequenos por integrante", () => {
    expect(producaoGrupo("padrinhos_casal", [{ faixa: "adulto" }, { faixa: "adulto" }])).toEqual({
      caixas: 1,
      convitesGrandes: 1,
      convitesPequenos: 2,
    });
  });
  it("familiar: 0 caixas, 1 grande, pequenos por adulto/jovem", () => {
    expect(
      producaoGrupo("familiar", [{ faixa: "adulto" }, { faixa: "jovem" }, { faixa: "crianca" }]),
    ).toEqual({ caixas: 0, convitesGrandes: 1, convitesPequenos: 2 });
  });
  it("kit desconhecido cai em familiar", () => {
    expect(producaoGrupo("inexistente", [{ faixa: "adulto" }]).convitesGrandes).toBe(1);
  });
  it("soma da produção", () => {
    const total = somarProducao([
      producaoGrupo("padrinhos_casal", [{ faixa: "adulto" }, { faixa: "adulto" }]),
      producaoGrupo("familiar", [{ faixa: "adulto" }, { faixa: "crianca" }]),
    ]);
    expect(total).toEqual({ caixas: 1, convitesGrandes: 2, convitesPequenos: 3 });
  });
});

describe("normalizarFaixa (compat eh_crianca)", () => {
  it("usa faixa explícita quando válida", () => {
    expect(normalizarFaixa("jovem")).toBe("jovem");
  });
  it("cai em criança quando eh_crianca e sem faixa", () => {
    expect(normalizarFaixa(null, true)).toBe("crianca");
    expect(normalizarFaixa(null, false)).toBe("adulto");
  });
});
