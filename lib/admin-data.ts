import { createClient } from "@/lib/supabase/server";
import type { Guest } from "@/lib/database.types";

export interface ExpenseRow {
  id: string;
  descricao: string;
  estado: string;
  gratuito: boolean;
  valor_total_cents: number | null;
  observacao: string | null;
  cost_center_id: string | null;
}

export interface Option {
  id: string;
  nome: string;
}

export async function getCostCenters(): Promise<Option[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_cost_centers").select("*").order("ordem");
  return (data ?? []) as Option[];
}

export async function getPayers(): Promise<Option[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_payers").select("*").order("nome");
  return (data ?? []) as Option[];
}

/** Mapa expense_id -> payer_id (responsável único, quando houver). */
export async function getExpensePayers(): Promise<Record<string, string>> {
  const supabase = createClient();
  if (!supabase) return {};
  const { data } = await supabase.from("hg_expense_payer_splits").select("*");
  const map: Record<string, string> = {};
  for (const s of (data ?? []) as { expense_id: string; payer_id: string }[]) {
    map[s.expense_id] = s.payer_id;
  }
  return map;
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

export interface AggRow {
  nome: string;
  totalCents: number;
}

/** Desembolso por responsável (soma dos splits). */
export async function getFinanceByResponsible(): Promise<AggRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const [{ data: splits }, { data: payers }] = await Promise.all([
    supabase.from("hg_expense_payer_splits").select("*"),
    supabase.from("hg_payers").select("*"),
  ]);
  const nome = new Map((payers ?? []).map((p: { id: string; nome: string }) => [p.id, p.nome]));
  const agg = new Map<string, number>();
  for (const s of (splits ?? []) as { payer_id: string; valor_cents: number }[]) {
    agg.set(s.payer_id, (agg.get(s.payer_id) ?? 0) + Number(s.valor_cents));
  }
  return [...agg.entries()]
    .map(([id, totalCents]) => ({ nome: nome.get(id) ?? "?", totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

/** Orçado por centro de custo (despesas não gratuitas com valor). */
export async function getFinanceByCostCenter(): Promise<AggRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const [{ data: expenses }, { data: centers }] = await Promise.all([
    supabase.from("hg_expenses").select("*").is("deleted_at", null),
    supabase.from("hg_cost_centers").select("*"),
  ]);
  const nome = new Map((centers ?? []).map((c: { id: string; nome: string }) => [c.id, c.nome]));
  const agg = new Map<string, number>();
  for (const e of (expenses ?? []) as { cost_center_id: string | null; valor_total_cents: number | null; gratuito: boolean }[]) {
    if (e.gratuito || e.valor_total_cents === null) continue;
    const key = e.cost_center_id ?? "sem";
    agg.set(key, (agg.get(key) ?? 0) + Number(e.valor_total_cents));
  }
  return [...agg.entries()]
    .map(([id, totalCents]) => ({ nome: id === "sem" ? "Não classificado" : nome.get(id) ?? "?", totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
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

export interface ContractRow {
  id: string;
  titulo: string;
  supplier_id: string | null;
  valor: number;
  data_evento: string | null;
  status: string;
}

export async function listContracts(): Promise<ContractRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_contracts")
    .select("*")
    .is("deleted_at", null)
    .order("criado_em");
  return (data ?? []) as ContractRow[];
}

export interface AuditRow {
  id: string;
  modulo: string;
  acao: string;
  registro: string | null;
  criado_em: string;
}

export async function listAuditLog(): Promise<AuditRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_audit_log")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(100);
  return (data ?? []) as AuditRow[];
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
