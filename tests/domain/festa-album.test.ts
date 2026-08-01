import { describe, expect, it } from "vitest";
import {
  MAX_ARQUIVOS,
  MAX_BYTES,
  caminhoAprovado,
  caminhoPendente,
  comunicadoNossaFesta,
  linkDaAba,
  linkWhatsapp,
  mensagemAgradecimento,
  nomeSeguro,
  normalizarWhatsapp,
  primeiroNome,
  triarLote,
  validarArquivo,
} from "@/domain/festa/album";

const jpg = (nome: string, tamanho = 1024) => ({ nome, tipo: "image/jpeg", tamanho });

describe("validarArquivo", () => {
  it("aceita os formatos de foto de celular", () => {
    expect(validarArquivo(jpg("festa.jpg"))).toBeNull();
    expect(validarArquivo({ nome: "a.png", tipo: "image/png", tamanho: 10 })).toBeNull();
    expect(validarArquivo({ nome: "a.webp", tipo: "image/webp", tamanho: 10 })).toBeNull();
  });

  it("aceita mime em caixa alta", () => {
    expect(validarArquivo({ nome: "a.jpg", tipo: "IMAGE/JPEG", tamanho: 10 })).toBeNull();
  });

  it("recusa vídeo, PDF e afins explicando o motivo", () => {
    expect(validarArquivo({ nome: "v.mp4", tipo: "video/mp4", tamanho: 10 })).toMatch(/JPG, PNG ou WEBP/);
    expect(validarArquivo({ nome: "d.pdf", tipo: "application/pdf", tamanho: 10 })).toMatch(/JPG/);
  });

  it("recusa arquivo vazio", () => {
    expect(validarArquivo(jpg("a.jpg", 0))).toBe("arquivo vazio");
  });

  it("recusa acima de 15 MB e informa o tamanho", () => {
    const motivo = validarArquivo(jpg("gigante.jpg", MAX_BYTES + 1));
    expect(motivo).toContain("15 MB");
    expect(motivo).toContain("15,0 MB");
  });

  it("aceita exatamente no limite", () => {
    expect(validarArquivo(jpg("limite.jpg", MAX_BYTES))).toBeNull();
  });
});

describe("triarLote", () => {
  it("separa aceitos de recusados preservando a ordem", () => {
    const r = triarLote([jpg("a.jpg"), { nome: "b.mp4", tipo: "video/mp4", tamanho: 5 }, jpg("c.jpg")]);
    expect(r.aceitos.map((a) => a.nome)).toEqual(["a.jpg", "c.jpg"]);
    expect(r.recusados).toEqual([{ nome: "b.mp4", motivo: "só aceitamos JPG, PNG ou WEBP" }]);
  });

  it("corta no limite de 15 fotos por envio", () => {
    const escolhidos = Array.from({ length: 20 }, (_, i) => jpg(`f${i}.jpg`));
    const r = triarLote(escolhidos);
    expect(r.aceitos).toHaveLength(MAX_ARQUIVOS);
    expect(r.recusados).toHaveLength(5);
    expect(r.recusados[0].motivo).toContain("15 fotos");
  });

  it("considera o que já estava selecionado", () => {
    const r = triarLote([jpg("a.jpg"), jpg("b.jpg")], 14);
    expect(r.aceitos.map((a) => a.nome)).toEqual(["a.jpg"]);
    expect(r.recusados).toHaveLength(1);
  });

  it("não aceita nada quando o envio já está cheio", () => {
    const r = triarLote([jpg("a.jpg")], MAX_ARQUIVOS);
    expect(r.aceitos).toHaveLength(0);
  });

  it("lote vazio não quebra", () => {
    expect(triarLote([])).toEqual({ aceitos: [], recusados: [] });
  });
});

describe("nomeSeguro", () => {
  it("tira acento, espaço e caractere estranho", () => {
    expect(nomeSeguro("Foto da Ação (1).JPG")).toBe("Foto_da_Acao_1_.JPG");
  });

  it("neutraliza tentativa de sair da pasta", () => {
    expect(nomeSeguro("../../etc/passwd")).toBe("etc_passwd");
  });

  it("cai num nome padrão quando sobra nada", () => {
    expect(nomeSeguro("///")).toBe("foto.jpg");
  });
});

describe("caminhos no bucket", () => {
  it("envio vai sempre para a fila de moderação", () => {
    expect(caminhoPendente("lote-1", 3, "Minha Foto.jpg")).toBe("pendentes/lote-1/03-Minha_Foto.jpg");
  });

  it("aprovar apenas troca o prefixo", () => {
    expect(caminhoAprovado("pendentes/lote-1/03-a.jpg")).toBe("aprovadas/lote-1/03-a.jpg");
  });

  it("caminho sem prefixo conhecido ainda vai para aprovadas", () => {
    expect(caminhoAprovado("solta.jpg")).toBe("aprovadas/solta.jpg");
  });
});

describe("textos", () => {
  it("usa só o primeiro nome", () => {
    expect(primeiroNome("  Maria Clara Souza ")).toBe("Maria");
    expect(primeiroNome("")).toBe("");
  });

  it("agradece no singular e no plural", () => {
    expect(mensagemAgradecimento("João Pedro", 1)).toContain("Obrigado, João!");
    expect(mensagemAgradecimento("João Pedro", 1)).toContain("sua foto");
    expect(mensagemAgradecimento("Ana", 4)).toContain("suas 4 fotos");
  });

  it("agradece mesmo sem nome informado", () => {
    expect(mensagemAgradecimento("", 2)).toContain("Obrigado!");
  });
});

describe("whatsapp", () => {
  it("normaliza número formatado", () => {
    expect(normalizarWhatsapp("+55 (31) 99999-9999")).toBe("5531999999999");
  });

  it("devolve vazio quando não há número plausível", () => {
    expect(normalizarWhatsapp(null)).toBe("");
    expect(normalizarWhatsapp("")).toBe("");
    expect(normalizarWhatsapp("123")).toBe("");
  });

  it("link fica nulo enquanto o número não é configurado", () => {
    expect(linkWhatsapp(null, "oi")).toBeNull();
    expect(linkWhatsapp("  ", "oi")).toBeNull();
  });

  it("monta wa.me com a mensagem codificada", () => {
    expect(linkWhatsapp("5531999999999", "Fotos do casamento 💛")).toBe(
      `https://wa.me/5531999999999?text=${encodeURIComponent("Fotos do casamento 💛")}`,
    );
  });

  it("sem mensagem, o link vai limpo", () => {
    expect(linkWhatsapp("5531999999999", "   ")).toBe("https://wa.me/5531999999999");
  });
});

describe("comunicado da Evania", () => {
  it("monta o link da aba sem barra duplicada", () => {
    expect(linkDaAba("https://site.com/")).toBe("https://site.com/nossa-festa");
    expect(linkDaAba("https://site.com")).toBe("https://site.com/nossa-festa");
  });

  it("carrega o link e o marcador de personalização", () => {
    const texto = comunicadoNossaFesta("https://site.com/nossa-festa");
    expect(texto).toContain("https://site.com/nossa-festa");
    expect(texto).toContain("{{nome}}");
  });
});
