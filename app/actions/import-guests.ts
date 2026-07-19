"use server";

import { revalidatePath } from "next/cache";
import { buildImport, parseDelimited, type ColumnMap } from "@/domain/guests/import";
import { createClient } from "@/lib/supabase/server";

export interface ImportState {
  ok: boolean;
  message: string;
  detalhes?: string[];
}

/** Detecta as colunas pelos nomes do cabeçalho (flexível a variações). */
function detectMap(headers: string[]): ColumnMap {
  const find = (re: RegExp) => headers.find((h) => re.test(h));
  return {
    nome: find(/nome|name/i) ?? headers[0] ?? "nome",
    email: find(/e-?mail/i),
    telefone: find(/tel|fone|celular|whats/i),
    grupo: find(/grupo|fam[ií]lia|fam/i),
    eh_crianca: find(/crian|kid|child/i),
  };
}

/**
 * Importa convidados a partir de CSV/planilha colada (painel, autenticado).
 * Detecta duplicidade e valida antes de inserir.
 */
export async function importarConvidados(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const texto = String(formData.get("texto") ?? "").trim();
  if (!texto) return { ok: false, message: "Cole os dados dos convidados (com cabeçalho)." };

  const rows = parseDelimited(texto);
  if (rows.length === 0) {
    return { ok: false, message: "Não reconheci nenhuma linha. Inclua um cabeçalho e uma linha por convidado." };
  }

  const map = detectMap(Object.keys(rows[0]));
  const supabase = createClient();

  // Duplicidade contra os convidados já cadastrados.
  const existentes = new Set<string>();
  if (supabase) {
    const { data } = await supabase.from("hg_guests").select("*");
    for (const g of (data ?? []) as { nome: string; email: string | null; telefone: string | null }[]) {
      const key = g.email ? `email:${g.email.toLowerCase()}` : `nt:${g.nome.trim().toLowerCase()}|${(g.telefone ?? "").replace(/\D/g, "")}`;
      existentes.add(key);
    }
  }

  const res = buildImport(rows, map, existentes);

  if (supabase && res.validos.length) {
    const { error } = await supabase.from("hg_guests").insert(
      res.validos.map((v) => ({
        nome: v.nome,
        email: v.email,
        telefone: v.telefone,
        eh_crianca: v.ehCrianca,
      })),
    );
    if (error) {
      return { ok: false, message: "Falha ao salvar. Verifique se você está autenticado." };
    }
    revalidatePath("/admin/convidados");
  }

  const detalhes = res.invalidos.slice(0, 5).map((i) => `Linha ${i.linha}: ${i.motivo}`);
  return {
    ok: true,
    message: `${res.validos.length} adicionados · ${res.duplicados.length} duplicados · ${res.invalidos.length} inválidos.`,
    detalhes,
  };
}
