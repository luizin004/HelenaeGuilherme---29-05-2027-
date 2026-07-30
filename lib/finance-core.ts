/**
 * FONTE ÚNICA de leitura do financeiro (§7/§27).
 * Dashboard, Contas, Calendário, Parcelas, Projeção, Fluxo e Relatórios devem
 * ler DAQUI. Um registro (despesa/parcela) aparece em cada tela conforme seu
 * status — nunca é copiado ou duplicado.
 */

import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/format";
import {
  agruparPorMes,
  saldoCents,
  statusConta,
  totalPago,
  type ContaStatus,
  type ItemMensal,
  type MesAgregado,
} from "@/domain/finance/status";
import type { Cents } from "@/domain/money";

// ---------- Tipos ----------

export interface Classificacao {
  id: string;
  nome: string;
  descricao: string | null;
  parent_id: string | null;
  icone: string | null;
  cor: string | null;
  ordem: number;
  ativo: boolean;
  orcamento_cents: number | null;
  legacy_cost_center_id: string | null;
  legacy_categoria: string | null;
}

export interface MetodoPagamento {
  id: string;
  chave: string;
  nome: string;
  ativo: boolean;
}

export interface ContaFinanceira {
  id: string;
  nome: string;
  tipo: string;
  saldo_inicial_cents: number;
  ativo: boolean;
}

export interface PagamentoRow {
  id: string;
  expense_id: string;
  installment_id: string | null;
  valor_cents: number;
  data: string;
  metodo_id: string | null;
  conta_id: string | null;
  responsavel: string | null;
  observacao: string | null;
  estornado_em: string | null;
}

/** Uma "conta" = parcela de uma despesa, ou a própria despesa quando não parcelada. */
export interface ContaRow {
  id: string;                 // id da parcela ou "exp:<expense_id>"
  expenseId: string;
  installmentId: string | null;
  descricao: string;
  classificacao: string | null;
  classificacaoId: string | null;
  fornecedor: string | null;
  valorCents: Cents;
  pagoCents: Cents;
  saldoCents: Cents;
  vencimento: string | null;
  previsao: string | null;
  competencia: string | null;
  status: ContaStatus;
  numero: number | null;
  totalParcelas: number | null;
  isEntrada: boolean;
  estadoDespesa: string;
  gratuito: boolean;
}

export type AbaConta = "todas" | "a_pagar" | "vencendo" | "vencidas" | "parciais" | "pagas" | "canceladas";

export interface FinanceData {
  hoje: string;
  contas: ContaRow[];
  pagamentos: PagamentoRow[];
  classificacoes: Classificacao[];
  metodos: MetodoPagamento[];
  contasFinanceiras: ContaFinanceira[];
  aportes: { id: string; responsavel: string; valorCents: Cents; data: string | null }[];
}

// ---------- Carga única ----------

interface ExpenseRec {
  id: string;
  descricao: string;
  estado: string;
  gratuito: boolean;
  valor_total_cents: number | null;
  classification_id: string | null;
  supplier_id: string | null;
  competencia: string | null;
}

