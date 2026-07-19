import { createClient } from "@/lib/supabase/server";
import type { Guest } from "@/lib/database.types";

export interface GuestStats {
  total: number;
  confirmados: number;
  pendentes: number;
  recusados: number;
  criancas: number;
}

export async function getGuestStats(): Promise<GuestStats> {
  const supabase = createClient();
  const empty = { total: 0, confirmados: 0, pendentes: 0, recusados: 0, criancas: 0 };
  if (!supabase) return empty;

  const { data } = await supabase.from("guests").select("*");
  if (!data) return empty;

  return data.reduce<GuestStats>((acc, g) => {
    acc.total += 1;
    if (g.status === "confirmado") acc.confirmados += 1;
    if (g.status === "pendente") acc.pendentes += 1;
    if (g.status === "recusado") acc.recusados += 1;
    if (g.eh_crianca) acc.criancas += 1;
    return acc;
  }, { ...empty });
}

export async function listGuests(): Promise<Guest[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("guests").select("*").order("criado_em", { ascending: false });
  return data ?? [];
}

export interface GiftTotals {
  recebido: number;
  contribuicoes: number;
}

export async function getGiftTotals(): Promise<GiftTotals> {
  const supabase = createClient();
  if (!supabase) return { recebido: 0, contribuicoes: 0 };
  const { data } = await supabase
    .from("payments")
    .select("*")
    .in("status", ["confirmado", "recebido"]);
  if (!data) return { recebido: 0, contribuicoes: 0 };
  return {
    recebido: data.reduce((s, p) => s + Number(p.valor ?? 0), 0),
    contribuicoes: data.length,
  };
}
