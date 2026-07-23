import { describe, expect, it } from "vitest";
import { parseGiftsCSV, toGiftsCSV } from "@/domain/gifts/csv";

describe("presentes — import/export CSV", () => {
  it("faz parse com delimitador ; e valor pt-BR", () => {
    const csv = "nome;descricao;valor;imagem_url;permite_cota\nJogo de panelas;Tramontina;1.234,50;http://x/p.jpg;sim";
    const { rows, erros } = parseGiftsCSV(csv);
    expect(erros).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      nome: "Jogo de panelas",
      descricao: "Tramontina",
      precoCents: 123450,
      imagem_url: "http://x/p.jpg",
      permite_cota: true,
    });
  });

  it("aceita delimitador , e valor com ponto decimal", () => {
    const csv = "nome,descricao,valor,imagem_url,permite_cota\nLiquidificador,,199.90,,nao";
    const { rows } = parseGiftsCSV(csv);
    expect(rows[0].precoCents).toBe(19990);
    expect(rows[0].descricao).toBeNull();
    expect(rows[0].permite_cota).toBe(false);
  });

  it("respeita aspas com delimitador embutido", () => {
    const csv = 'nome;descricao;valor\n"Taça; especial";"Cristal, fino";50,00';
    const { rows } = parseGiftsCSV(csv);
    expect(rows[0].nome).toBe("Taça; especial");
    expect(rows[0].descricao).toBe("Cristal, fino");
    expect(rows[0].precoCents).toBe(5000);
  });

  it("ignora linha sem nome e avisa", () => {
    const csv = "nome;valor\n;10,00\nVálido;5,00";
    const { rows, erros } = parseGiftsCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].nome).toBe("Válido");
    expect(erros.length).toBe(1);
  });

  it("valor inválido vira 0 com aviso, não quebra", () => {
    const csv = "nome;valor\nItem;abc";
    const { rows, erros } = parseGiftsCSV(csv);
    expect(rows[0].precoCents).toBe(0);
    expect(erros.length).toBe(1);
  });

  it("cabeçalho sem 'nome' é rejeitado", () => {
    const { rows, erros } = parseGiftsCSV("titulo;valor\nx;1");
    expect(rows).toHaveLength(0);
    expect(erros[0]).toMatch(/nome/);
  });

  it("toGiftsCSV → parseGiftsCSV é ida-e-volta consistente", () => {
    const gifts = [
      { nome: "Panela", descricao: "Inox", preco: 250.9, imagem_url: "http://x/a.jpg", permite_cota: true },
      { nome: "Toalha", descricao: null, preco: 0, imagem_url: null, permite_cota: false },
    ];
    const csv = toGiftsCSV(gifts);
    const { rows } = parseGiftsCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].precoCents).toBe(25090);
    expect(rows[0].permite_cota).toBe(true);
    expect(rows[1].precoCents).toBe(0);
    expect(rows[1].descricao).toBeNull();
  });
});