/** Carrega tudo em paralelo, uma vez por request (server component). */
export async function loadFinance(): Promise<FinanceData> {
  const vazio: FinanceData = {
    hoje: hojeISO(),
    contas: [],
    pagamentos: [],
    classificacoes: [],
    metodos: [],
    contasFinanceiras: [],
    aportes: [],
  };
  const supabase = createClient();
  if (!supabase) return vazio;

  const [expQ, instQ, payQ, classQ, metQ, accQ, supQ, apQ] = await Promise.all([
    supabase
      .from("hg_expenses")
      .select("id, descricao, estado, gratuito, valor_total_cents, classification_id, supplier_id, competencia")
      .is("deleted_at", null),
    supabase.from("hg_expense_installments").select("id, expense_id, numero, valor_cents, vencimento, previsao, pago, is_entrada"),
    supabase.from("hg_expense_payments").select("*").order("data", { ascending: false }),
    supabase.from("hg_financial_classifications").select("*").order("ordem").order("nome"),
    supabase.from("hg_payment_methods").select("id, chave, nome, ativo").order("ordem"),
    supabase.from("hg_financial_accounts").select("id, nome, tipo, saldo_inicial_cents, ativo").order("ordem"),
    supabase.from("hg_suppliers").select("id, nome").is("deleted_at", null),
    // O aporte guarda OU um responsável cadastrado (payer_id) OU um nome avulso.
    supabase.from("hg_aportes").select("id, responsavel_nome, payer_id, valor_cents, data, hg_payers(nome)").is("deleted_at", null),
  ]);

  const hoje = hojeISO();
  const expenses = (expQ.data ?? []) as ExpenseRec[];
  const installments = (instQ.data ?? []) as {
    id: string; expense_id: string; numero: number; valor_cents: number;
    vencimento: string | null; previsao: string | null; pago: boolean; is_entrada: boolean;
  }[];
  const pagamentos = (payQ.data ?? []) as PagamentoRow[];
  const classificacoes = (classQ.data ?? []) as Classificacao[];
  const suppliers = new Map(((supQ.data ?? []) as { id: string; nome: string }[]).map((s) => [s.id, s.nome]));
  const classMap = new Map(classificacoes.map((c) => [c.id, c.nome]));

  // Pagamentos válidos por parcela e por despesa (estornos NÃO contam — §10).
  const pagoPorParcela = new Map<string, Cents>();
  const pagoAvulsoPorDespesa = new Map<string, Cents>();
  for (const p of pagamentos) {
    if (p.estornado_em) continue;
    if (p.installment_id) {
      pagoPorParcela.set(p.installment_id, (pagoPorParcela.get(p.installment_id) ?? 0) + p.valor_cents);
    } else {
      pagoAvulsoPorDespesa.set(p.expense_id, (pagoAvulsoPorDespesa.get(p.expense_id) ?? 0) + p.valor_cents);
    }
  }

  const instPorDespesa = new Map<string, typeof installments>();
  for (const i of installments) {
    const arr = instPorDespesa.get(i.expense_id) ?? [];
    arr.push(i);
    instPorDespesa.set(i.expense_id, arr);
  }

  const contas: ContaRow[] = [];
  for (const e of expenses) {
    const cancelado = false; // estado "cancelado" não existe no legado; reservado
    const insts = (instPorDespesa.get(e.id) ?? []).sort((a, b) => a.numero - b.numero);
    const base = {
      expenseId: e.id,
      descricao: e.descricao,
      classificacao: e.classification_id ? (classMap.get(e.classification_id) ?? null) : null,
      classificacaoId: e.classification_id,
      fornecedor: e.supplier_id ? (suppliers.get(e.supplier_id) ?? null) : null,
      competencia: e.competencia,
      estadoDespesa: e.estado,
      gratuito: e.gratuito,
    };

    if (insts.length > 0) {
      const total = insts.length;
      for (const i of insts) {
        // Compat: parcelas pagas no modelo antigo sem registro em payments.
        const pago = pagoPorParcela.get(i.id) ?? (i.pago ? i.valor_cents : 0);
        contas.push({
          ...base,
          id: i.id,
          installmentId: i.id,
          valorCents: i.valor_cents,
          pagoCents: pago,
          saldoCents: saldoCents(i.valor_cents, pago),
          vencimento: i.vencimento,
          previsao: i.previsao,
          status: statusConta({
            valorCents: i.valor_cents,
            pagoCents: pago,
            vencimento: i.vencimento,
            previsao: i.previsao,
            hoje,
            cancelado,
            gratuito: e.gratuito,
          }),
          numero: i.numero,
          totalParcelas: total,
          isEntrada: i.is_entrada,
        });
      }
    } else if ((e.valor_total_cents ?? 0) > 0 || e.gratuito) {
      const valor = e.valor_total_cents ?? 0;
      const pago = pagoAvulsoPorDespesa.get(e.id) ?? 0;
      contas.push({
        ...base,
        id: `exp:${e.id}`,
        installmentId: null,
        valorCents: valor,
        pagoCents: pago,
        saldoCents: saldoCents(valor, pago),
        vencimento: null,
        previsao: null,
        status: statusConta({ valorCents: valor, pagoCents: pago, vencimento: null, hoje, cancelado, gratuito: e.gratuito }),
        numero: null,
        totalParcelas: null,
        isEntrada: false,
      });
    }
  }

  return {
    hoje,
    contas,
    pagamentos,
    classificacoes,
    metodos: (metQ.data ?? []) as MetodoPagamento[],
    contasFinanceiras: (accQ.data ?? []) as ContaFinanceira[],
    aportes: (
      (apQ.data ?? []) as {
        id: string;
        responsavel_nome: string | null;
        valor_cents: number;
        data: string | null;
        hg_payers: { nome: string } | { nome: string }[] | null;
      }[]
    ).map((a) => {
      const cadastrado = Array.isArray(a.hg_payers) ? a.hg_payers[0]?.nome : a.hg_payers?.nome;
      return {
        id: a.id,
        responsavel: a.responsavel_nome ?? cadastrado ?? "Sem responsável",
        valorCents: a.valor_cents,
        data: a.data,
      };
    }),
  };
}

