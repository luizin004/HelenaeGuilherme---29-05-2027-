"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface ContentState {
  ok: boolean;
  message: string;
}

/** Edita o conteúdo do site (CMS) — história e hashtag do casal. */
export async function salvarConteudo(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const historia = String(formData.get("historia") ?? "").trim();
  const hashtag = String(formData.get("hashtag") ?? "").trim();

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_wedding_settings")
    .update({ historia: historia || null, hashtag: hashtag || null })
    .eq("id", 1);

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "cms", acao: "update", registro: "hg_wedding_settings:1" });
  revalidatePath("/");
  revalidatePath("/admin/conteudo");
  return { ok: true, message: "Conteúdo salvo. O site já reflete as mudanças." };
}

/**
 * Define o prazo de confirmação (RSVP). Enquanto `now() <= rsvp_prazo` o
 * formulário público aceita respostas; depois disso ele é bloqueado.
 * Permite a REABERTURA administrativa (spec regra do prazo): basta salvar
 * uma data futura. A justificativa fica registrada na auditoria.
 */
export async function salvarPrazoRsvp(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const prazoLocal = String(formData.get("rsvp_prazo") ?? "").trim(); // datetime-local: "2027-03-30T23:59"
  const justificativa = String(formData.get("justificativa") ?? "").trim();

  if (!prazoLocal) return { ok: false, message: "Informe a data e hora do prazo." };

  // datetime-local não traz fuso; fixamos o horário de Brasília (-03:00).
  const prazoISO = `${prazoLocal.length === 16 ? `${prazoLocal}:00` : prazoLocal}-03:00`;
  const parsed = new Date(prazoISO);
  if (Number.isNaN(parsed.getTime())) return { ok: false, message: "Data/hora inválida." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_wedding_settings")
    .update({ rsvp_prazo: prazoISO })
    .eq("id", 1);

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, {
    modulo: "rsvp",
    acao: "update_prazo",
    registro: "hg_wedding_settings:1",
    valorNovo: { rsvp_prazo: prazoISO, justificativa: justificativa || null },
  });
  revalidatePath("/admin/conteudo");
  return { ok: true, message: `Prazo salvo para ${parsed.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.` };
}
