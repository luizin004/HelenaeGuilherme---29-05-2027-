import { describe, expect, it } from "vitest";
import {
  destinatarioNotaFiscal,
  linhaContratantes,
  linhaEndereco,
  linhasPagamento,
  montarTextoAutorizacao,
  numeroAutorizacao,
  resumoPagamento,
  type AutorizacaoInput,
} from "@/domain/contratacao/autorizacao";
import { formatCents } from "@/domain/money";

const base: AutorizacaoInput = {
  seq: 7,
  emitidaEm: "2026-07-29T12:00:00Z",
  hoje: "2026-07-29",
  titulo: "Fotógrafo",
  categoria: "Registro",
  valorCents: 540300,
  escopo: "Cobertura da cerimônia e da festa\nÁlbum impresso",
  observacoes: null,
  fornecedor: {
    nome: "Estúdio Luz",
    documento: "12.345.678/0001-90",
    contato: "Marina",
    telefone: "(31) 99999-0000",
    email: "contato@luz.com",
    endereco: "Rua A, 100",
  },
  contratantes: {
    nome: "Helena Souza",
    documento: "111.111.111-11",
    nome2: "Guilherme Moura",
    documento2: "222.222.222-22",
    email: "casal@exemplo.com",
    telefone: "(31) 98888-0000",
    endereco: "Rua das Flores, 50",
    cidade: "Itabira",
    uf: "MG",
    cep: "35900-000",
  },
  notaFiscal: {
    destinatario: null,
    documento: null,
    ie: null,
    im: null,
    endereco: null,
    email: "nf@exemplo.com",
    observacoes: null,
  },
  condicoesGerais: "Alterações de escopo exigem aprovação prévia por escrito.",
  evento: { data: "29 de maio de 2027", local: "Itabira — MG" },
  parcelas: [
    { numero: 1, valor_cents: 180100, vencimento: "2026-08-10" },
    { numero: 2, valor_cents: 180100, vencimento: "2026-09-10" },
    { numero: 3, valor_cents: 180100, vencimento: "2026-10-10" },
  ],
};

describe("numeroAutorizacao", () => {
  it("formata com ano da emissão e 4 dígitos", () => {
    expect(numeroAutorizacao(7, "2026-07-29T12:00:00Z")).toBe("AC-2026-0007");
    expect(numeroAutorizacao(123, "2027-01-02T00:00:00Z")).toBe("AC-2027-0123");
  });

  it("sem número emitido é rascunho", () => {
    expect(numeroAutorizacao(null, null)).toBe("RASCUNHO");
  });
});

describe("linhasPagamento", () => {
  it("ordena por número e mostra valor e vencimento", () => {
    const linhas = linhasPagamento([
      { numero: 2, valor_cents: 5000, vencimento: "2026-09-10" },
      { numero: 1, valor_cents: 5000, vencimento: "2026-08-10" },
    ]);
    expect(linhas[0]).toContain("1ª parcela");
    expect(linhas[0]).toContain("10/08/2026");
    expect(linhas[1]).toContain("2ª parcela");
  });

  it("parcela sem data vira 'a combinar'", () => {
    expect(linhasPagamento([{ numero: 1, valor_cents: 100, vencimento: null }])[0]).toContain("a combinar");
  });
});

describe("resumoPagamento", () => {
  it("descreve intervalo das parcelas", () => {
    expect(resumoPagamento(base.parcelas)).toBe("Pagamento em 3 parcelas, de 10/08/2026 a 10/10/2026.");
  });

  it("pagamento único com data", () => {
    expect(resumoPagamento([{ numero: 1, valor_cents: 100, vencimento: "2026-08-10" }])).toContain("Pagamento único");
  });

  it("sem parcelas geradas fica a definir", () => {
    expect(resumoPagamento([])).toContain("a definir");
  });
});

describe("contratantes e endereço", () => {
  it("junta as duas pessoas com CPF", () => {
    expect(linhaContratantes(base.contratantes)).toBe(
      "Helena Souza (CPF 111.111.111-11) e Guilherme Moura (CPF 222.222.222-22)",
    );
  });

  it("sem dados avisa onde preencher", () => {
    const vazio = { ...base.contratantes, nome: null, nome2: null };
    expect(linhaContratantes(vazio)).toContain("preencher");
  });

  it("monta endereço com cidade, UF e CEP", () => {
    expect(linhaEndereco(base.contratantes)).toBe("Rua das Flores, 50 · Itabira — MG · CEP 35900-000");
  });
});

describe("destinatarioNotaFiscal", () => {
  it("cai para o 1º contratante quando a NF não tem destinatário próprio", () => {
    const nf = destinatarioNotaFiscal(base);
    expect(nf.nome).toBe("Helena Souza");
    expect(nf.documento).toBe("111.111.111-11");
    expect(nf.endereco).toContain("Rua das Flores");
  });

  it("usa o destinatário próprio quando informado", () => {
    const nf = destinatarioNotaFiscal({
      ...base,
      notaFiscal: { ...base.notaFiscal, destinatario: "Empresa X", documento: "99.999.999/0001-99" },
    });
    expect(nf.nome).toBe("Empresa X");
    expect(nf.documento).toBe("99.999.999/0001-99");
  });
});

describe("montarTextoAutorizacao", () => {
  const texto = montarTextoAutorizacao(base);

  it("traz número, objeto, valor e fornecedor", () => {
    expect(texto).toContain("AC-2026-0007");
    expect(texto).toContain("Fotógrafo");
    expect(texto).toContain(formatCents(540300));
    expect(texto).toContain("Estúdio Luz");
  });

  it("lista todas as parcelas projetadas", () => {
    expect(texto).toContain("1ª parcela");
    expect(texto).toContain("2ª parcela");
    expect(texto).toContain("3ª parcela");
  });

  it("inclui os dados de nota fiscal e o pedido de contrato", () => {
    expect(texto).toContain("DADOS PARA NOTA FISCAL");
    expect(texto).toContain("nf@exemplo.com");
    expect(texto).toContain("envio do contrato para assinatura");
  });

  it("omite fornecedor ausente sem quebrar", () => {
    const semFornecedor = montarTextoAutorizacao({ ...base, fornecedor: null });
    expect(semFornecedor).toContain("fornecedor não vinculado");
  });
});
