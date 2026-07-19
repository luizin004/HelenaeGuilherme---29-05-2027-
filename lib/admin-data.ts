import { createClient } from "@/lib/supabase/server";
import type { Guest } from "@/lib/database.types";

export interface ExpenseRow {
  id: string;
  descricao: string;
  estado: string;
  gratuito: boolean;
  valor_total_cents: number | null;
  observacao: string | null;
  categoria: string | null;
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

export interface ParcelaDetalhe {
  id: string;
  expense_id: string;
  descricao: string;
  categoria: string | null;
  responsavel: string;
  valor_cents: number;
  vencimento: string | null;
  pago: boolean;
  pago_em: string | null;
  is_entrada: boolean;
}

/** Todas as parcelas com o item, categoria e responsável — base de Contas a
 *  Pagar / Pagas, Calendário e Relatórios. */
export async function listParcelasDetalhado(): Promise<ParcelaDetalhe[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data: expenses } = await supabase
    .from("hg_expenses")
    .select("id, descricao, categoria")
    .is("deleted_at", null);
  if (!expenses || expenses.length === 0) return [];
  const meta = new Map(expenses.map((e) => [e.id, { descricao: e.descricao, categoria: e.categoria as string | null }]));
  const ids = expenses.map((e) => e.id);

  const [{ data: inst }, expensePayers, payers] = await Promise.all([
    supabase
      .from("hg_expense_installments")
      .select("id, expense_id, valor_cents, vencimento, pago, pago_em, is_entrada")
      .in("expense_id", ids),
    getExpensePayers(),
    getPayers(),
  ]);
  const payerNome = new Map(payers.map((p) => [p.id, p.nome]));

  return (inst ?? []).map((p) => {
    const m = meta.get(p.expense_id);
    const pid = expensePayers[p.expense_id];
    return {
      id: p.id,
      expense_id: p.expense_id,
      descricao: m?.descricao ?? "—",
      categoria: m?.categoria ?? null,
      responsavel: (pid && payerNome.get(pid)) || "Não atribuído",
      valor_cents: Number(p.valor_cents),
      vencimento: p.vencimento,
      pago: p.pago,
      pago_em: p.pago_em,
      is_entrada: p.is_entrada ?? false,
    };
  });
}

export interface ProjecaoMes {
  ym: string; // "2026-07"
  label: string; // "jul/2026"
  previstoCents: number;
  pagoCents: number;
  abertoCents: number;
  porResp: Record<string, number>;
}

export interface ProjecaoResult {
  meses: ProjecaoMes[];
  semData: { previstoCents: number; pagoCents: number; abertoCents: number; porResp: Record<string, number> };
  responsaveis: string[];
  totalPrevistoCents: number;
  totalPagoCents: number;
}

const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/**
 * Projeção mês a mês: distribui as PARCELAS pelos meses de vencimento e mostra
 * previsto, pago e em aberto — no total e por responsável (Helena, Guilherme,
 * Toninho). Parcela sem data cai no bloco "sem data" (regra 5: não é vencida).
 */
export async function getProjecaoMensal(): Promise<ProjecaoResult> {
  const vazio: ProjecaoResult = {
    meses: [],
    semData: { previstoCents: 0, pagoCents: 0, abertoCents: 0, porResp: {} },
    responsaveis: [],
    totalPrevistoCents: 0,
    totalPagoCents: 0,
  };
  const supabase = createClient();
  if (!supabase) return vazio;

  const { data: expenses } = await supabase.from("hg_expenses").select("id").is("deleted_at", null);
  const ids = (expenses ?? []).map((e) => e.id);
  if (ids.length === 0) return vazio;

  const [{ data: inst }, expensePayers, payers] = await Promise.all([
    supabase
      .from("hg_expense_installments")
      .select("expense_id, valor_cents, vencimento, pago")
      .in("expense_id", ids),
    getExpensePayers(),
    getPayers(),
  ]);
  const payerNome = new Map(payers.map((p) => [p.id, p.nome]));
  const respDe = (expenseId: string) => {
    const pid = expensePayers[expenseId];
    return (pid && payerNome.get(pid)) || "Não atribuído";
  };

  const buckets = new Map<string, ProjecaoMes>();
  const semData = { previstoCents: 0, pagoCents: 0, abertoCents: 0, porResp: {} as Record<string, number> };
  const respSet = new Set<string>();

  const add = (alvo: { previstoCents: number; pagoCents: number; abertoCents: number; porResp: Record<string, number> }, valor: number, pago: boolean, resp: string) => {
    alvo.previstoCents += valor;
    if (pago) alvo.pagoCents += valor;
    else alvo.abertoCents += valor;
    alvo.porResp[resp] = (alvo.porResp[resp] ?? 0) + valor;
  };

  for (const p of inst ?? []) {
    const valor = Number(p.valor_cents);
    const resp = respDe(p.expense_id);
    respSet.add(resp);
    if (!p.vencimento) {
      add(semData, valor, p.pago, resp);
      continue;
    }
    const ym = String(p.vencimento).slice(0, 7);
    let mes = buckets.get(ym);
    if (!mes) {
      const [y, m] = ym.split("-").map(Number);
      mes = { ym, label: `${MES_CURTO[m - 1]}/${y}`, previstoCents: 0, pagoCents: 0, abertoCents: 0, porResp: {} };
      buckets.set(ym, mes);
    }
    add(mes, valor, p.pago, resp);
  }

  const meses = [...buckets.values()].sort((a, b) => a.ym.localeCompare(b.ym));
  // Ordena responsáveis: Helena, Guilherme, Toninho primeiro; resto alfabético.
  const ordem = ["Helena", "Guilherme", "Toninho"];
  const responsaveis = [...respSet].sort((a, b) => {
    const ia = ordem.indexOf(a), ib = ordem.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b);
  });

  const totalPrevistoCents = meses.reduce((n, m) => n + m.previstoCents, 0) + semData.previstoCents;
  const totalPagoCents = meses.reduce((n, m) => n + m.pagoCents, 0) + semData.pagoCents;

  return { meses, semData, responsaveis, totalPrevistoCents, totalPagoCents };
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

  const { data } = await supabase.from("hg_guests").select("*").is("deleted_at", null);
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

