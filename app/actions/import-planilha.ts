"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { previewPlanilha, parseListaRapida, type GrupoDraft } from "@/domain/convidados/importPlanilha";
import { KITS } from "@/domain/convites/caixas";

export interface ImportPlanilhaState {
  ok: boolean;
  message: string;
}

const TIPOS = new Set(["familiar", "casal", "solo", "padrinhos", "personalizado"]);
const PAPEIS_IMP = new Set(["convidado", "padrinho", "madrinha"]);

/** Valida o JSON de grupos editado no navegador antes de persistir (backend manda). */
function sanitizarGrupos(entrada: unknown): GrupoDraft[] {
  if (!Array.isArray(entrada)) return [];
  const out: GrupoDraft[] = [];
  for (const g of entrada as Record<string, unknown>[]) {
    if (!g || typeof g !== "object") continue;
    const membrosRaw = Array.isArray(g.membros) ? (g.membros as Record<string, unknown>[]) : [];
    const membros = membrosRaw
      .map((m) => ({
        nome: String(m?.nome ?? "").trim(),
        papel: (PAPEIS_IMP.has(String(m?.papel)) ? String(m?.papel) : "convidado") as GrupoDraft["membros"][number]["papel"],
      }))
      .filter((m) => m.nome !== "");
    if (membros.length === 0) continue;
    const tipo = TIPOS.has(String(g.tipo)) ? (String(g.tipo) as GrupoDraft["tipo"]) : "familiar";
    const kit = typeof g.kit === "string" && KITS[g.kit] ? g.kit : "familiar";
    out.push({
      nomeImpressao: String(g.nomeImpressao ?? "").trim() || membros.map((m) => m.nome).join(" e "),
      tipo,
      kit,
      ehPadrinhos: membros.some((m) => m.papel !== "convidado"),
      sugestaoCasal: false,
      ambiguo: false,
      membros,
    });
  }
  return out;
}

function revalidarConvidados() {
  for (const t of ["/admin/convidados", "/admin/grupos", "/admin/padrinhos", "/admin/padrinhos/duplas", "/admin"]) {
    revalidatePath(t);
  }
}

/**
 * Lista rápida: cria os convidados SEM grupo (para vincular às famílias depois),
 * marcando quem é criança. Dedup por nome (case-insensitive) contra os ativos.
 */
export async function importarListaRapida(_prev: ImportPlanilhaState, formData: FormData): Promise<ImportPlanilhaState> {
  const texto = String(formData.get("texto") ?? "");
  const { pessoas, total, criancas } = parseListaRapida(texto);
  if (total === 0) return { ok: false, message: "Digite ao menos um nome (um por linha)." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { data: existentes } = await supabase.from("hg_guests").select("nome").is("deleted_at", null);
  const jaTem = new Set((existentes ?? []).map((g) => String(g.nome).trim().toLowerCase()));

  const novos = pessoas.filter((p) => !jaTem.has(p.nome.toLowerCase()));
  const dups = pessoas.length - novos.length;
  if (novos.length === 0) return { ok: false, message: `Todos os ${total} nomes já existem na lista.` };

  const { error } = await supabase.from("hg_guests").insert(
    novos.map((p) => ({
      nome: p.nome,
      papel: "convidado",
      faixa_etaria: p.faixa,
      eh_crianca: p.faixa === "crianca",
      group_id: null,
    })),
  );
  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "convidados", acao: "import_rapido", valorNovo: { total: novos.length, criancas } });
  revalidarConvidados();
  return {
    ok: true,
    message: `${novos.length} convidado(s) adicionados (${criancas} criança(s))${dups ? ` · ${dups} já existiam` : ""}. Agora vincule às famílias.`,
  };
}

/**
 * Planilha com grupos: reconhece os rótulos mesclados e cria grupos de convite +
 * convidados + padrinhos numa TRANSAÇÃO (RPC hg_import_convidados). Casais de
 * padrinhos ficam como sugestão em "A vincular" — nada é vinculado sozinho.
 */
export async function importarPlanilhaGrupos(_prev: ImportPlanilhaState, formData: FormData): Promise<ImportPlanilhaState> {
  // Usa a prévia EDITADA no navegador (papel/kit ajustados) quando enviada;
  // senão reprocessa o texto no servidor (fonte da verdade em ambos os casos).
  const rawJson = String(formData.get("grupos_json") ?? "").trim();
  let grupos: GrupoDraft[] = [];
  if (rawJson) {
    try {
      grupos = sanitizarGrupos(JSON.parse(rawJson));
    } catch {
      grupos = [];
    }
  }
  if (grupos.length === 0) {
    grupos = previewPlanilha(String(formData.get("texto") ?? "")).grupos;
  }
  if (grupos.length === 0) return { ok: false, message: "Cole a planilha (nome e rótulo do convite por linha)." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { data, error } = await supabase.rpc("hg_import_convidados", { p_grupos: grupos });
  if (error) return { ok: false, message: "Não foi possível importar. Verifique o login." };

  const r = (data ?? {}) as { grupos?: number; pessoas?: number; padrinhos?: number; duplicados?: number };
  await logAudit(supabase, { modulo: "convidados", acao: "import_planilha", valorNovo: r });
  revalidarConvidados();
  return {
    ok: true,
    message: `${r.pessoas ?? 0} pessoas em ${r.grupos ?? 0} grupos · ${r.padrinhos ?? 0} padrinhos · ${r.duplicados ?? 0} duplicados ignorados. Vincule os casais em "A vincular".`,
  };
}
