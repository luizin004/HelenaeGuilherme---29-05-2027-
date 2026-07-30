import Link from "next/link";
import { Notice, Panel } from "@/components/admin/ui";
import { FinanceStatusBadge, EmptyState } from "@/components/admin/finance/ui";
import { loadFinance } from "@/lib/finance-core";
import { labelMesPT } from "@/domain/finance/status";
import { agruparEventosPorMes, montarEventos, type TipoEvento } from "@/domain/finance/calendario";
import { formatCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const TIPOS = [
  { key: "todos", label: "Tudo" },
  { key: "vencimento", label: "Vencimentos" },
  { key: "pagamento", label: "Pagamentos" },
  { key: "aporte", label: "Aportes" },
] as const;

const COR: Record<TipoEvento, string> = {
  vencimento: "border-l-warn",
  pagamento: "border-l-success",
  aporte: "border-l-gold",
};

/**
 * Agenda financeira dentro do Financeiro — vencimentos, pagamentos e aportes
 * derivados dos lançamentos (§17). Mesma fonte do relatório em PDF.
 */
export async function CalendarioTab({ searchParams }: { searchParams: { tipo?: string } }) {
  const d = await loadFinance();
  const tipo = (TIPOS.some((t) => t.key === searchParams.tipo) ? searchParams.tipo : "todos") as (typeof TIPOS)[number]["key"];

  const eventos = montarEventos(d).filter((e) => tipo === "todos" || e.tipo === tipo);
  const porMes = agruparEventosPorMes(eventos);

  return (
    <>
      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver o calendário.</Notice>}

      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Filtro de tipo">
        {TIPOS.map((t) => (
          <Link
            key={t.key}
            role="tab"
            aria-selected={tipo === t.key}
            href={`/admin/financeiro?t=calendario&tipo=${t.key}`}
            className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-wide transition ${
              tipo === t.key ? "bg-moss text-white" : "bg-white text-muted shadow-card hover:text-moss"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-4 text-[11px] text-muted">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-warn align-middle" />vencimento/previsão</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-success align-middle" />pagamento realizado</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-gold align-middle" />aporte (entrada)</span>
      </div>

      {porMes.size === 0 ? (
        <Panel title="Agenda">
          <EmptyState title="Nenhum evento financeiro ainda.">
            Cadastre despesas com vencimento, registre pagamentos ou aportes — o calendário preenche sozinho.
          </EmptyState>
        </Panel>
      ) : (
        [...porMes.entries()].map(([ym, evs]) => (
          <Panel key={ym} title={labelMesPT(ym)}>
            <ul className="divide-y divide-line">
              {evs.map((e, i) => (
                <li key={i} className={`flex flex-wrap items-center justify-between gap-3 border-l-[3px] px-5 py-3 ${COR[e.tipo]}`}>
                  <div className="flex items-center gap-4">
                    <span className="w-24 shrink-0 text-sm text-muted">{fmtDateBR(e.data)}</span>
                    <div>
                      <Link
                        href={e.tipo === "aporte" ? "/admin/aportes" : "/admin/financeiro?t=contas&sec=contas&aba=todas"}
                        className="text-sm font-medium text-moss underline-offset-2 hover:underline"
                      >
                        {e.titulo}
                      </Link>
                      {e.detalhe && <p className="text-xs text-muted">{e.detalhe}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-serif ${e.tipo === "aporte" ? "text-gold" : e.tipo === "pagamento" ? "text-success" : "text-moss"}`}>
                      {e.tipo === "aporte" ? "+" : ""}{formatCents(e.valorCents)}
                    </span>
                    {e.status && <FinanceStatusBadge status={e.status} />}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        ))
      )}
    </>
  );
}