// ---------- Abas de Contas (§15) ----------

/** Vencendo = vence hoje ou nos próximos 7 dias. */
export function filtrarAba(contas: ContaRow[], aba: AbaConta, hoje: string): ContaRow[] {
  const em7 = new Date(`${hoje}T00:00:00Z`);
  em7.setUTCDate(em7.getUTCDate() + 7);
  const limite = em7.toISOString().slice(0, 10);

  switch (aba) {
    case "a_pagar":
      return contas.filter((c) => c.saldoCents > 0 && c.status !== "cancelado" && c.status !== "gratuito");
    case "vencendo":
      return contas.filter(
        (c) => c.saldoCents > 0 && c.vencimento !== null && c.vencimento >= hoje && c.vencimento <= limite,
      );
    case "vencidas":
      return contas.filter((c) => c.status === "vencido" || (c.status === "parcial" && !!c.vencimento && c.vencimento < hoje));
    case "parciais":
      return contas.filter((c) => c.status === "parcial");
    case "pagas":
      return contas.filter((c) => c.status === "pago");
    case "canceladas":
      return contas.filter((c) => c.status === "cancelado");
    default:
      return contas;
  }
}

export function contarAbas(contas: ContaRow[], hoje: string): Record<AbaConta, number> {
  const abas: AbaConta[] = ["todas", "a_pagar", "vencendo", "vencidas", "parciais", "pagas", "canceladas"];
  return Object.fromEntries(abas.map((a) => [a, filtrarAba(contas, a, hoje).length])) as Record<AbaConta, number>;
}

// ---------- Projeção mensal (§18) ----------

export type VisaoProjecao = "vencimento" | "competencia" | "pagamento";

export interface ProjecaoV2 {
  visao: VisaoProjecao;
  meses: MesAgregado[];
  semDataCents: Cents;
  totalPrevistoCents: Cents;
  totalPagoCents: Cents;
  totalPendenteCents: Cents;
  totalVencidoCents: Cents;
  totalEntradasCents: Cents;
}

export function projetarMensal(d: FinanceData, visao: VisaoProjecao): ProjecaoV2 {
  const itens: ItemMensal[] = [];

  if (visao === "pagamento") {
    // Fluxo realizado: cada pagamento na sua data real.
    for (const p of d.pagamentos) {
      if (p.estornado_em) continue;
      itens.push({ data: p.data, valorCents: p.valor_cents, pagoCents: p.valor_cents });
    }
  } else {
    for (const c of d.contas) {
      if (c.status === "cancelado" || c.status === "gratuito") continue; // §10: cancelado fora da projeção
      const data =
        visao === "competencia" ? (c.competencia ?? c.vencimento ?? c.previsao) : (c.vencimento ?? c.previsao);
      itens.push({
        data,
        valorCents: c.valorCents,
        pagoCents: c.pagoCents,
        vencido: c.status === "vencido" || (c.status === "parcial" && !!c.vencimento && c.vencimento < d.hoje),
      });
    }
  }

  // Aportes entram como entradas em qualquer visão.
  for (const a of d.aportes) {
    itens.push({ data: a.data, valorCents: a.valorCents, tipo: "entrada" });
  }

  const { meses, semData } = agruparPorMes(itens);
  const soma = (f: (m: MesAgregado) => number) => meses.reduce((n, m) => n + f(m), 0);
  return {
    visao,
    meses,
    semDataCents: semData.reduce((n, i) => n + (i.tipo === "entrada" ? 0 : i.valorCents), 0),
    totalPrevistoCents: soma((m) => m.previstoCents),
    totalPagoCents: soma((m) => m.pagoCents),
    totalPendenteCents: soma((m) => m.pendenteCents),
    totalVencidoCents: soma((m) => m.vencidoCents),
    totalEntradasCents: soma((m) => m.entradasCents),
  };
}

// ---------- Fluxo de caixa (§19) ----------

