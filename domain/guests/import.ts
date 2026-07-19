/**
 * Importação de convidados (PROJECT_SPEC §7): CSV / colar, mapeamento de colunas,
 * detecção de duplicidade, pré-visualização. Lógica pura e testável — a persistência
 * (com ponto de restauração) é feita na camada de serviço.
 */

export interface RawRow {
  [coluna: string]: string;
}

export interface GuestDraft {
  nome: string;
  email: string | null;
  telefone: string | null;
  grupo: string | null;
  ehCrianca: boolean;
  linha: number; // 1-based (para relatório de erros)
}

export interface ImportResult {
  validos: GuestDraft[];
  duplicados: GuestDraft[];
  invalidos: Array<{ linha: number; motivo: string }>;
}

/** Mapeamento coluna do arquivo → campo do sistema. */
export interface ColumnMap {
  nome: string;
  email?: string;
  telefone?: string;
  grupo?: string;
  eh_crianca?: string;
}

/** Parser de CSV/colado simples (vírgula, ponto-e-vírgula ou tab), com cabeçalho. */
export function parseDelimited(text: string): RawRow[] {
  const linhas = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) return [];
  const delim = detectDelimiter(linhas[0]);
  const header = splitLine(linhas[0], delim).map((h) => h.trim());
  return linhas.slice(1).map((linha) => {
    const cols = splitLine(linha, delim);
    const row: RawRow = {};
    header.forEach((h, i) => (row[h] = (cols[i] ?? "").trim()));
    return row;
  });
}

function detectDelimiter(headerLine: string): string {
  const candidates = [";", ",", "\t"];
  return candidates
    .map((d) => ({ d, n: headerLine.split(d).length }))
    .sort((a, b) => b.n - a.n)[0].d;
}

function splitLine(line: string, delim: string): string[] {
  // Suporte básico a aspas.
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const TRUTHY = new Set(["1", "true", "sim", "s", "x", "crianca", "criança"]);

function normPhone(v: string): string {
  return v.replace(/\D/g, "");
}

/** Chave de deduplicação: e-mail (se houver) senão nome+telefone normalizados. */
export function dedupeKey(g: { email: string | null; nome: string; telefone: string | null }): string {
  if (g.email) return `email:${g.email.toLowerCase()}`;
  return `nt:${g.nome.trim().toLowerCase()}|${normPhone(g.telefone ?? "")}`;
}

/**
 * Aplica o mapeamento, valida e detecta duplicados (contra os já existentes e
 * dentro do próprio lote).
 */
export function buildImport(
  rows: RawRow[],
  map: ColumnMap,
  existingKeys: Set<string> = new Set(),
): ImportResult {
  const result: ImportResult = { validos: [], duplicados: [], invalidos: [] };
  const seen = new Set(existingKeys);

  rows.forEach((row, i) => {
    const linha = i + 2; // +1 header, +1 base-1
    const nome = (row[map.nome] ?? "").trim();
    if (!nome) {
      result.invalidos.push({ linha, motivo: "Nome vazio" });
      return;
    }
    const emailRaw = map.email ? (row[map.email] ?? "").trim() : "";
    const email = emailRaw || null;
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      result.invalidos.push({ linha, motivo: `E-mail inválido: ${email}` });
      return;
    }
    const draft: GuestDraft = {
      nome,
      email,
      telefone: map.telefone ? (row[map.telefone] ?? "").trim() || null : null,
      grupo: map.grupo ? (row[map.grupo] ?? "").trim() || null : null,
      ehCrianca: map.eh_crianca ? TRUTHY.has((row[map.eh_crianca] ?? "").trim().toLowerCase()) : false,
      linha,
    };
    const key = dedupeKey(draft);
    if (seen.has(key)) {
      result.duplicados.push(draft);
      return;
    }
    seen.add(key);
    result.validos.push(draft);
  });

  return result;
}
