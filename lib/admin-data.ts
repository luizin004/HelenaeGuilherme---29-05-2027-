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

export interface GrupoRow {
  id: string;
  nome: string;
  lado: string | null;
  max_convidados: number | null;
  observacao: string | null;
  integrantes: number;
}

export async function listGrupos(): Promise<GrupoRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const [{ data: grupos }, { data: guests }] = await Promise.all([
    supabase.from("hg_guest_groups").select("id, nome, lado, max_convidados, observacao").order("nome"),
    supabase.from("hg_guests").select("group_id").is("deleted_at", null),
  ]);
  const cnt = new Map<string, number>();
  for (const g of guests ?? []) if (g.group_id) cnt.set(g.group_id, (cnt.get(g.group_id) ?? 0) + 1);
  return (grupos ?? []).map((g) => ({
    id: g.id,
    nome: g.nome,
    lado: g.lado,
    max_convidados: g.max_convidados,
    observacao: g.observacao,
    integrantes: cnt.get(g.id) ?? 0,
  }));
}

export interface TransporteResumo {
  opcoes: { chave: string; label: string; total: number }[];
  oferecemCarona: { nome: string; telefone: string | null }[];
  precisamCarona: { nome: string; telefone: string | null }[];
  comInstagram: number;
  semResposta: number;
}

const TRANSPORTE_LABEL: Record<string, string> = {
  carro: "Vão de carro",
  com_outra_pessoa: "Vão com outra pessoa",
  oferece_vagas: "Oferecem carona",
  precisa_carona: "Precisam de carona",
  contratado: "Transporte contratado",
  nao_definiu: "Ainda não definiram",
};

/** Resumo de transporte a partir das respostas de RSVP (regra: sem expor dados entre convidados). */
export async function getTransporteResumo(): Promise<TransporteResumo> {
  const guests = await listGuests();
  const counts = new Map<string, number>();
  const oferecem: { nome: string; telefone: string | null }[] = [];
  const precisam: { nome: string; telefone: string | null }[] = [];
  let comInstagram = 0;
  let semResposta = 0;

  for (const g of guests) {
    if (g.instagram) comInstagram += 1;
    const t = g.transporte;
    if (!t) { semResposta += 1; continue; }
    counts.set(t, (counts.get(t) ?? 0) + 1);
    if (t === "oferece_vagas") oferecem.push({ nome: g.nome, telefone: g.telefone });
    if (t === "precisa_carona") precisam.push({ nome: g.nome, telefone: g.telefone });
  }

  const opcoes = Object.keys(TRANSPORTE_LABEL).map((chave) => ({ chave, label: TRANSPORTE_LABEL[chave], total: counts.get(chave) ?? 0 }));
  return { opcoes, oferecemCarona: oferecem, precisamCarona: precisam, comInstagram, semResposta };
}

export interface CategoriaResumo {
  categoria: string;
  itens: number;
  previstoCents: number;
  pagoCents: number;
}

/** Resumo por categoria (em uso): nº de itens, previsto e pago. */
export async function getCategoriasResumo(): Promise<CategoriaResumo[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const [expenses, parcelas] = await Promise.all([listExpenses(), listParcelasDetalhado()]);

  const pagoPorExp = new Map<string, number>();
  for (const p of parcelas) if (p.pago) pagoPorExp.set(p.expense_id, (pagoPorExp.get(p.expense_id) ?? 0) + p.valor_cents);

  const map = new Map<string, CategoriaResumo>();
  for (const e of expenses) {
    if (e.gratuito) continue;
    if (!e.categoria) continue;
    const r = map.get(e.categoria) ?? { categoria: e.categoria, itens: 0, previstoCents: 0, pagoCents: 0 };
    r.itens += 1;
    r.previstoCents += e.valor_total_cents ?? 0;
    r.pagoCents += pagoPorExp.get(e.id) ?? 0;
    map.set(e.categoria, r);
  }
  return [...map.values()].sort((a, b) => b.previstoCents - a.previstoCents || a.categoria.localeCompare(b.categoria));
}

export interface EvaniaConfig {
  ativa: boolean;
  grupo_nome: string | null;
  grupo_link: string | null;
  grupo_numero: string | null;
  horario: string;
  dias: string;
  canais: string;
  responsaveis: string | null;
  lembrete_30d: boolean;
  lembrete_15d: boolean;
  lembrete_7d: boolean;
  lembrete_3d: boolean;
  lembrete_1d: boolean;
  lembrete_dia: boolean;
  lembrete_apos: boolean;
  observacao: string | null;
}

