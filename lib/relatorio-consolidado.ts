/**
 * Fonte única do relatório CONSOLIDADO — usada pela tela de Relatórios e pelo
 * PDF, para os dois nunca mostrarem números diferentes.
 *
 * Cruza o que hoje vive em abas separadas: Lançamentos (custo por item),
 * Contas (parcelas e vencimentos), Fluxo de caixa (entradas × saídas),
 * Calendário (agenda) e prazos de contratação.
 */

import {
  loadFinance,
  dashboardFinanceiro,
  fluxoCaixa,
  filtrarAba,
  type ContaRow,
  type FluxoV2,
} from "@/lib/finance-core";
import { listCortesias, listExpenses, getResponsavelResumo, type ResponsavelResumo } from "@/lib/admin-data";
import { agendaContratacao, type AgendaContratacao } from "@/domain/evania/contratacao";
import { consolidar, leituraDoCaixa, pontosDeAtencao, type Consolidado } from "@/domain/finance/consolidado";
import { formatCents, type Cents } from "@/domain/money";
import { hojeISO, diasAte } from "@/lib/format";

export interface LinhaClassificacao {
  nome: string;
  previstoCents: Cents;
  contratadoCents: Cents;
  pagoCents: Cents;
  abertoCents: Cents;
  pct: number;
}

export interface DadosConsolidado {
  hoje: string;
  consolidado: Consolidado;
  leitura: string;
  avisos: string[];
  porClassificacao: LinhaClassificacao[];
  porResponsavel: ResponsavelResumo[];
  proximas: ContaRow[];
  vencidas: ContaRow[];
  contratacao: AgendaContratacao;
  fluxo: FluxoV2;
}

const CONTRATADO = new Set(["contratado", "pago"]);

export async function carregarConsolidado(): Promise<DadosConsolidado> {
  const [d, cortesias, expenses, porResponsavel] = await Promise.all([
    loadFinance(),
    listCortesias(),
    listExpenses(),
    getResponsavelResumo(),
  ]);

  const hoje = hojeISO();
  const economia = cortesias.reduce((n, c) => n + (c.valor_mercado_cents ?? 0), 0);
  const dash = dashboardFinanceiro(d, economia);
  const fluxo = fluxoCaixa(d, "projetado");

  const naoGratuitos = expenses.filter((e) => !e.gratuito);
  const custoConhecidoCents = naoGratuitos.reduce((n, e) => n + (e.valor_total_cents ?? 0), 0);

  const consolidado = consolidar({
    aportesCents: dash.aportesCents,
    pagoCents: dash.pagoCents,
    pendenteCents: dash.pendenteCents,
    vencidoCents: dash.vencidoCents,
    custoConhecidoCents,
    contratadoCents: dash.contratadoCents,
    economiaCents: economia,
    itens: {
      total: expenses.length,
      comValor: naoGratuitos.filter((e) => e.valor_total_cents !== null).length,
      semValor: naoGratuitos.filter((e) => e.valor_total_cents === null).length,
      gratuitos: expenses.length - naoGratuitos.length,
    },
  });

  const contratacao = agendaContratacao(
    expenses.map((e) => ({
      id: e.id,
      descricao: e.descricao,
      categoria: e.categoria,
      estado: e.estado,
      gratuito: e.gratuito,
      prazo_contratacao: e.prazo_contratacao,
    })),
    hoje,
  );

  // Contas com saldo aberto vencendo nos próximos 7 dias.
  const venceEm7Dias = d.contas.filter((c) => {
    if (c.saldoCents <= 0 || !c.vencimento) return false;
    const dias = diasAte(c.vencimento, hoje);
    return dias !== null && dias >= 0 && dias <= 7;
  }).length;

  // Custo por classificação, cruzando estado (contratado) e parcelas pagas.
  const porClass = new Map<string, LinhaClassificacao>();
  for (const c of d.contas) {
    if (c.status === "cancelado" || c.gratuito) continue;
    const nome = c.classificacao ?? "Sem classificação";
    const linha =
      porClass.get(nome) ?? { nome, previstoCents: 0, contratadoCents: 0, pagoCents: 0, abertoCents: 0, pct: 0 };
    linha.previstoCents += c.valorCents;
    if (CONTRATADO.has(c.estadoDespesa)) linha.contratadoCents += c.valorCents;
    linha.pagoCents += c.pagoCents;
    linha.abertoCents += c.saldoCents;
    porClass.set(nome, linha);
  }
  const totalClass = [...porClass.values()].reduce((n, l) => n + l.previstoCents, 0) || 1;
  const porClassificacao = [...porClass.values()]
    .map((l) => ({ ...l, pct: Math.round((l.previstoCents / totalClass) * 100) }))
    .sort((a, b) => b.previstoCents - a.previstoCents);

  return {
    hoje,
    consolidado,
    leitura: leituraDoCaixa(consolidado, formatCents),
    avisos: pontosDeAtencao(
      consolidado,
      { contratacoesVencidas: contratacao.vencidos.length, semPrazo: contratacao.semPrazo.length, venceEm7Dias },
      formatCents,
    ),
    porClassificacao,
    porResponsavel,
    proximas: dash.proximasContas,
    vencidas: filtrarAba(d.contas, "vencidas", hoje),
    contratacao,
    fluxo,
  };
}
