"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface ContratacaoState {
  ok: boolean;
  message: string;
}

/** Campos de texto simples do cadastro de contratação/faturamento. */
const CAMPOS = [
  "contratante_nome",
  "contratante_documento",
  "contratante_rg",
  "contratante_email",
  "contratante_telefone",
  "contratante2_nome",
  "contratante2_documento",
  "endereco",
  "cidade",
  "uf",
  "cep",
  "nf_destinatario",
  "nf_documento",
  "nf_ie",
  "nf_im",
  "nf_endereco",
  "nf_email",
  "nf_observacoes",
  "condicoes_gerais",
] as const;

/**
 * Salva os dados fixos usados em toda autorização de contratação:
 * quem contrata (os noivos) e para quem a nota fiscal deve ser emitida.
 */
export async function salvarDadosContratacao(
  _prev: ContratacaoState,
  formData: FormData,
): Promise<ContratacaoState> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const patch: Record<string, string | null> = {};
  for (const campo of CAMPOS) {
    const valor = String(formData.get(campo) ?? "").trim();
    patch[campo] = valor || null;
  }

  const { error } = await supabase
    .from("hg_contratacao_config")
    .upsert({ id: 1, ...patch, atualizado_em: new Date().toISOString() });

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "contratos", acao: "update", registro: "hg_contratacao_config:1" });
  revalidatePath("/admin/contratos");
  return { ok: true, message: "Dados de contratação salvos." };
}

/** Textos livres do modelo do documento. */
const MODELO_TEXTOS = [
  "cabecalho_titulo",
  "cabecalho_legenda",
  "titulo",
  "declaracao",
  "rodape",
  "assinatura_1",
  "assinatura_2",
  "rotulo_contratantes",
  "rotulo_contratado",
  "rotulo_objeto",
  "rotulo_pagamento",
  "rotulo_nota_fiscal",
  "rotulo_observacoes",
] as const;

/** Blocos que podem ser escondidos no documento. */
const MODELO_BLOCOS = [
  "mostrar_monograma",
  "mostrar_evento",
  "mostrar_objeto",
  "mostrar_nota_fiscal",
  "mostrar_declaracao",
  "mostrar_assinaturas",
  "mostrar_rodape",
] as const;

const CORES_VALIDAS = ["gold", "olive", "moss"];

/**
 * Salva o modelo do documento (textos, blocos visíveis e cor de destaque).
 * Campo deixado em branco volta a usar o texto padrão na hora de gerar.
 */
export async function salvarModeloDocumento(
  _prev: ContratacaoState,
  formData: FormData,
): Promise<ContratacaoState> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const patch: Record<string, string | boolean | null> = {};
  for (const campo of MODELO_TEXTOS) {
    const valor = String(formData.get(campo) ?? "").trim();
    patch[campo] = valor || null;
  }
  for (const bloco of MODELO_BLOCOS) {
    patch[bloco] = formData.get(bloco) === "on";
  }
  const cor = String(formData.get("cor_destaque") ?? "gold");
  patch.cor_destaque = CORES_VALIDAS.includes(cor) ? cor : "gold";

  const { error } = await supabase
    .from("hg_documento_modelo")
    .upsert({ id: 1, ...patch, atualizado_em: new Date().toISOString() });

  if (error) return { ok: false, message: "Não foi possível salvar o modelo." };

  await logAudit(supabase, { modulo: "contratos", acao: "update", registro: "hg_documento_modelo:1" });
  revalidatePath("/admin/contratos");
  return { ok: true, message: "Modelo do documento salvo." };
}

/** Volta o modelo inteiro ao padrão de fábrica. */
export async function restaurarModeloDocumento(): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const patch: Record<string, string | boolean | null> = { cor_destaque: "gold" };
  for (const campo of MODELO_TEXTOS) patch[campo] = null;
  for (const bloco of MODELO_BLOCOS) patch[bloco] = true;

  const { error } = await supabase
    .from("hg_documento_modelo")
    .upsert({ id: 1, ...patch, atualizado_em: new Date().toISOString() });
  if (error) return;

  await logAudit(supabase, { modulo: "contratos", acao: "update", registro: "hg_documento_modelo:1" });
  revalidatePath("/admin/contratos");
}

/** Salva o escopo (o que está incluso) de um contrato específico. */
export async function salvarEscopoContrato(
  _prev: ContratacaoState,
  formData: FormData,
): Promise<ContratacaoState> {
  const id = String(formData.get("id") ?? "").trim();
  const escopo = String(formData.get("escopo") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  if (!id) return { ok: false, message: "Contrato inválido." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_contracts")
    .update({ escopo: escopo || null, observacoes: observacoes || null })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  revalidatePath(`/admin/contratos/${id}/autorizacao`);
  revalidatePath("/admin/contratos");
  return { ok: true, message: "Escopo atualizado." };
}

/**
 * Numera e data a autorização de contratação (uma vez por contrato). A partir
 * daí o documento deixa de ser rascunho e vira a via oficial enviada ao
 * fornecedor. Reemitir não renumera — o número original é preservado.
 */
export async function emitirAutorizacao(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { data: atual } = await supabase
    .from("hg_contracts")
    .select("autorizacao_seq")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!atual) return;

  // Número já emitido antes é mantido; só a data de emissão é renovada.
  let seq = atual.autorizacao_seq as number | null;
  if (seq === null) {
    const { data: ultimo } = await supabase
      .from("hg_contracts")
      .select("autorizacao_seq")
      .not("autorizacao_seq", "is", null)
      .order("autorizacao_seq", { ascending: false })
      .limit(1)
      .maybeSingle();
    seq = ((ultimo?.autorizacao_seq as number | null) ?? 0) + 1;
  }

  const { error } = await supabase
    .from("hg_contracts")
    .update({ autorizacao_seq: seq, autorizacao_emitida_em: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return;

  await logAudit(supabase, {
    modulo: "contratos",
    acao: "update",
    registro: `hg_contracts:${id}`,
    valorNovo: { autorizacao_seq: seq },
  });
  revalidatePath(`/admin/contratos/${id}/autorizacao`);
  revalidatePath("/admin/contratos");
}
