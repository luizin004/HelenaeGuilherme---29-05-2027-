"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";

export interface CentroState {
  ok: boolean;
  message: string;
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "centro";
}

function lerOrcamento(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  return parseBRLToCents(v); // pode lançar
}

/** Cria um centro de custo. */
export async function criarCentroCusto(_prev: CentroState, formData: FormData): Promise<CentroState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const cor = String(formData.get("cor") ?? "").trim();
  if (!nome) return { ok: false, message: "Informe o nome do centro." };

  let orcamento: number | null = null;
  try {
    orcamento = lerOrcamento(String(formData.get("orcamento") ?? ""));
  } catch {
    return { ok: false, message: "Orçamento inválido." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { data: max } = await supabase.from("hg_cost_centers").select("ordem").order("ordem", { ascending: false }).limit(1).maybeSingle();
  const ordem = (max?.ordem ?? 0) + 1;

  const { error } = await supabase.from("hg_cost_centers").insert({
    chave: slug(nome),
    nome,
    ordem,
    cor: cor || null,
    orcamento_cents: orcamento,
    ativo: true,
  });
  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "financeiro", acao: "create", valorNovo: { centro: nome } });
  revalidatePath("/admin/centros-custo");
  return { ok: true, message: `Centro "${nome}" criado.` };
}

/** Edita um centro de custo (nome, cor, orçamento). */
export async function atualizarCentroCusto(_prev: CentroState, formData: FormData): Promise<CentroState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const cor = String(formData.get("cor") ?? "").trim();
  if (!id) return { ok: false, message: "Centro inválido." };
  if (!nome) return { ok: false, message: "Informe o nome." };

  let orcamento: number | null = null;
  try {
    orcamento = lerOrcamento(String(formData.get("orcamento") ?? ""));
  } catch {
    return { ok: false, message: "Orçamento inválido." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_cost_centers")
    .update({ nome, cor: cor || null, orcamento_cents: orcamento })
    .eq("id", id);
  if (error) return { ok: false, message: "Não foi possível salvar." };

  await logAudit(supabase, { modulo: "financeiro", acao: "update", registro: `hg_cost_centers:${id}`, valorNovo: { nome } });
  revalidatePath("/admin/centros-custo");
  return { ok: true, message: `${nome} atualizado.` };
}

/** Ativa/inativa um centro de custo (não excluímos: pode ter lançamentos). */
export async function alternarCentroCusto(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const ativo = String(formData.get("ativo") ?? "") === "true";
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase.from("hg_cost_centers").update({ ativo }).eq("id", id);
  if (!error) {
    await logAudit(supabase, { modulo: "financeiro", acao: "update", registro: `hg_cost_centers:${id}`, valorNovo: { ativo } });
    revalidatePath("/admin/centros-custo");
  }
}
