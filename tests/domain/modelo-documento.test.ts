import { describe, expect, it } from "vitest";
import {
  aplicarMarcadores,
  classesDestaque,
  MODELO_PADRAO,
  resolverModelo,
  textoDoModelo,
} from "@/domain/contratacao/modelo";

const VARS = {
  noivos: "Helena & Guilherme",
  noiva: "Helena",
  noivo: "Guilherme",
  data: "29 de maio de 2027",
  local: "Itabira — MG",
  numero: "AC-2026-0007",
  fornecedor: "Estúdio Luz",
  valor: "R$ 5.403,00",
};

describe("aplicarMarcadores", () => {
  it("substitui os marcadores conhecidos", () => {
    expect(aplicarMarcadores("Casamento {{noivos}} em {{data}}", VARS)).toBe(
      "Casamento Helena & Guilherme em 29 de maio de 2027",
    );
  });

  it("aceita espaços dentro das chaves", () => {
    expect(aplicarMarcadores("{{ noiva }} e {{ noivo }}", VARS)).toBe("Helena e Guilherme");
  });

  it("mantém marcador desconhecido em vez de apagar", () => {
    expect(aplicarMarcadores("Oi {{xpto}}", VARS)).toBe("Oi {{xpto}}");
  });

  it("texto sem marcador passa intacto", () => {
    expect(aplicarMarcadores("Texto simples", VARS)).toBe("Texto simples");
  });

  it("substitui o mesmo marcador várias vezes", () => {
    expect(aplicarMarcadores("{{noiva}}, {{noiva}}!", VARS)).toBe("Helena, Helena!");
  });
});

describe("resolverModelo", () => {
  it("modelo nulo devolve o padrão", () => {
    expect(resolverModelo(null)).toEqual(MODELO_PADRAO);
  });

  it("campo de texto vazio cai no padrão", () => {
    const r = resolverModelo({ titulo: "   ", declaracao: "Texto próprio." });
    expect(r.titulo).toBe(MODELO_PADRAO.titulo);
    expect(r.declaracao).toBe("Texto próprio.");
  });

  it("campo nulo cai no padrão", () => {
    expect(resolverModelo({ rodape: null }).rodape).toBe(MODELO_PADRAO.rodape);
  });

  it("booleano falso é respeitado (esconder bloco)", () => {
    const r = resolverModelo({ mostrar_assinaturas: false, mostrar_rodape: false });
    expect(r.mostrar_assinaturas).toBe(false);
    expect(r.mostrar_rodape).toBe(false);
    expect(r.mostrar_evento).toBe(true);
  });

  it("preserva a cor escolhida", () => {
    expect(resolverModelo({ cor_destaque: "olive" }).cor_destaque).toBe("olive");
  });
});

describe("textoDoModelo", () => {
  it("resolve padrão + marcadores", () => {
    const m = resolverModelo(null);
    expect(textoDoModelo(m, "cabecalho_titulo", VARS)).toBe("Casamento Helena & Guilherme");
    expect(textoDoModelo(m, "rodape", VARS)).toContain("AC-2026-0007");
  });

  it("usa o texto customizado quando existe", () => {
    const m = resolverModelo({ titulo: "Ordem de serviço de {{fornecedor}}" });
    expect(textoDoModelo(m, "titulo", VARS)).toBe("Ordem de serviço de Estúdio Luz");
  });
});

describe("classesDestaque", () => {
  it("devolve as classes da cor escolhida", () => {
    expect(classesDestaque("olive").texto).toBe("text-olive");
  });

  it("cor inválida cai no dourado", () => {
    expect(classesDestaque("roxo-neon").texto).toBe("text-gold");
  });
});