export interface FluxoV2 {
  modo: "realizado" | "projetado";
  meses: MesAgregado[];
  totalEntradasCents: Cents;
  totalSaidasCents: Cents;
  saldoCents: Cents;
}

export function fluxoCaixa(d: FinanceData, modo: "realizado" | "projetado"): FluxoV2 {
  const itens: ItemMensal[] = [];
  if (modo === "realizado") {
    for (const p of d.pagamentos) {
      if (p.estornado_em) continue;
      itens.push({ data: p.data, valorCents: p.valor_cents, pagoCents: p.valor_cents });
    }
  } else {
    for (const c of d.contas) {
      if (c.saldoCents <= 0 || c.status === "cancelado" || c.status === "gratuito") continue;
      itens.push({ data: c.vencimento ?? c.previsao, valorCents: c.saldoCents });
    }
  }
  for (const a of d.aportes) itens.push({ data: a.data, valorCents: a.valorCents, tipo: "entrada" });

  const { meses } = agruparPorMes(itens);
  const totalEntradas = meses.reduce((n, m) => n + m.entradasCents, 0);
  const totalSaidas = meses.reduce((n, m) => n + m.saidasCents, 0);
  return { modo, meses, totalEntradasCents: totalEntradas, totalSaidasCents: totalSaidas, saldoCents: totalEntradas - totalSaidas };
}

// ---------- Dashboard (§11) ----------

export interface DashboardV2 {
  orcadoCents: Cents;         // soma dos valores das despesas ativas
  contratadoCents: Cents;     // despesas em estado contratado/pago
  previstoCents: Cents;       // soma das contas (parcelas)
  pagoCents: Cents;
  pendenteCents: Cents;
  vencidoCents: Cents;
  aportesCents: Cents;
  saldoDisponivelCents: Cents; // aportes − pagos
  economiaCents: Cents;        // cortesias (valor de mercado)
  proximasContas: ContaRow[];
  contasVencidas: ContaRow[];
  ultimosPagamentos: PagamentoRow[];
  porClassificacao: { nome: string; cents: Cents; pct: number }[];
}

export function dashboardFinanceiro(d: FinanceData, economiaCents: Cents = 0): DashboardV2 {
  const ativas = d.contas.filter((c) => c.status !== "cancelado");
  const pago = totalPago(d.pagamentos.map((p) => ({ valorCents: p.valor_cents, estornado: !!p.estornado_em })));
  const pendente = ativas.reduce((n, c) => n + (c.status !== "gratuito" ? c.saldoCents : 0), 0);
  const vencido = ativas
    .filter((c) => c.status === "vencido" || (c.status === "parcial" && !!c.vencimento && c.vencimento < d.hoje))
    .reduce((n, c) => n + c.saldoCents, 0);
  const aportes = d.aportes.reduce((n, a) => n + a.valorCents, 0);

  const abertas = ativas
    .filter((c) => c.saldoCents > 0 && c.vencimento)
    .sort((a, b) => (a.vencimento! < b.vencimento! ? -1 : 1));

  const porClass = new Map<string, Cents>();
  for (const c of ativas) {
    if (c.status === "gratuito") continue;
    const k = c.classificacao ?? "Sem classificação";
    porClass.set(k, (porClass.get(k) ?? 0) + c.valorCents);
  }
  const totalClass = [...porClass.values()].reduce((a, b) => a + b, 0) || 1;

  return {
    orcadoCents: ativas.filter((c) => !c.gratuito).reduce((n, c) => n + c.valorCents, 0),
    contratadoCents: ativas
      .filter((c) => ["contratado", "pago"].includes(c.estadoDespesa))
      .reduce((n, c) => n + c.valorCents, 0),
    previstoCents: ativas.filter((c) => !c.gratuito).reduce((n, c) => n + c.valorCents, 0),
    pagoCents: pago,
    pendenteCents: pendente,
    vencidoCents: vencido,
    aportesCents: aportes,
    saldoDisponivelCents: aportes - pago,
    economiaCents,
    proximasContas: abertas.filter((c) => c.vencimento! >= d.hoje).slice(0, 5),
    contasVencidas: abertas.filter((c) => c.vencimento! < d.hoje).slice(0, 5),
    ultimosPagamentos: d.pagamentos.filter((p) => !p.estornado_em).slice(0, 5),
    porClassificacao: [...porClass.entries()]
      .map(([nome, cents]) => ({ nome, cents, pct: Math.round((cents / totalClass) * 100) }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 8),
  };
}