export interface GiftRow {
  id: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  preco: number;
  permite_cota: boolean;
  status: string;
}

/** Lista de presentes para o painel — inclui adquiridos, exclui soft-deletados. */
export async function listGifts(): Promise<GiftRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_gifts")
    .select("id, nome, descricao, imagem_url, preco, permite_cota, status")
    .is("deleted_at", null)
    .order("ordem")
    .order("nome");
  return (data ?? []) as GiftRow[];
}

export interface InstallmentItem {
  id: string;
  numero: number;
  valor_cents: number;
  vencimento: string | null;
  pago: boolean;
  pago_em: string | null;
}

export interface ParcelavelRow {
  id: string;
  descricao: string;
  valor_total_cents: number;
  parcelas: InstallmentItem[];
  versoes: number;
}

/** Despesas com valor definido (parceláveis) + seus cronogramas. */
export async function listParcelaveis(): Promise<ParcelavelRow[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data: expenses } = await supabase
    .from("hg_expenses")
    .select("id, descricao, valor_total_cents")
    .is("deleted_at", null)
    .eq("gratuito", false)
    .not("valor_total_cents", "is", null)
    .order("descricao");

  if (!expenses || expenses.length === 0) return [];
  const ids = expenses.map((e) => e.id);

  const { data: inst } = await supabase
    .from("hg_expense_installments")
    .select("id, expense_id, numero, valor_cents, vencimento, pago, pago_em")
    .in("expense_id", ids)
    .order("numero");

  const { data: vers } = await supabase
    .from("hg_expense_schedule_versions")
    .select("expense_id")
    .in("expense_id", ids);

  const byExpense = new Map<string, InstallmentItem[]>();
  for (const i of inst ?? []) {
    const arr = byExpense.get(i.expense_id) ?? [];
    arr.push({ id: i.id, numero: i.numero, valor_cents: i.valor_cents, vencimento: i.vencimento, pago: i.pago, pago_em: i.pago_em });
    byExpense.set(i.expense_id, arr);
  }
  const versCount = new Map<string, number>();
  for (const v of vers ?? []) versCount.set(v.expense_id, (versCount.get(v.expense_id) ?? 0) + 1);

  return expenses.map((e) => ({
    id: e.id,
    descricao: e.descricao,
    valor_total_cents: Number(e.valor_total_cents),
    parcelas: byExpense.get(e.id) ?? [],
    versoes: versCount.get(e.id) ?? 0,
  }));
}

export interface PropostaItem {
  id: string;
  supplier_id: string | null;
  fornecedor_nome: string | null;
  valor_cents: number;
  entrada_cents: number | null;
  parcelas: number | null;
  prazo: string | null;
  inclui: string | null;
  observacao: string | null;
  status: string;
  escolhida: boolean;
}

export interface CotacaoRow {
  id: string;
  descricao: string;
  categoria: string | null;
  estado: string;
  valor_total_cents: number | null;
  propostas: PropostaItem[];
}

