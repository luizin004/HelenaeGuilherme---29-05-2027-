"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface LeadState {
  ok: boolean;
  message: string;
}

/** Registra um contato comercial do site do Rancho (público — anon pode inserir). */
export async function enviarLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const tipoEvento = String(formData.get("tipo_evento") ?? "").trim();
  const dataPrevista = String(formData.get("data_prevista") ?? "").trim();
  const convidados = String(formData.get("convidados_aprox") ?? "").trim();
  const desejaVisita = formData.get("deseja_visita") === "on";
  const mensagem = String(formData.get("mensagem") ?? "").trim();

  if (!nome) return { ok: false, message: "Informe seu nome." };
  if (!telefone && !email) return { ok: false, message: "Informe um telefone ou e-mail para contato." };

  const supabase = createClient();
  if (!supabase) {
    // Sem backend: o formulário orienta a seguir pelo WhatsApp (fallback no cliente).
    return { ok: true, message: "Recebido! Fale com a gente também pelo WhatsApp para agilizar." };
  }

  const { error } = await supabase.from("hg_leads").insert({
    nome,
    telefone: telefone || null,
    email: email || null,
    tipo_evento: tipoEvento || null,
    data_prevista: dataPrevista || null,
    convidados_aprox: convidados || null,
    deseja_visita: desejaVisita,
    mensagem: mensagem || null,
    origem: "site_rancho",
  });

  if (error) return { ok: false, message: "Não foi possível enviar agora. Tente pelo WhatsApp, por favor." };

  revalidatePath("/admin/leads");
  return { ok: true, message: "Contato enviado! Em breve retornaremos. Se preferir, fale pelo WhatsApp agora." };
}

const STATUS = ["novo", "em_contato", "visita_agendada", "ganho", "perdido"];

/** Atualiza o status de um lead (painel). */
export async function atualizarStatusLead(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !STATUS.includes(status)) return;
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase.from("hg_leads").update({ status }).eq("id", id).is("deleted_at", null);
  if (!error) revalidatePath("/admin/leads");
}

/** Exclusão LÓGICA de um lead. */
export async function excluirLead(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase.from("hg_leads").update({ deleted_at: new Date().toISOString() }).eq("id", id).is("deleted_at", null);
  if (!error) revalidatePath("/admin/leads");
}
