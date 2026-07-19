"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";

export interface GiftFormState {
  ok: boolean;
  message: string;
}

/**
 * Presentes ficam SEPARADOS das finanças do casamento (regra da spec).
 * O preço é o valor de referência da cota; guardamos com 2 casas a partir
 * de centavos, evitando ambiguidade de float na entrada ("1.234,50").
 */
export async function criarPresente(_prev: GiftFormState, formData: FormData): Promise<GiftFormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const precoRaw = String(formData.get("preco") ?? "").trim();
  const imagem = String(formData.get("imagem_url") ?? "").trim();
  const permiteCota = formData.get("permite_cota") === "on";

  if (!nome) return { ok: false, message: "Informe o nome do presente." };

  let cents = 0;
  try {
    cents = precoRaw ? parseBRLToCents(precoRaw) : 0;
  } catch {
    return { ok: false, message: "Valor inválido." };
  }
  if (cents < 0) return { ok: false, message: "Valor inválido." };
  const preco = cents / 100;

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_gifts").insert({
    nome,
    descricao: descricao || null,
    imagem_url: imagem || null,
    preco,
    permite_cota: permiteCota,
    status: "disponivel",
  });

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique se você está autenticado." };

  await logAudit(supabase, { modulo: "presentes", acao: "create", valorNovo: { nome, preco } });
  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
  return { ok: true, message: `${nome} foi adicionado à lista.` };
}

/** Altera o status de um presente (disponivel / reservado / adquirido). */
export async function atualizarStatusPresente(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !["disponivel", "reservado", "adquirido"].includes(status)) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase.from("hg_gifts").update({ status }).eq("id", id).is("deleted_at", null);
  if (!error) {
    await logAudit(supabase, { modulo: "presentes", acao: "update", registro: `hg_gifts:${id}`, valorNovo: { status } });
    revalidatePath("/admin/presentes");
    revalidatePath("/presentes");
  }
}

/** Exclusão LÓGICA (soft-delete) de um presente. */
export async function excluirPresente(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_gifts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (!error) {
    await logAudit(supabase, { modulo: "presentes", acao: "delete", registro: `hg_gifts:${id}` });
    revalidatePath("/admin/presentes");
    revalidatePath("/presentes");
  }
}