export async function getEvaniaConfig(): Promise<EvaniaConfig | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("hg_evania_config").select("*").eq("id", 1).maybeSingle();
  return (data as EvaniaConfig) ?? null;
}

export interface EvaniaAgenda {
  hoje: ParcelaDetalhe[];
  semana: ParcelaDetalhe[];
  mes: ParcelaDetalhe[];
  vencidas: ParcelaDetalhe[];
  pagasSemComprovante: ParcelaDetalhe[];
  itensSemValor: number;
  comValorSemParcela: number;
  fornecedoresSemContrato: number;
}

/** O que a Evania "vê" hoje — agenda + diagnósticos, calculado do banco. */
export async function getEvaniaAgenda(): Promise<EvaniaAgenda> {
  const supabase = createClient();
  const vazio: EvaniaAgenda = { hoje: [], semana: [], mes: [], vencidas: [], pagasSemComprovante: [], itensSemValor: 0, comValorSemParcela: 0, fornecedoresSemContrato: 0 };
  if (!supabase) return vazio;

  const [parcelas, expenses, contracts, suppliers, { data: comps }] = await Promise.all([
    listParcelasDetalhado(),
    listExpenses(),
    listContracts(),
    listSuppliers(),
    supabase.from("hg_comprovantes").select("installment_id").is("deleted_at", null).not("installment_id", "is", null),
  ]);

  const hojeISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const ymAtual = hojeISO.slice(0, 7);
  const dias = (iso: string | null): number | null => {
    if (!iso) return null;
    const a = Date.parse(`${iso.slice(0, 10)}T00:00:00-03:00`);
    const b = Date.parse(`${hojeISO}T00:00:00-03:00`);
    return Number.isNaN(a) || Number.isNaN(b) ? null : Math.round((a - b) / 86_400_000);
  };

  const agenda: EvaniaAgenda = { ...vazio, hoje: [], semana: [], mes: [], vencidas: [], pagasSemComprovante: [] };
  const comComprovante = new Set((comps ?? []).map((c) => c.installment_id));

  for (const p of parcelas) {
    if (p.pago) {
      if (!comComprovante.has(p.id)) agenda.pagasSemComprovante.push(p);
      continue;
    }
    const d = dias(p.vencimento);
    if (d !== null && d < 0) agenda.vencidas.push(p);
    if (d === 0) agenda.hoje.push(p);
    if (d !== null && d >= 0 && d <= 7) agenda.semana.push(p);
    if (p.vencimento && p.vencimento.slice(0, 7) === ymAtual) agenda.mes.push(p);
  }

  const naoGrat = expenses.filter((e) => !e.gratuito);
  agenda.itensSemValor = naoGrat.filter((e) => e.valor_total_cents === null).length;
  const comParcela = new Set(parcelas.map((p) => p.expense_id));
  agenda.comValorSemParcela = naoGrat.filter((e) => e.valor_total_cents !== null && !comParcela.has(e.id)).length;
  const fornecedoresComContrato = new Set(contracts.map((c) => c.supplier_id).filter(Boolean));
  agenda.fornecedoresSemContrato = suppliers.filter((s) => !fornecedoresComContrato.has(s.id)).length;

  return agenda;
}

export interface FinanceDashboard {
  previstoCents: number;
  contratadoCents: number;
  pagoCents: number;
  abertoCents: number;
  vencidoCents: number;
  aPagarHojeCents: number;
  aPagarSemanaCents: number;
  aPagarMesCents: number;
  semValor: number;
  cortesias: number;
  economiaCents: number;
  contratos: number;
  parcelas: number;
  confirmados: number;
  custoPorConvidadoCents: number | null;
  aportesCents: number;
  saldoCaixaCents: number;
  compromissosFuturosCents: number;
  participacao: { categoria: string; cents: number; pct: number }[];
}

