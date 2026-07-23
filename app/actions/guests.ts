"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { ehPadrinho, PAPEIS } from "@/domain/convites/caixas";

export interface GuestFormState {
  ok: boolean;
  message: string;
}

const PAPEL_VALIDO = new Set(PAPEIS.map((p) => p.value as string));
type DB = NonNullable<ReturnType<typeof createClient>>;

/**
 * Mantém a LISTA DE PADRINHOS derivada do papel do convidado (FASE 3):
 *  • virou padrinho/madrinha → cria/reativa o registro em hg_wedding_party (por guest_id);
 *  • deixou de ser → soft-delete do registro. Sem lista duplicada e desconectada.
 */
async function sincronizarPapelPadrinho(
  supabase: DB,
  g: { guestId: string; nome: string; papel: string; telefone: string | null; lado: string | null },
) {
  const { data: existente } = await supabase
    .from("hg_wedding_party")
    .select("id, deleted_at")
    .eq("guest_id", g.guestId)
    .maybeSingle();

  if (ehPadrinho(g.papel)) {
    const lado = g.lado === "helena" || g.lado === "guilherme" || g.lado === "ambos" ? g.lado : null;
    if (existente) {
      await supabase
        .from("hg_wedding_party")
        .update({ nome: g.nome, papel: g.papel, telefone: g.telefone, lado, deleted_at: null })
        .eq("id", existente.id);
    } else {
      await supabase.from("hg_wedding_party").insert({
        guest_id: g.guestId,
        nome: g.nome,
        papel: g.papel,
        telefone: g.telefone,
        lado,
      });
    }
  } else if (existente && !existente.deleted_at) {
    // Deixou de ser padrinho: sai da lista (soft-delete). O par é recalculado sozinho.
    await supabase
      .from("hg_wedding_party")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", existente.id);
  }
  revalidatePath("/admin/padrinhos");
  revalidatePath("/admin/padrinhos/duplas");
}

/** Cadastra um convidado (painel, autenticado). Gera qr_token automaticamente no banco. */
export async function criarConvidado(_prev: GuestFormState, formData: FormData): Promise<GuestFormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const papel = String(formData.get("papel") ?? "convidado").trim();
  const ehCrianca = formData.get("eh_crianca") === "on";

  if (!nome) return { ok: false, message: "Informe o nome do convidado." };
  const papelFinal = PAPEL_VALIDO.has(papel) ? papel : "convidado";

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { data: novo, error } = await supabase
    .from("hg_guests")
    .insert({
      nome,
      email: email || null,
      telefone: telefone || null,
      papel: papelFinal,
      eh_crianca: ehCrianca,
    })
    .select("id")
    .single();

  if (error || !novo) {
    return { ok: false, message: "Não foi possível salvar. Verifique se você está autenticado." };
  }

  await sincronizarPapelPadrinho(supabase, { guestId: novo.id, nome, papel: papelFinal, telefone: telefone || null, lado: null });

  await logAudit(supabase, { modulo: "convidados", acao: "create", valorNovo: { nome, papel: papelFinal, ehCrianca } });
  revalidatePath("/admin/convidados");
  const extra = ehPadrinho(papelFinal) ? " Entrou na lista de padrinhos." : "";
  return { ok: true, message: `${nome.split(" ")[0]} foi adicionado à lista.${extra}` };
}

/** Edita um convidado (nome, contato, criança, mesa). */
export async function atualizarConvidado(_prev: GuestFormState, formData: FormData): Promise<GuestFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const mesa = String(formData.get("mesa") ?? "").trim();
  const grupo = String(formData.get("group_id") ?? "").trim();
  const ehCrianca = formData.get("eh_crianca") === "on";
  const temPapel = formData.has("papel");
  const papel = String(formData.get("papel") ?? "convidado").trim();

  if (!id) return { ok: false, message: "Convidado inválido." };
  if (!nome) return { ok: false, message: "Informe o nome do convidado." };
  const papelFinal = PAPEL_VALIDO.has(papel) ? papel : "convidado";

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const patch: Record<string, unknown> = {
    nome,
    email: email || null,
    telefone: telefone || null,
    mesa: mesa || null,
    group_id: grupo || null,
    eh_crianca: ehCrianca,
  };
  if (temPapel) patch.papel = papelFinal;

  const { error } = await supabase.from("hg_guests").update(patch).eq("id", id).is("deleted_at", null);

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique se você está autenticado." };

  if (temPapel) {
    await sincronizarPapelPadrinho(supabase, { guestId: id, nome, papel: papelFinal, telefone: telefone || null, lado: null });
  }

  await logAudit(supabase, {
    modulo: "convidados",
    acao: "update",
    registro: `hg_guests:${id}`,
    valorNovo: { nome, mesa: mesa || null, papel: temPapel ? papelFinal : undefined, ehCrianca },
  });
  revalidatePath("/admin/convidados");
  return { ok: true, message: `${nome.split(" ")[0]} atualizado.` };
}

/** Regenera o QR (novo token) — invalida o anterior. Ex.: convite perdido. */
export async function regenerarQr(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("hg_guests")
    .update({ qr_token: crypto.randomUUID(), check_in_em: null, check_in_por: null })
    .eq("id", id)
    .is("deleted_at", null);
  if (!error) {
    await logAudit(supabase, { modulo: "convidados", acao: "regenerar_qr", registro: `hg_guests:${id}` });
    revalidatePath("/admin/convidados");
  }
}

/** Exclusão LÓGICA (soft-delete) de um convidado. */
export async function excluirConvidado(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_guests")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (!error) {
    await logAudit(supabase, { modulo: "convidados", acao: "delete", registro: `hg_guests:${id}` });
    revalidatePath("/admin/convidados");
  }
}
