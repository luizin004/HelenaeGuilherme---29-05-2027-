/**
 * Eventos do calendário financeiro.
 *
 * Nada é cadastrado à parte (§17): todo evento nasce de um lançamento —
 * vencimento/previsão de conta, pagamento realizado ou aporte. Módulo puro,
 * usado tanto pela aba Calendário quanto pelo relatório em PDF, para os dois
 * nunca divergirem.
 */

import type { Cents } from "@/domain/money";
import { ymOf, type ContaStatus } from "@/domain/finance/status";

export type TipoEvento = "vencimento" | "pagamento" | "aporte";

export interface EventoCalendario {
  data: string;
  tipo: TipoEvento;
  titulo: string;
  detalhe: string | null;
  valorCents: Cents;
  status?: ContaStatus;
}

/** Só o que o calendário precisa das contas — desacopla do ContaRow inteiro. */
export interface ContaCalendario {
  descricao: string;
  classificacao: string | null;
  valorCents: Cents;
  saldoCents: Cents;
  vencimento: string | null;
  previsao: string | null;
  status: ContaStatus;
  numero: number | null;
  totalParcelas: number | null;
}

export interface FonteCalendario {
  contas: ContaCalendario[];
  pagamentos: { data: string; valor_cents: Cents; responsavel: string | null; estornado_em: string | null }[];
  aportes: { data: string | null; valorCents: Cents; responsavel: string }[];
}

/** Monta e ordena por data todos os eventos financeiros. */
export function montarEventos(d: FonteCalendario): EventoCalendario[] {
  const eventos: EventoCalendario[] = [];

  for (const c of d.contas) {
    const data = c.vencimento ?? c.previsao;
    if (!data || c.status === "gratuito") continue;
    eventos.push({
      data,
      tipo: "vencimento",
      titulo: c.descricao + (c.numero ? ` · ${c.numero}/${c.totalParcelas}` : ""),
      detalhe: c.classificacao,
      // Parcialmente paga mostra o que falta; quitada mostra o valor cheio.
      valorCents: c.saldoCents > 0 ? c.saldoCents : c.valorCents,
      status: c.status,
    });
  }

  for (const p of d.pagamentos) {
    if (p.estornado_em) continue;
    eventos.push({
      data: p.data,
      tipo: "pagamento",
      titulo: "Pagamento registrado",
      detalhe: p.responsavel,
      valorCents: p.valor_cents,
    });
  }

  for (const a of d.aportes) {
    if (!a.data) continue;
    eventos.push({
      data: a.data,
      tipo: "aporte",
      titulo: `Aporte · ${a.responsavel}`,
      detalhe: null,
      valorCents: a.valorCents,
    });
  }

  return eventos.sort((a, b) => a.data.localeCompare(b.data));
}

/** Agrupa os eventos por mês (chave "AAAA-MM"), preservando a ordem por data. */
export function agruparEventosPorMes(eventos: EventoCalendario[]): Map<string, EventoCalendario[]> {
  const porMes = new Map<string, EventoCalendario[]>();
  for (const e of eventos) {
    const ym = ymOf(e.data);
    const arr = porMes.get(ym) ?? [];
    arr.push(e);
    porMes.set(ym, arr);
  }
  return porMes;
}

/** Totais por tipo — usados no resumo do relatório. */
export function totaisPorTipo(eventos: EventoCalendario[]): Record<TipoEvento, { qtde: number; cents: Cents }> {
  const base: Record<TipoEvento, { qtde: number; cents: Cents }> = {
    vencimento: { qtde: 0, cents: 0 },
    pagamento: { qtde: 0, cents: 0 },
    aporte: { qtde: 0, cents: 0 },
  };
  for (const e of eventos) {
    base[e.tipo].qtde += 1;
    base[e.tipo].cents += e.valorCents;
  }
  return base;
}
