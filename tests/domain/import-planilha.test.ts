import { describe, expect, it } from "vitest";
import { parseLinhas, montarPreview, previewPlanilha, parseListaRapida } from "@/domain/convidados/importPlanilha";

describe("importação de planilha — parse de linhas", () => {
  it("ignora cabeçalho e linhas vazias", () => {
    const linhas = parseLinhas("Convidados\nCida\tCaixa convite\n\nMatheus\t");
    expect(linhas).toEqual([
      { nome: "Cida", rotulo: "Caixa convite" },
      { nome: "Matheus", rotulo: "" },
    ]);
  });
});

describe("agrupamento por fill-down (célula mesclada)", () => {
  it("rótulo na 1ª linha agrupa as seguintes em branco", () => {
    const p = montarPreview([
      { nome: "Elen", rotulo: "Tia Elen e família" },
      { nome: "Érico", rotulo: "" },
      { nome: "Laís", rotulo: "" },
    ]);
    expect(p.grupos).toHaveLength(1);
    expect(p.grupos[0].nomeImpressao).toBe("Tia Elen e família");
    expect(p.grupos[0].tipo).toBe("familiar");
    expect(p.grupos[0].membros.map((m) => m.nome)).toEqual(["Elen", "Érico", "Laís"]);
    expect(p.totalPessoas).toBe(3);
  });

  it("grupo de padrinhos com 2 pessoas → sugere casal (1 caixa)", () => {
    const p = montarPreview([
      { nome: "Aline", rotulo: "Caixa padrinhos" },
      { nome: "Alan", rotulo: "" },
    ]);
    expect(p.grupos[0].ehPadrinhos).toBe(true);
    expect(p.grupos[0].sugestaoCasal).toBe(true);
    expect(p.grupos[0].kit).toBe("padrinhos_casal");
    expect(p.grupos[0].membros.every((m) => m.papel === "padrinho")).toBe(true);
    // rótulo genérico → nome de impressão vem dos integrantes
    expect(p.grupos[0].nomeImpressao).toBe("Aline e Alan");
    expect(p.casaisSugeridos).toBe(1);
    expect(p.semPar).toBe(0);
  });

  it("padrinho sozinho → kit individual, sem par", () => {
    const p = montarPreview([{ nome: "Igor", rotulo: "Caixa padrinhos" }]);
    expect(p.grupos[0].kit).toBe("padrinhos_individual");
    expect(p.grupos[0].sugestaoCasal).toBe(false);
    expect(p.totalPadrinhos).toBe(1);
    expect(p.semPar).toBe(1);
    expect(p.possiveisCaixas).toBe(1);
  });

  it("grupo de padrinhos com >2 pessoas é marcado como ambíguo", () => {
    const p = montarPreview([
      { nome: "A", rotulo: "Caixa padrinhos" },
      { nome: "B", rotulo: "" },
      { nome: "C", rotulo: "" },
    ]);
    expect(p.grupos[0].ambiguo).toBe(true);
    expect(p.grupos[0].sugestaoCasal).toBe(false);
    expect(p.casaisSugeridos).toBe(0);
  });

  it('"A e B" (nomes próprios, 2 pessoas) → casal, não família', () => {
    const p = montarPreview([
      { nome: "Pedro", rotulo: "Pedro e Júlia" },
      { nome: "Júlia", rotulo: "" },
    ]);
    expect(p.grupos[0].tipo).toBe("casal");
    expect(p.grupos[0].ehPadrinhos).toBe(false);
    expect(p.grupos[0].nomeImpressao).toBe("Pedro e Júlia");
  });

  it('"Convite" com 1 pessoa → solo', () => {
    const p = montarPreview([{ nome: "Marcela", rotulo: "Convite" }]);
    expect(p.grupos[0].tipo).toBe("solo");
    expect(p.grupos[0].kit).toBe("solo");
    expect(p.grupos[0].nomeImpressao).toBe("Marcela");
  });

  it("pessoa antes de qualquer rótulo vira grupo próprio", () => {
    const p = montarPreview([{ nome: "Solto", rotulo: "" }]);
    expect(p.grupos).toHaveLength(1);
    expect(p.grupos[0].membros[0].nome).toBe("Solto");
  });
});

describe("lista rápida (digitar todo mundo, 1 por linha)", () => {
  it("conta por faixa; marca criança (c) e jovem (j)", () => {
    const r = parseListaRapida("Ana\nJoão (c)\nMaria (criança)\nPedro - crianca\nBia (j)\nLia (jovem)");
    expect(r.total).toBe(6);
    expect(r.criancas).toBe(3);
    expect(r.jovens).toBe(2);
    expect(r.adultos).toBe(1);
    expect(r.pessoas[1]).toEqual({ nome: "João", faixa: "crianca" });
    expect(r.pessoas[4]).toEqual({ nome: "Bia", faixa: "jovem" });
    expect(r.pessoas[0]).toEqual({ nome: "Ana", faixa: "adulto" });
  });

  it("remove duplicados no próprio lote e linhas vazias", () => {
    const r = parseListaRapida("Ana\n\n  Ana  \nana\nCarlos");
    expect(r.total).toBe(2);
    expect(r.pessoas.map((p) => p.nome)).toEqual(["Ana", "Carlos"]);
  });
});

describe("previewPlanilha (texto colado ponta a ponta)", () => {
  it("conta pessoas, grupos, padrinhos e casais", () => {
    const texto = [
      "Convidados",
      "Elen\tTia Elen e família",
      "Érico\t",
      "Aline\tCaixa padrinhos",
      "Alan\t",
      "Marcela\tConvite",
    ].join("\n");
    const p = previewPlanilha(texto);
    expect(p.totalGrupos).toBe(3);
    expect(p.totalPessoas).toBe(5);
    expect(p.totalPadrinhos).toBe(2);
    expect(p.casaisSugeridos).toBe(1);
    expect(p.possiveisCaixas).toBe(1);
  });
});
