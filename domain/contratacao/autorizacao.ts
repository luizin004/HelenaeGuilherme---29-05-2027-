/**
 * Aprovação de orçamento / autorização de contratação.
 *
 * Documento que formaliza ao fornecedor: o que foi aprovado, por quanto, em
 * quais datas de pagamento (as mesmas já projetadas no financeiro) e para quem
 * a nota fiscal deve ser emitida — para que ele devolva o contrato.
 *
 * Módulo puro: não conhece banco nem React (testável isoladamente).
 */

import { formatCents, type Cents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";

export interface ParcelaAutorizacao {
  numero: number;
  valor_cents: Cents;
  vencimento: string | null;
}

export interface AutorizacaoInput {
  seq: number | null;
  emitidaEm: string | null;
  /** Data usada no cabeçalho quando ainda é rascunho (ISO YYYY-MM-DD). */
  hoje: string;
  titulo: string;
  categoria: string | null;
  valorCents: Cents;
  escopo: string | null;
  observacoes: string | null;
  fornecedor: {
    nome: string;
    documento: string | null;
    contato: string | null;
    telefone: string | null;
    email: string | null;
    endereco: string | null;
  } | null;
  contratantes: {
    nome: string | null;
    documento: string | null;
    nome2: string | null;
    documento2: string | null;
    email: string | null;
    telefone: string | null;
    endereco: string | null;
    cidade: string | null;
    uf: string | null;
    cep: string | null;
  };
  notaFiscal: {
    destinatario: string | null;
    documento: string | null;
    ie: string | null;
    im: string | null;
    endereco: string | null;
    email: string | null;
    observacoes: string | null;
  };
  condicoesGerais: string | null;
  evento: { data: string; local: string };
  parcelas: ParcelaAutorizacao[];
  /** Quando falso, o item foi acordado sem emissão de NF (recibo basta). */
  exigeNotaFiscal: boolean;
}

/** Número do documento: AC-2026-0007. Sem emissão ainda → "RASCUNHO". */
export function numeroAutorizacao(seq: number | null, emitidaEm: string | null): string {
  if (seq === null) return "RASCUNHO";
  const ano = (emitidaEm ?? "").slice(0, 4) || String(new Date().getFullYear());
  return `AC-${ano}-${String(seq).padStart(4, "0")}`;
}

/** Uma linha legível por parcela, na ordem do cronograma já projetado. */
export function linhasPagamento(parcelas: ParcelaAutorizacao[]): string[] {
  return parcelas
    .slice()
    .sort((a, b) => a.numero - b.numero)
    .map((p) => {
      const quando = p.vencimento ? `vencimento em ${fmtDateBR(p.vencimento)}` : "data a combinar";
      return `${p.numero}ª parcela — ${formatCents(p.valor_cents)} · ${quando}`;
    });
}

/**
 * Resumo da condição de pagamento numa frase (ex.: "em 3 parcelas, de
 * 10/08/2026 a 10/10/2026"). Sem parcelas geradas → pagamento a combinar.
 */
export function resumoPagamento(parcelas: ParcelaAutorizacao[]): string {
  if (parcelas.length === 0) return "Condição de pagamento a definir entre as partes.";
  if (parcelas.length === 1) {
    const p = parcelas[0];
    return p.vencimento
      ? `Pagamento único, com vencimento em ${fmtDateBR(p.vencimento)}.`
      : "Pagamento único, data a combinar.";
  }
  const datas = parcelas.map((p) => p.vencimento).filter((v): v is string => !!v).sort();
  if (datas.length === 0) return `Pagamento em ${parcelas.length} parcelas, datas a combinar.`;
  return `Pagamento em ${parcelas.length} parcelas, de ${fmtDateBR(datas[0])} a ${fmtDateBR(datas[datas.length - 1])}.`;
}

/** Contratantes numa linha só ("Fulano (CPF X) e Beltrano (CPF Y)"). */
export function linhaContratantes(c: AutorizacaoInput["contratantes"]): string {
  const pessoa = (nome: string | null, doc: string | null) =>
    nome ? (doc ? `${nome} (CPF ${doc})` : nome) : null;
  const partes = [pessoa(c.nome, c.documento), pessoa(c.nome2, c.documento2)].filter(Boolean);
  return partes.length ? partes.join(" e ") : "— preencher em Contratos › Dados de contratação —";
}

/** Endereço completo em uma linha; vazio vira traço. */
export function linhaEndereco(c: AutorizacaoInput["contratantes"]): string {
  const cidadeUf = [c.cidade, c.uf].filter(Boolean).join(" — ");
  const partes = [c.endereco, cidadeUf, c.cep ? `CEP ${c.cep}` : null].filter(Boolean);
  return partes.length ? partes.join(" · ") : "—";
}

/** Destinatário da NF, caindo para o 1º contratante quando não informado. */
export function destinatarioNotaFiscal(i: AutorizacaoInput): { nome: string; documento: string; endereco: string } {
  return {
    nome: i.notaFiscal.destinatario || i.contratantes.nome || "—",
    documento: i.notaFiscal.documento || i.contratantes.documento || "—",
    endereco: i.notaFiscal.endereco || linhaEndereco(i.contratantes),
  };
}

/** Versão em texto puro, para colar no WhatsApp ou no corpo do e-mail. */
export function montarTextoAutorizacao(i: AutorizacaoInput): string {
  const nf = destinatarioNotaFiscal(i);
  const emissao = fmtDateBR(i.emitidaEm ? i.emitidaEm.slice(0, 10) : i.hoje);
  const linhas: string[] = [
    `APROVAÇÃO DE ORÇAMENTO E AUTORIZAÇÃO DE CONTRATAÇÃO`,
    `Documento ${numeroAutorizacao(i.seq, i.emitidaEm)} · ${emissao}`,
    ``,
    `CONTRATANTES: ${linhaContratantes(i.contratantes)}`,
    `Endereço: ${linhaEndereco(i.contratantes)}`,
  ];
  if (i.contratantes.email) linhas.push(`E-mail: ${i.contratantes.email}`);
  if (i.contratantes.telefone) linhas.push(`Telefone: ${i.contratantes.telefone}`);

  linhas.push(``, `CONTRATADO: ${i.fornecedor?.nome ?? "— fornecedor não vinculado —"}`);
  if (i.fornecedor?.documento) linhas.push(`CNPJ/CPF: ${i.fornecedor.documento}`);
  if (i.fornecedor?.contato) linhas.push(`Contato: ${i.fornecedor.contato}`);

  linhas.push(
    ``,
    `OBJETO: ${i.titulo}${i.categoria ? ` (${i.categoria})` : ""}`,
  );
  if (i.escopo) linhas.push(`Escopo:`, i.escopo);

  linhas.push(
    ``,
    `VALOR TOTAL APROVADO: ${formatCents(i.valorCents)}`,
    resumoPagamento(i.parcelas),
  );
  for (const l of linhasPagamento(i.parcelas)) linhas.push(`  • ${l}`);

  if (i.exigeNotaFiscal) {
    linhas.push(
      ``,
      `NOTA FISCAL — emissão obrigatória para:`,
      `Destinatário: ${nf.nome}`,
      `CPF/CNPJ: ${nf.documento}`,
      `Endereço: ${nf.endereco}`,
    );
    if (i.notaFiscal.ie) linhas.push(`Inscrição estadual: ${i.notaFiscal.ie}`);
    if (i.notaFiscal.im) linhas.push(`Inscrição municipal: ${i.notaFiscal.im}`);
    if (i.notaFiscal.email) linhas.push(`Enviar a NF para: ${i.notaFiscal.email}`);
    if (i.notaFiscal.observacoes) linhas.push(i.notaFiscal.observacoes);
  } else {
    linhas.push(``, `NOTA FISCAL: não haverá emissão — recibo simples é suficiente.`);
  }

  linhas.push(``, `EVENTO: ${i.evento.data} · ${i.evento.local}`);
  if (i.observacoes) linhas.push(``, `OBSERVAÇÕES: ${i.observacoes}`);
  if (i.condicoesGerais) linhas.push(``, i.condicoesGerais);

  linhas.push(
    ``,
    `Aprovamos o orçamento acima e autorizamos a contratação nas condições descritas.`,
    `Solicitamos o envio do contrato para assinatura, contemplando o mesmo escopo, valor e cronograma de pagamento.`,
  );

  return linhas.join("\n");
}
