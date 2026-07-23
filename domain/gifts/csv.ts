/**
 * Import/export da lista de presentes em planilha (CSV amigável a Excel).
 * Colunas: nome; descricao; valor; imagem_url; permite_cota
 * - Delimitador `;` (padrão do Excel pt-BR); também aceita `,` na importação.
 * - Valor aceita "1.234,50" ou "1234.50" (via parseBRLToCents). Nunca inventa preço.
 * Funções puras/testáveis — sem acesso a rede/banco.
 */
import { parseBRLToCents, formatCents } from "@/domain/money";

export interface GiftCSVRow {
  nome: string;
  descricao: string | null;
  precoCents: number;
  imagem_url: string | null;
  permite_cota: boolean;
}

export interface ParseResult {
  rows: GiftCSVRow[];
  erros: string[];
}

const HEADERS = ["nome", "descricao", "valor", "imagem_url", "permite_cota"];

function detectDelim(headerLine: string): string {
  return headerLine.includes(";") ? ";" : ",";
}

/** Divide uma linha CSV respeitando aspas duplas ("" = aspas literal). */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else q = false;
      } else cur += ch;
    } else if (ch === '"') {
      q = true;
    } else if (ch === delim) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function csvField(v: string): string {
  return /["\n;,]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Gera o CSV (delimitador `;`) da lista atual — serve de modelo e de backup editável. */
export function toGiftsCSV(
  gifts: { nome: string; descricao: string | null; preco: number; imagem_url: string | null; permite_cota: boolean }[],
): string {
  const linhas = [HEADERS.join(";")];
  for (const g of gifts) {
    const valor = formatCents(Math.round(g.preco * 100)).replace(/[^\d,]/g, ""); // "1.234,50" → "1234,50"
    linhas.push(
      [
        csvField(g.nome),
        csvField(g.descricao ?? ""),
        valor,
        csvField(g.imagem_url ?? ""),
        g.permite_cota ? "sim" : "nao",
      ].join(";"),
    );
  }
  return linhas.join("\r\n");
}

/** Faz o parse de um CSV de presentes. Linhas sem nome são ignoradas (com aviso). */
export function parseGiftsCSV(text: string): ParseResult {
  const rows: GiftCSVRow[] = [];
  const erros: string[] = [];
  const linhas = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (linhas.length === 0) return { rows, erros: ["Arquivo vazio."] };

  const delim = detectDelim(linhas[0]);
  const header = splitLine(linhas[0], delim).map((h) => h.toLowerCase());
  const idx = {
    nome: header.indexOf("nome"),
    descricao: header.indexOf("descricao"),
    valor: header.findIndex((h) => h === "valor" || h === "preco"),
    imagem: header.findIndex((h) => h === "imagem_url" || h === "imagem"),
    cota: header.findIndex((h) => h === "permite_cota" || h === "cota"),
  };
  if (idx.nome === -1) return { rows, erros: ["Cabeçalho inválido: a coluna 'nome' é obrigatória."] };

  for (let i = 1; i < linhas.length; i++) {
    const cols = splitLine(linhas[i], delim);
    const nome = (cols[idx.nome] ?? "").trim();
    if (!nome) { erros.push(`Linha ${i + 1}: nome vazio (ignorada).`); continue; }

    let precoCents = 0;
    const valorRaw = idx.valor >= 0 ? (cols[idx.valor] ?? "").trim() : "";
    if (valorRaw) {
      try { precoCents = parseBRLToCents(valorRaw); }
      catch { erros.push(`Linha ${i + 1} (${nome}): valor inválido "${valorRaw}" → 0.`); precoCents = 0; }
    }
    const descricao = idx.descricao >= 0 ? (cols[idx.descricao] ?? "").trim() : "";
    const imagem = idx.imagem >= 0 ? (cols[idx.imagem] ?? "").trim() : "";
    const cotaRaw = idx.cota >= 0 ? (cols[idx.cota] ?? "").trim().toLowerCase() : "";
    const permite_cota = ["sim", "s", "true", "1", "x", "yes"].includes(cotaRaw);

    rows.push({ nome, descricao: descricao || null, precoCents, imagem_url: imagem || null, permite_cota });
  }
  return { rows, erros };
}
