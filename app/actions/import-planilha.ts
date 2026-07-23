"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { previewPlanilha, parseListaRapida } from "@/domain/convidados/importPlanilha";

export interface ImportPlanilhaState {
  ok: boolean;
  message: string;
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
    novos.map((p) => ({ nome: p.nome, papel: "convidado", eh_crianca: p.ehCrianca, group_id: null })),
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
  const texto = String(formData.get("texto") ?? "");
  const preview = previewPlanilha(texto);
  if (preview.totalGrupos === 0) return { ok: false, message: "Cole a planilha (nome e rótulo do convite por linha)." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { data, error } = await supabase.rpc("hg_import_convidados", { p_grupos: preview.grupos });
  if (error) return { ok: false, message: "Não foi possível importar. Verifique o login." };

  const r = (data ?? {}) as { grupos?: number; pessoas?: number; padrinhos?: number; duplicados?: number };
  await logAudit(supabase, { modulo: "convidados", acao: "import_planilha", valorNovo: r });
  revalidarConvidados();
  return {
    ok: true,
    message: `${r.pessoas ?? 0} pessoas em ${r.grupos ?? 0} grupos · ${r.padrinhos ?? 0} padrinhos · ${r.duplicados ?? 0} duplicados ignorados. ${preview.casaisSugeridos} casal(is) sugerido(s) em "A vincular".`,
  };
}
