"use server";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface CheckinEntry {
  token: string;
  nome: string;
  chegou: boolean;
}

/** Lista para o modo recepção (offline-first). Só autenticado (RLS). */
export async function getCheckinList(): Promise<CheckinEntry[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_guests").select("*").is("deleted_at", null);
  return ((data ?? []) as { qr_token: string; nome: string; check_in_em: string | null }[]).map((g) => ({
    token: g.qr_token,
    nome: g.nome,
    chegou: Boolean(g.check_in_em),
  }));
}

export interface CheckinResult {
  ok: boolean;
  message: string;
  nome?: string;
}

/** Valida o token do QR e registra a chegada do convidado. */
export async function registrarCheckin(token: string): Promise<CheckinResult> {
  const t = token.trim();
  if (!t) return { ok: false, message: "Informe ou leia um código." };

  const supabase = createClient();
  if (!supabase) {
    return { ok: true, message: "✓ Check-in registrado (modo demonstração).", nome: "Convidado" };
  }

  const { data: guest } = await supabase
    .from("hg_guests")
    .select("*")
    .eq("qr_token", t)
    .maybeSingle();

  if (!guest) return { ok: false, message: "Código não encontrado." };
  if (guest.check_in_em) {
    return { ok: false, message: `${guest.nome} já fez check-in.`, nome: guest.nome };
  }

  const agora = new Date().toISOString();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("hg_guests")
    .update({ check_in_em: agora, check_in_por: user?.id ?? null })
    .eq("id", guest.id);
  await supabase
    .from("hg_checkins")
    .insert({ guest_id: guest.id, check_in_em: agora, registrado_por: user?.id ?? null });
  await logAudit(supabase, {
    modulo: "checkin",
    acao: "checkin",
    registro: `hg_guests:${guest.id}`,
    valorNovo: { nome: guest.nome, check_in_em: agora },
  });

  return { ok: true, message: `✓ Bem-vindo(a), ${guest.nome}!`, nome: guest.nome };
}
