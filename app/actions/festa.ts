"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { BUCKET_FESTA } from "@/lib/festa-data";
import { caminhoAprovado, comunicadoNossaFesta, linkDaAba, normalizarWhatsapp } from "@/domain/festa/album";

export interface FestaState {
  ok: boolean;
  message: string;
}

/** Endereço público do site — usado no link do comunicado. */
function baseDoSite(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Aprova a foto e a MOVE para o prefixo `aprovadas/` — único lugar do bucket
 * com leitura liberada. Aprovar é literalmente o que publica o arquivo.
 */
export async function aprovarFotoFesta(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  if (!id || !path) return;

  const supabase = createClient();
  if (!supabase) return;

  let destino = path;
  if (path.startsWith("pendentes/")) {
    destino = caminhoAprovado(path);
    const { error } = await supabase.storage.from(BUCKET_FESTA).move(path, destino);
    // Se o arquivo já tinha sido movido antes, seguimos; qualquer outra falha aborta.
    if (error && !/exists|not found/i.test(error.message)) return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("hg_festa_fotos")
    .update({
      status: "aprovada",
      arquivo_path: destino,
      moderado_em: new Date().toISOString(),
      moderado_por: user?.id ?? null,
    })
    .eq("id", id);
  if (error) return;

  await logAudit(supabase, { modulo: "nossa-festa", acao: "approve", registro: `hg_festa_fotos:${id}` });
  revalidatePath("/admin/nossa-festa");
  revalidatePath("/nossa-festa");
}

/** Recusa a foto: some da galeria e volta para a área privada. */
export async function recusarFotoFesta(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  let destino = path;
  if (path.startsWith("aprovadas/")) {
    destino = `pendentes/${path.slice("aprovadas/".length)}`;
    const { error } = await supabase.storage.from(BUCKET_FESTA).move(path, destino);
    if (error && !/exists|not found/i.test(error.message)) return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("hg_festa_fotos")
    .update({
      status: "recusada",
      arquivo_path: destino,
      destaque: false,
      moderado_em: new Date().toISOString(),
      moderado_por: user?.id ?? null,
    })
    .eq("id", id);
  if (error) return;

  await logAudit(supabase, { modulo: "nossa-festa", acao: "reject", registro: `hg_festa_fotos:${id}` });
  revalidatePath("/admin/nossa-festa");
  revalidatePath("/nossa-festa");
}

/** Destaca uma foto — sobe para o começo da galeria. */
export async function alternarDestaqueFoto(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const destaque = String(formData.get("destaque") ?? "") === "true";
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase.from("hg_festa_fotos").update({ destaque }).eq("id", id);
  if (error) return;
  revalidatePath("/admin/nossa-festa");
  revalidatePath("/nossa-festa");
}

/** Exclusão lógica + remoção do arquivo. */
export async function excluirFotoFesta(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_festa_fotos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return;

  if (path) await supabase.storage.from(BUCKET_FESTA).remove([path]);
  await logAudit(supabase, { modulo: "nossa-festa", acao: "delete", registro: `hg_festa_fotos:${id}` });
  revalidatePath("/admin/nossa-festa");
  revalidatePath("/nossa-festa");
}

/** Aprova de uma vez tudo que está esperando. */
export async function aprovarTodasPendentes(): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const { data } = await supabase
    .from("hg_festa_fotos")
    .select("id, arquivo_path")
    .eq("status", "pendente")
    .is("deleted_at", null);

  for (const f of (data ?? []) as { id: string; arquivo_path: string }[]) {
    const fd = new FormData();
    fd.set("id", f.id);
    fd.set("path", f.arquivo_path);
    await aprovarFotoFesta(fd);
  }
}

/** Configuração da aba: WhatsApp, textos e se ainda aceita envio. */
export async function salvarConfigFesta(_prev: FestaState, formData: FormData): Promise<FestaState> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const bruto = String(formData.get("whatsapp_numero") ?? "").trim();
  const numero = normalizarWhatsapp(bruto);
  if (bruto && !numero) {
    return { ok: false, message: "Número de WhatsApp inválido. Use DDI + DDD + número (ex.: 5531999999999)." };
  }

  const { error } = await supabase
    .from("hg_festa_config")
    .update({
      aberto: formData.get("aberto") === "on",
      whatsapp_numero: numero || null,
      whatsapp_mensagem: String(formData.get("whatsapp_mensagem") ?? "").trim() || null,
      chamada: String(formData.get("chamada") ?? "").trim() || null,
      agradecimento: String(formData.get("agradecimento") ?? "").trim() || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { ok: false, message: "Não foi possível salvar." };

  await logAudit(supabase, { modulo: "nossa-festa", acao: "update", registro: "hg_festa_config:1" });
  revalidatePath("/admin/nossa-festa");
  revalidatePath("/nossa-festa");
  return { ok: true, message: "Configuração salva." };
}

/**
 * Cria na Evania o comunicado que leva os convidados até a aba — como
 * RASCUNHO. O disparo continua passando pelo fluxo normal de aprovação da
 * Comunicação; nada sai daqui direto para o convidado.
 */
export async function criarComunicadoNossaFesta(_prev: FestaState, formData: FormData): Promise<FestaState> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const corpo = String(formData.get("corpo_modelo") ?? "").trim() || comunicadoNossaFesta(linkDaAba(baseDoSite()));
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("hg_comm_campaigns")
    .insert({
      nome: "Nossa Festa — mande suas fotos",
      canal: "whatsapp",
      aprovacao_tipo: "dois_noivos",
      publico_filtros: { status: "confirmado" },
      corpo_modelo: corpo,
      status: "rascunho",
      criado_por: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: "Não foi possível criar o comunicado." };

  await logAudit(supabase, {
    modulo: "nossa-festa",
    acao: "create",
    registro: `hg_comm_campaigns:${data.id}`,
    valorNovo: { nome: "Nossa Festa — mande suas fotos" },
  });
  revalidatePath("/admin/comunicacao/campanhas");
  revalidatePath("/admin/nossa-festa");
  return {
    ok: true,
    message: "Comunicado criado como rascunho na Evania. Revise a audiência e envie para aprovação.",
  };
}