/** Itens do casamento (despesas não gratuitas) + suas propostas de fornecedores. */
export async function listCotacoes(): Promise<CotacaoRow[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data: expenses } = await supabase
    .from("hg_expenses")
    .select("id, descricao, categoria, estado, valor_total_cents")
    .is("deleted_at", null)
    .eq("gratuito", false)
    .order("categoria", { nullsFirst: false })
    .order("descricao");
  if (!expenses || expenses.length === 0) return [];

  const ids = expenses.map((e) => e.id);
  const { data: quotes } = await supabase
    .from("hg_quotes")
    .select("id, expense_id, supplier_id, fornecedor_nome, valor_cents, entrada_cents, parcelas, prazo, inclui, observacao, status, escolhida")
    .in("expense_id", ids)
    .is("deleted_at", null)
    .order("valor_cents");

  const byExpense = new Map<string, PropostaItem[]>();
  for (const q of quotes ?? []) {
    const arr = byExpense.get(q.expense_id) ?? [];
    arr.push({
      id: q.id,
      supplier_id: q.supplier_id,
      fornecedor_nome: q.fornecedor_nome,
      valor_cents: Number(q.valor_cents),
      entrada_cents: q.entrada_cents === null ? null : Number(q.entrada_cents),
      parcelas: q.parcelas,
      prazo: q.prazo,
      inclui: q.inclui,
      observacao: q.observacao,
      status: q.status,
      escolhida: q.escolhida,
    });
    byExpense.set(q.expense_id, arr);
  }

  return expenses.map((e) => ({
    id: e.id,
    descricao: e.descricao,
    categoria: e.categoria,
    estado: e.estado,
    valor_total_cents: e.valor_total_cents === null ? null : Number(e.valor_total_cents),
    propostas: byExpense.get(e.id) ?? [],
  }));
}

export interface ComprovanteItem {
  id: string;
  installment_id: string | null;
  titulo: string | null;
  arquivo_url: string;
  valor_cents: number | null;
  data_pagamento: string | null;
  observacao: string | null;
}

export interface ParcelaAberta {
  id: string;
  numero: number;
  valor_cents: number;
}

export interface ComprovanteExpenseRow {
  id: string;
  descricao: string;
  categoria: string | null;
  valor_total_cents: number;
  comprovantes: ComprovanteItem[];
  parcelasAbertas: ParcelaAberta[];
}

/** Despesas com valor definido + comprovantes anexados + parcelas em aberto. */
export async function listComprovantes(): Promise<ComprovanteExpenseRow[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data: expenses } = await supabase
    .from("hg_expenses")
    .select("id, descricao, categoria, valor_total_cents")
    .is("deleted_at", null)
    .eq("gratuito", false)
    .not("valor_total_cents", "is", null)
    .order("descricao");
  if (!expenses || expenses.length === 0) return [];

  const ids = expenses.map((e) => e.id);
  const { data: comps } = await supabase
    .from("hg_comprovantes")
    .select("id, expense_id, installment_id, titulo, arquivo_url, valor_cents, data_pagamento, observacao")
    .in("expense_id", ids)
    .is("deleted_at", null)
    .order("criado_em", { ascending: false });
  const { data: inst } = await supabase
    .from("hg_expense_installments")
    .select("id, expense_id, numero, valor_cents, pago")
    .in("expense_id", ids)
    .eq("pago", false)
    .order("numero");

  const compByExp = new Map<string, ComprovanteItem[]>();
  for (const c of comps ?? []) {
    const arr = compByExp.get(c.expense_id) ?? [];
    arr.push({
      id: c.id,
      installment_id: c.installment_id,
      titulo: c.titulo,
      arquivo_url: c.arquivo_url,
      valor_cents: c.valor_cents === null ? null : Number(c.valor_cents),
      data_pagamento: c.data_pagamento,
      observacao: c.observacao,
    });
    compByExp.set(c.expense_id, arr);
  }
  const parcByExp = new Map<string, ParcelaAberta[]>();
  for (const p of inst ?? []) {
    const arr = parcByExp.get(p.expense_id) ?? [];
    arr.push({ id: p.id, numero: p.numero, valor_cents: Number(p.valor_cents) });
    parcByExp.set(p.expense_id, arr);
  }

  return expenses.map((e) => ({
    id: e.id,
    descricao: e.descricao,
    categoria: e.categoria,
    valor_total_cents: Number(e.valor_total_cents),
    comprovantes: compByExp.get(e.id) ?? [],
    parcelasAbertas: parcByExp.get(e.id) ?? [],
  }));
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

export interface ChildRow {
  id: string;
  nome: string;
  idade: number | null;
  observacoes: string | null;
  responsavel_id: string | null;
  usara_espaco: boolean;
}

export async function listChildren(): Promise<ChildRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_children").select("*").is("deleted_at", null).order("nome");
  return (data ?? []) as ChildRow[];
}

export interface CommRow {
  id: string;
  canal: string;
  assunto: string | null;
  corpo: string;
  publico: string;
  status: string;
  criado_em: string;
}

export async function listCommunications(): Promise<CommRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_communications")
    .select("*")
    .is("deleted_at", null)
    .order("criado_em", { ascending: false })
    .limit(50);
  return (data ?? []) as CommRow[];
}

export async function listGuests(): Promise<Guest[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_guests")
    .select("*")
    .is("deleted_at", null)
    .order("criado_em", { ascending: false });
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
