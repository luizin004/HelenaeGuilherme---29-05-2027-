import { createClient } from "@/lib/supabase/server";
import type { Guest } from "@/lib/database.types";

export interface ExpenseRow {
  id: string;
  descricao: string;
  estado: string;
  gratuito: boolean;
  valor_total_cents: number | null;
  observacao: string | null;
}

export interface ExpensesSummary {
  itens: number;
  comValor: number;
  gratuitos: number;
  semValor: number;
  totalOrcadoCents: number;
  pagoCents: number;
}

export async function listExpenses(): Promise<ExpenseRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_expenses")
    .select("*")
    .is("deleted_at", null)
    .order("criado_em");
  return ((data ?? []) as ExpenseRow[]).map((e) => ({
    ...e,
    valor_total_cents: e.valor_total_cents === null ? null : Number(e.valor_total_cents),
  }));
}

export async function getExpensesSummary(): Promise<ExpensesSummary> {
  const rows = await listExpenses();
  const supabase = createClient();
  let pagoCents = 0;
  if (supabase) {
    const { data } = await supabase.from("hg_expense_installments").select("*");
    pagoCents = (data ?? [])
      .filter((i: { pago: boolean }) => i.pago)
      .reduce((s: number, i: { valor_cents: number }) => s + Number(i.valor_cents), 0);
  }
  return {
    itens: rows.length,
    comValor: rows.filter((e) => e.valor_total_cents !== null).length,
    gratuitos: rows.filter((e) => e.gratuito).length,
    semValor: rows.filter((e) => e.valor_total_cents === null && !e.gratuito).length,
    totalOrcadoCents: rows
      .filter((e) => !e.gratuito)
      .reduce((s, e) => s + (e.valor_total_cents ?? 0), 0),
    pagoCents,
  };
}

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

  const { data } = await supabase.from("hg_guests").select("*");
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

export interface SupplierRow {
  id: string;
  nome: string;
  categoria: string | null;
  contato_nome: string | null;
  telefone: string | null;
  email: string | null;
  status: string;
  observacoes: string | null;
}

export async function listSuppliers(): Promise<SupplierRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_suppliers")
    .select("*")
    .is("deleted_at", null)
    .order("nome");
  return (data ?? []) as SupplierRow[];
}

export async function listGuests(): Promise<Guest[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_guests").select("*").order("criado_em", { ascending: false });
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
    .from("hg_payments")
    .select("*")
    .in("status", ["confirmado", "recebido"]);
  if (!data) return { recebido: 0, contribuicoes: 0 };
  return {
    recebido: data.reduce((s, p) => s + Number(p.valor ?? 0), 0),
    contribuicoes: data.length,
  };
}