/** Agregado executivo do financeiro (cards do dashboard + participação por categoria). */
export async function getFinanceDashboard(): Promise<FinanceDashboard> {
  const [expenses, parcelas, cortesias, aportes, guestStats, contracts] = await Promise.all([
    listExpenses(),
    listParcelasDetalhado(),
    listCortesias(),
    listAportes(),
    getGuestStats(),
    listContracts(),
  ]);
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const ymAtual = hoje.slice(0, 7);
  const dias = (iso: string | null): number | null => {
    if (!iso) return null;
    const a = Date.parse(`${iso.slice(0, 10)}T00:00:00-03:00`);
    const b = Date.parse(`${hoje}T00:00:00-03:00`);
    return Number.isNaN(a) || Number.isNaN(b) ? null : Math.round((a - b) / 86_400_000);
  };

  const naoGrat = expenses.filter((e) => !e.gratuito);
  const previstoCents = naoGrat.reduce((n, e) => n + (e.valor_total_cents ?? 0), 0);
  const contratadoCents = naoGrat
    .filter((e) => e.estado === "contratado" || e.estado === "pago")
    .reduce((n, e) => n + (e.valor_total_cents ?? 0), 0);
  const semValor = naoGrat.filter((e) => e.valor_total_cents === null).length;

  let pagoCents = 0, abertoCents = 0, vencidoCents = 0, aPagarHojeCents = 0, aPagarSemanaCents = 0, aPagarMesCents = 0, compromissosFuturosCents = 0;
  for (const p of parcelas) {
    if (p.pago) { pagoCents += p.valor_cents; continue; }
    abertoCents += p.valor_cents;
    compromissosFuturosCents += p.valor_cents;
    const d = dias(p.vencimento);
    if (d !== null && d < 0) vencidoCents += p.valor_cents;
    if (d === 0) aPagarHojeCents += p.valor_cents;
    if (d !== null && d >= 0 && d <= 7) aPagarSemanaCents += p.valor_cents;
    if (p.vencimento && p.vencimento.slice(0, 7) === ymAtual) aPagarMesCents += p.valor_cents;
  }

  const economiaCents = cortesias.reduce((n, c) => n + (c.valor_mercado_cents ?? 0), 0);
  const aportesCents = aportes.reduce((n, a) => n + a.valor_cents, 0);
  const custoPorConvidadoCents = guestStats.confirmados > 0 ? Math.round(previstoCents / guestStats.confirmados) : null;

  // Participação por categoria (previsto).
  const cat = new Map<string, number>();
  for (const e of naoGrat) {
    const k = e.categoria || "Sem categoria";
    cat.set(k, (cat.get(k) ?? 0) + (e.valor_total_cents ?? 0));
  }
  const totalCat = [...cat.values()].reduce((n, v) => n + v, 0) || 1;
  const participacao = [...cat.entries()]
    .map(([categoria, cents]) => ({ categoria, cents, pct: Math.round((cents / totalCat) * 100) }))
    .filter((x) => x.cents > 0)
    .sort((a, b) => b.cents - a.cents);

  return {
    previstoCents, contratadoCents, pagoCents, abertoCents, vencidoCents,
    aPagarHojeCents, aPagarSemanaCents, aPagarMesCents,
    semValor, cortesias: cortesias.length, economiaCents,
    contratos: contracts.length, parcelas: parcelas.length,
    confirmados: guestStats.confirmados,
    custoPorConvidadoCents,
    aportesCents, saldoCaixaCents: aportesCents - pagoCents, compromissosFuturosCents,
    participacao,
  };
}

export interface DivisaoRow {
  id: string;
  descricao: string;
  categoria: string | null;
  valor_total_cents: number;
  splits: Record<string, number>; // payer_id -> valor_cents
}

/** Despesas com valor (não gratuitas) + divisão atual entre responsáveis. */
export async function listDivisao(): Promise<DivisaoRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: exps } = await supabase
    .from("hg_expenses")
    .select("id, descricao, categoria, valor_total_cents")
    .is("deleted_at", null)
    .eq("gratuito", false)
    .not("valor_total_cents", "is", null)
    .order("descricao");
  if (!exps || exps.length === 0) return [];
  const ids = exps.map((e) => e.id);
  const { data: splits } = await supabase
    .from("hg_expense_payer_splits")
    .select("expense_id, payer_id, valor_cents")
    .in("expense_id", ids);
  const byExp = new Map<string, Record<string, number>>();
  for (const s of splits ?? []) {
    const r = byExp.get(s.expense_id) ?? {};
    r[s.payer_id] = Number(s.valor_cents);
    byExp.set(s.expense_id, r);
  }
  return exps.map((e) => ({
    id: e.id,
    descricao: e.descricao,
    categoria: e.categoria,
    valor_total_cents: Number(e.valor_total_cents),
    splits: byExp.get(e.id) ?? {},
  }));
}

