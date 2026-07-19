"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";

export interface ClassFormState {
  ok: boolean;
  message: string;
}

/** Telas que exibem classificações (§25). */
function revalidar() {
  for (const t of [
    "/admin/classificacoes",
    "/admin/financeiro",
    "/admin/contas",
    "/admin/financeiro-dashboard",
    "/admin/relatorios",
    "/admin/orcamento",
    "/admin/cotacoes",
  ])
    revalidatePath(t);
}

/** Cria uma classificação financeira (principal ou subclassificação). */
export async function criarClassificacao(_prev: ClassFormState, formData: FormData): Promise<ClassFormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;
  const cor = String(formData.get("cor") ?? "").trim() || null;
  const orcamentoStr = String(formData.get("orcamento") ?? "").trim();

  if (!nome) return { ok: false, message: "Informe o nome da classificação." };

  let orcamentoCents: number | null = null;
  if (orcamentoStr) {
    try {
      orcamentoCents = parseBRLToCents(orcamentoStr);
    } catch {
      return { ok: false, message: "Orçamento inválido. Use R$ 0,00." };
    }
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_financial_classifications").insert({
    nome,
    descricao,
    parent_id: parentId,
    cor,
    orcamento_cents: orcamentoCents,
  });
  if (error) {
    return error.code === "23505"
      ? { ok: false, message: "Já existe uma classificação com esse nome nesse nível." }
      : { ok: false, message: "Não foi possível salvar." };
  }

  await logAudit(supabase, { modulo: "financeiro", acao: "create", registro: "hg_financial_classifications", valorNovo: { nome } });
  revalidar();
  return { ok: true, message: "Classificação criada." };
}

/** Edita nome/descrição/cor/orçamento/pai. */
export async function atualizarClassificacao(_prev: ClassFormState, formData: FormData): Promise<ClassFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  if (!id || !nome) return { ok: false, message: "Dados inválidos." };

  const patch: Record<string, unknown> = {
    nome,
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    cor: String(formData.get("cor") ?? "").trim() || null,
  };
  const parentId = String(formData.get("parent_id") ?? "").trim();
  if (parentId !== id) patch.parent_id = parentId || null; // nunca vira pai de si mesma

  const orcamentoStr = String(formData.get("orcamento") ?? "").trim();
  if (orcamentoStr) {
    try {
      patch.orcamento_cents = parseBRLToCents(orcamentoStr);
    } catch {
      return { ok: false, message: "Orçamento inválido." };
    }
  } else {
    patch.orcamento_cents = null;
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };
  const { error } = await supabase.from("hg_financial_classifications").update(patch).eq("id", id);
  if (error) return { ok: false, message: "Não foi possível salvar." };

  await logAudit(supabase, { modulo: "financeiro", acao: "update", registro: `hg_financial_classifications:${id}` });
  revalidar();
  return { ok: true, message: "Classificação atualizada." };
}

/** Ativa/inativa (nunca exclui — preserva histórico e vínculos). */
export async function alternarClassificacao(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const ativo = String(formData.get("ativo") ?? "") === "true";
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_financial_classifications").update({ ativo: !ativo }).eq("id", id);
  await logAudit(supabase, { modulo: "financeiro", acao: "update", registro: `hg_financial_classifications:${id}`, valorNovo: { ativo: !ativo } });
  revalidar();
}

