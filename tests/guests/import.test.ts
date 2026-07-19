import { describe, expect, it } from "vitest";
import { buildImport, dedupeKey, parseDelimited } from "@/domain/guests/import";

describe("importação de convidados (PROJECT_SPEC §7)", () => {
  it("faz parse de CSV com cabeçalho e detecta delimitador", () => {
    const csv = "nome;email;telefone\nMaria Souza;maria@x.com;(31) 90000-0000\nJoão;;";
    const rows = parseDelimited(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].nome).toBe("Maria Souza");
    expect(rows[0].email).toBe("maria@x.com");
  });

  it("faz parse de conteúdo colado com vírgula e aspas", () => {
    const txt = 'nome,grupo\n"Silva, Ana",Família Silva\nPedro,Amigos';
    const rows = parseDelimited(txt);
    expect(rows[0].nome).toBe("Silva, Ana");
    expect(rows[1].grupo).toBe("Amigos");
  });

  it("mapeia colunas, valida e separa válidos/duplicados/inválidos", () => {
    const csv =
      "Nome;Email;Fone;Grupo;Crianca\n" +
      "Maria;maria@x.com;31900;Souza;nao\n" +
      "Maria;maria@x.com;31900;Souza;nao\n" + // duplicado (mesmo e-mail)
      ";;;;\n" + // inválido (sem nome)
      "Lucas;;;Souza;sim"; // criança
    const rows = parseDelimited(csv);
    const res = buildImport(rows, {
      nome: "Nome", email: "Email", telefone: "Fone", grupo: "Grupo", eh_crianca: "Crianca",
    });
    expect(res.validos.map((v) => v.nome)).toEqual(["Maria", "Lucas"]);
    expect(res.validos[1].ehCrianca).toBe(true);
    expect(res.duplicados).toHaveLength(1);
    expect(res.invalidos).toHaveLength(1);
    expect(res.invalidos[0].motivo).toMatch(/Nome vazio/);
  });

  it("detecta duplicidade contra convidados já existentes", () => {
    const existentes = new Set([dedupeKey({ email: "maria@x.com", nome: "Maria", telefone: null })]);
    const rows = parseDelimited("Nome;Email\nMaria;maria@x.com\nAna;ana@x.com");
    const res = buildImport(rows, { nome: "Nome", email: "Email" }, existentes);
    expect(res.validos.map((v) => v.nome)).toEqual(["Ana"]);
    expect(res.duplicados.map((v) => v.nome)).toEqual(["Maria"]);
  });

  it("rejeita e-mail malformado", () => {
    const rows = parseDelimited("Nome;Email\nMaria;maria(arroba)x");
    const res = buildImport(rows, { nome: "Nome", email: "Email" });
    expect(res.invalidos[0].motivo).toMatch(/E-mail inválido/);
  });

  it("deduplica por nome+telefone quando não há e-mail", () => {
    const rows = parseDelimited("Nome;Fone\nJoão Silva;(31) 90000-0000\nJoão Silva;31900000000");
    const res = buildImport(rows, { nome: "Nome", telefone: "Fone" });
    expect(res.validos).toHaveLength(1);
    expect(res.duplicados).toHaveLength(1);
  });
});