export interface ReembolsoRow {
  id: string;
  pagador: string;
  devedor: string;
  valor_cents: number;
  data: string;
  motivo: string | null;
  status: string;
}

export async function listReembolsos(): Promise<ReembolsoRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const [{ data }, payers] = await Promise.all([
    supabase
      .from("hg_reembolsos")
      .select("id, pagador_payer_id, pagador_nome, devedor_payer_id, devedor_nome, valor_cents, data, motivo, status")
      .is("deleted_at", null)
      .order("data", { ascending: false }),
    getPayers(),
  ]);
  const nome = new Map(payers.map((p) => [p.id, p.nome]));
  return (data ?? []).map((r) => ({
    id: r.id,
    pagador: r.pagador_nome || (r.pagador_payer_id ? nome.get(r.pagador_payer_id) ?? "—" : "—"),
    devedor: r.devedor_nome || (r.devedor_payer_id ? nome.get(r.devedor_payer_id) ?? "—" : "—"),
    valor_cents: Number(r.valor_cents),
    data: r.data,
    motivo: r.motivo,
    status: r.status,
  }));
}

export interface CortesiaRow {
  id: string;
  descricao: string;
  categoria: string | null;
  valor_mercado_cents: number | null;
}

export async function listCortesias(): Promise<CortesiaRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_expenses")
    .select("id, descricao, categoria, valor_mercado_cents")
    .is("deleted_at", null)
    .eq("gratuito", true)
    .order("descricao");
  return (data ?? []).map((e) => ({
    id: e.id,
    descricao: e.descricao,
    categoria: e.categoria,
    valor_mercado_cents: e.valor_mercado_cents === null ? null : Number(e.valor_mercado_cents),
  }));
}

export interface CentroFull {
  id: string;
  nome: string;
  cor: string | null;
  orcamento_cents: number | null;
  ativo: boolean;
  ordem: number;
  lancamentos: number;
  previstoCents: number;
}

/** Centros de custo com uso (nº de lançamentos e previsto). */
export async function listCentrosFull(): Promise<CentroFull[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: centros } = await supabase
    .from("hg_cost_centers")
    .select("id, nome, cor, orcamento_cents, ativo, ordem")
    .order("ordem");
  if (!centros) return [];
  const { data: exps } = await supabase
    .from("hg_expenses")
    .select("cost_center_id, valor_total_cents")
    .is("deleted_at", null)
    .not("cost_center_id", "is", null);

  const cnt = new Map<string, { n: number; prev: number }>();
  for (const e of exps ?? []) {
    const c = cnt.get(e.cost_center_id) ?? { n: 0, prev: 0 };
    c.n += 1;
    c.prev += Number(e.valor_total_cents ?? 0);
    cnt.set(e.cost_center_id, c);
  }
  return centros.map((c) => ({
    id: c.id,
    nome: c.nome,
    cor: c.cor,
    orcamento_cents: c.orcamento_cents === null ? null : Number(c.orcamento_cents),
    ativo: c.ativo,
    ordem: c.ordem,
    lancamentos: cnt.get(c.id)?.n ?? 0,
    previstoCents: cnt.get(c.id)?.prev ?? 0,
  }));
}

export interface AporteRow {
  id: string;
  responsavel: string;
  valor_cents: number;
  data: string;
  finalidade: string | null;
  observacao: string | null;
}

export async function listAportes(): Promise<AporteRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const [{ data }, payers] = await Promise.all([
    supabase
      .from("hg_aportes")
      .select("id, payer_id, responsavel_nome, valor_cents, data, finalidade, observacao")
      .is("deleted_at", null)
      .order("data", { ascending: false }),
    getPayers(),
  ]);
  const nome = new Map(payers.map((p) => [p.id, p.nome]));
  return (data ?? []).map((a) => ({
    id: a.id,
    responsavel: a.responsavel_nome || (a.payer_id ? nome.get(a.payer_id) ?? "—" : "—"),
    valor_cents: Number(a.valor_cents),
    data: a.data,
    finalidade: a.finalidade,
    observacao: a.observacao,
  }));
}

