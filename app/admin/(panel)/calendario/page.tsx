import Link from "next/link";
import { Notice, Panel } from "@/components/admin/ui";
import { PageHeader, FinanceStatusBadge, EmptyState } from "@/components/admin/finance/ui";
import { loadFinance, type ContaRow } from "@/lib/finance-core";
import { labelMesPT, ymOf, type ContaStatus } from "@/domain/finance/status";
import { formatCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Evento do calendário — SEMPRE derivado de um lançamento (§17). */
interface Evento {
  data: string;
  tipo: "vencimento" | "pagamento" | "aporte";
  titulo: string;
  detalhe: string | null;
  valorCents: number;
  status?: ContaStatus;
}

const TIPOS = [
  { key: "todos", label: "Tudo" },
  { key: "vencimento", label: "Vencimentos" },
  { key: "pagamento", label: "Pagamentos" },
  { key: "aporte", label: "Aportes" },
] as const;

export default async function CalendarioPage({ searchParams }: { searchParams: { tipo?: string } }) {
  const d = await loadFinance();
  const tipo = (TIPOS.some((t) => t.key === searchParams.tipo) ? searchParams.tipo : "todos") as (typeof TIPOS)[number]["key"];

  const eventos: Evento[] = [];

  // Vencimentos e previsões das contas (parcelas/despesas) — fonte única.
  for (const c of d.contas as ContaRow[]) {
    const data = c.vencimento ?? c.previsao;
    if (!data || c.status === "gratuito") continue;
    eventos.push({
      data,
      tipo: "vencimento",
      titulo: c.descricao + (c.numero ? ` · ${c.numero}/${c.totalParcelas}` : ""),
      detalhe: c.classificacao,
      valorCents: c.saldoCents > 0 ? c.saldoCents : c.valorCents,
      status: c.status,
    });
  }
  // Pagamentos realizados (data real).
  for (const p of d.pagamentos) {
    if (p.estornado_em) continue;
    eventos.push({ data: p.data, tipo: "pagamento", titulo: "Pagamento registrado", detalhe: p.responsavel, valorCents: p.valor_cents });
  }
  // Aportes (entradas).
  for (const a of d.aportes) {
    if (!a.data) continue;
    eventos.push({ data: a.data, tipo: "aporte", titulo: `Aporte · ${a.responsavel}`, detalhe: null, valorCents: a.valorCents });
  }

  const filtrados = eventos
    .filter((e) => tipo === "todos" || e.tipo === tipo)
    .sort((a, b) => a.data.localeCompare(b.data));

  // Agrupa por mês (visão lista mensal).
  const porMes = new Map<string, Evento[]>();
  for (const e of filtrados) {
    const ym = ymOf(e.data);
    const arr = porMes.get(ym) ?? [];
    arr.push(e);
    porMes.set(ym, arr);
  }

  const COR: Record<Evento["tipo"], string> = {
    vencimento: "border-l-warn",
    pagamento: "border-l-success",
    aporte: "border-l-gold",
  };

  return (
    <>
      <PageHeader
        title="Calendário financeiro"
        description="Alimentado automaticamente pelos lançamentos: vencimentos, previsões, pagamentos realizados e aportes — nenhum evento é cadastrado à parte."
        crumbs={[{ label: "Financeiro", href: "/admin/financeiro-dashboard" }, { label: "Calendário", href: "/admin/calendario" }]}
      />

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver o calendário.</Notice>}

      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Filtro de tipo">
        {TIPOS.map((t) => (
          <Link
            key={t.key}
            role="tab"
            aria-selected={tipo === t.key}
            href={`/admin/calendario?tipo=${t.key}`}
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
                      <Link href={e.tipo === "aporte" ? "/admin/aportes" : "/admin/contas?aba=todas"} className="text-sm font-medium text-moss underline-offset-2 hover:underline">
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
