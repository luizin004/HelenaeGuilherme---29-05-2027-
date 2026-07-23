"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { parseBRLToCents } from "@/domain/money";
import { parseGiftsCSV } from "@/domain/gifts/csv";

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

/** Edita um presente (nome, descrição, valor, imagem, cota). */
export async function atualizarPresente(_prev: GiftFormState, formData: FormData): Promise<GiftFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const precoRaw = String(formData.get("preco") ?? "").trim();
  const imagem = String(formData.get("imagem_url") ?? "").trim();
  const permiteCota = formData.get("permite_cota") === "on";

  if (!id) return { ok: false, message: "Presente inválido." };
  if (!nome) return { ok: false, message: "Informe o nome do presente." };

  let cents = 0;
  try {
    cents = precoRaw ? parseBRLToCents(precoRaw) : 0;
  } catch {
    return { ok: false, message: "Valor inválido." };
  }
  if (cents < 0) return { ok: false, message: "Valor inválido." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_gifts")
    .update({
      nome,
      descricao: descricao || null,
      imagem_url: imagem || null,
      preco: cents / 100,
      permite_cota: permiteCota,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "presentes", acao: "update", registro: `hg_gifts:${id}`, valorNovo: { nome, preco: cents / 100 } });
  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
  return { ok: true, message: `${nome} atualizado.` };
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

/**
 * Importa uma planilha (CSV) de presentes — ADICIONA novos itens à lista.
 * Colunas: nome; descricao; valor; imagem_url; permite_cota. Nunca inventa preço
 * (valor vazio ou inválido entra como 0). Linhas sem nome são ignoradas.
 */
export async function importarPresentes(_prev: GiftFormState, formData: FormData): Promise<GiftFormState> {
  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Selecione um arquivo .csv." };
  if (file.size > 2_000_000) return { ok: false, message: "Arquivo muito grande (máx. 2 MB)." };

  const text = await file.text();
  const { rows, erros } = parseGiftsCSV(text);
  if (rows.length === 0) return { ok: false, message: erros[0] ?? "Nenhuma linha válida encontrada." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const payload = rows.map((r) => ({
    nome: r.nome,
    descricao: r.descricao,
    imagem_url: r.imagem_url,
    preco: r.precoCents / 100,
    permite_cota: r.permite_cota,
    status: "disponivel",
  }));

  const { error } = await supabase.from("hg_gifts").insert(payload);
  if (error) return { ok: false, message: "Não foi possível importar. Verifique se você está autenticado." };

  await logAudit(supabase, { modulo: "presentes", acao: "import", valorNovo: { quantidade: rows.length } });
  revalidatePath("/admin/presentes");
  revalidatePath("/presentes");
  const aviso = erros.length > 0 ? ` ${erros.length} aviso(s): ${erros.slice(0, 3).join(" ")}` : "";
  return { ok: true, message: `${rows.length} presente(s) importado(s).${aviso}` };
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