export interface FluxoMes {
  ym: string;
  label: string;
  entradasCents: number;
  saidasCents: number;
  saldoMesCents: number;
  acumuladoCents: number;
}

export interface FluxoResult {
  meses: FluxoMes[];
  totalEntradasCents: number;
  totalSaidasCents: number;
  saldoAtualCents: number;
  compromissosFuturosCents: number;
}

const _MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function labelYM(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${_MES[m - 1]}/${y}`;
}

/** Fluxo de caixa: aportes (entradas) x parcelas pagas (saídas), saldo acumulado. */
export async function getFluxoCaixa(): Promise<FluxoResult> {
  const [aportes, parcelas] = await Promise.all([listAportes(), listParcelasDetalhado()]);

  const entradas = new Map<string, number>();
  for (const a of aportes) {
    const ym = a.data.slice(0, 7);
    entradas.set(ym, (entradas.get(ym) ?? 0) + a.valor_cents);
  }
  const saidas = new Map<string, number>();
  let compromissosFuturosCents = 0;
  for (const p of parcelas) {
    if (p.pago && p.pago_em) {
      const ym = p.pago_em.slice(0, 7);
      saidas.set(ym, (saidas.get(ym) ?? 0) + p.valor_cents);
    } else if (!p.pago) {
      compromissosFuturosCents += p.valor_cents;
    }
  }

  const yms = [...new Set([...entradas.keys(), ...saidas.keys()])].sort();
  let acumulado = 0;
  const meses: FluxoMes[] = yms.map((ym) => {
    const e = entradas.get(ym) ?? 0;
    const s = saidas.get(ym) ?? 0;
    acumulado += e - s;
    return { ym, label: labelYM(ym), entradasCents: e, saidasCents: s, saldoMesCents: e - s, acumuladoCents: acumulado };
  });

  const totalEntradasCents = [...entradas.values()].reduce((n, v) => n + v, 0);
  const totalSaidasCents = [...saidas.values()].reduce((n, v) => n + v, 0);
  return {
    meses,
    totalEntradasCents,
    totalSaidasCents,
    saldoAtualCents: totalEntradasCents - totalSaidasCents,
    compromissosFuturosCents,
  };
}

export interface ResponsavelResumo {
  nome: string;
  assumidoCents: number;
  pagoCents: number;
  abertoCents: number;
  esteMesCents: number;
  proxMesCents: number;
  aportesCents: number;
}

/** Resumo por responsável (Helena, Guilherme, Toninho…): parcelas + aportes. */
export async function getResponsavelResumo(): Promise<ResponsavelResumo[]> {
  const [parcelas, aportes, payers] = await Promise.all([listParcelasDetalhado(), listAportes(), getPayers()]);
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const ymAtual = hoje.slice(0, 7);
  const [ay, am] = ymAtual.split("-").map(Number);
  const ymProx = `${am === 12 ? ay + 1 : ay}-${String(am === 12 ? 1 : am + 1).padStart(2, "0")}`;

  const map = new Map<string, ResponsavelResumo>();
  const get = (n: string) =>
    map.get(n) ??
    (map.set(n, { nome: n, assumidoCents: 0, pagoCents: 0, abertoCents: 0, esteMesCents: 0, proxMesCents: 0, aportesCents: 0 }), map.get(n)!);

  // Semeia os responsáveis (exceto Gratuito) para aparecerem mesmo zerados.
  for (const p of payers) if (p.nome !== "Gratuito") get(p.nome);

  for (const p of parcelas) {
    const r = get(p.responsavel);
    r.assumidoCents += p.valor_cents;
    if (p.pago) r.pagoCents += p.valor_cents;
    else {
      r.abertoCents += p.valor_cents;
      const ym = p.vencimento?.slice(0, 7);
      if (ym === ymAtual) r.esteMesCents += p.valor_cents;
      else if (ym === ymProx) r.proxMesCents += p.valor_cents;
    }
  }
  for (const a of aportes) get(a.responsavel).aportesCents += a.valor_cents;

  const ordem = ["Helena", "Guilherme", "Toninho"];
  return [...map.values()].sort((a, b) => {
    const ia = ordem.indexOf(a.nome), ib = ordem.indexOf(b.nome);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return b.assumidoCents - a.assumidoCents;
  });
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
