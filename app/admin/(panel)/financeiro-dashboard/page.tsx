import Link from "next/link";
import { Notice, Panel } from "@/components/admin/ui";
import { PageHeader, SummaryCard, EmptyState, Bar, FinanceStatusBadge } from "@/components/admin/finance/ui";
import { ProjecaoMensalView } from "@/components/admin/finance/ProjecaoMensal";
import { loadFinance, dashboardFinanceiro, projetarMensal, type VisaoProjecao } from "@/lib/finance-core";
import { listCortesias } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const VISOES_VALIDAS: VisaoProjecao[] = ["vencimento", "competencia", "pagamento"];

export default async function FinanceiroDashboardPage({ searchParams }: { searchParams: { visao?: string } }) {
  const [d, cortesias] = await Promise.all([loadFinance(), listCortesias()]);
  const economia = cortesias.reduce((n, c) => n + (c.valor_mercado_cents ?? 0), 0);
  const dash = dashboardFinanceiro(d, economia);
  const vazio = d.contas.length === 0;
  const visao = (VISOES_VALIDAS.includes(searchParams.visao as VisaoProjecao) ? searchParams.visao : "vencimento") as VisaoProjecao;
  const proj = projetarMensal(d, visao);

  return (
    <>
      <PageHeader
        title="Dashboard financeiro"
        description="Visão executiva do casamento — todos os números vêm da mesma fonte das telas de Contas, Projeção e Fluxo de caixa. Clique num card para abrir a tela filtrada."
        crumbs={[{ label: "Financeiro", href: "/admin/financeiro-dashboard" }]}
        actions={
          <>
            <Link href="/admin/financeiro" className="btn btn-outline text-xs">Lançamentos</Link>
            <Link href="/admin/financeiro-dashboard/relatorio" className="btn btn-outline text-xs">Baixar relatório (PDF)</Link>
            <Link href="/admin/financeiro?t=contas&sec=contas&aba=a_pagar" className="btn btn-dark text-xs">Contas a pagar</Link>
          </>
        }
      />

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver o painel.</Notice>}

      {vazio ? (
        <Panel title="Comece por aqui">
          <EmptyState title="Ainda não há movimentações financeiras.">
            1. Monte o <Link href="/admin/financeiro?t=orcamento" className="underline">Orçamento</Link> · 2. Registre valores em{" "}
            <Link href="/admin/financeiro" className="underline">Lançamentos</Link> · 3. Compare propostas em{" "}
            <Link href="/admin/financeiro?t=cotacoes" className="underline">Cotações</Link> — o dashboard preenche sozinho.
          </EmptyState>
        </Panel>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Previsto total" value={formatCents(dash.previstoCents)} tooltip="Soma de todas as contas ativas (sem cortesias)." href="/admin/financeiro?t=contas&sec=contas&aba=todas" />
            <SummaryCard label="Contratado" value={formatCents(dash.contratadoCents)} tooltip="Despesas em estado contratado ou pago." href="/admin/financeiro" />
            <SummaryCard label="Pago" value={formatCents(dash.pagoCents)} tone="success" tooltip="Pagamentos válidos registrados (estornos não contam)." href="/admin/financeiro?t=contas&sec=contas&aba=pagas" />
            <SummaryCard label="Pendente" value={formatCents(dash.pendenteCents)} tone="warn" tooltip="Saldo em aberto de todas as contas." href="/admin/financeiro?t=contas&sec=contas&aba=a_pagar" />
            <SummaryCard label="Vencido" value={formatCents(dash.vencidoCents)} tone={dash.vencidoCents > 0 ? "danger" : "default"} tooltip="Saldo pendente com vencimento no passado." href="/admin/financeiro?t=contas&sec=contas&aba=vencidas" />
            <SummaryCard label="Aportes" value={formatCents(dash.aportesCents)} tooltip="Entradas registradas pelos responsáveis." href="/admin/aportes" />
            <SummaryCard
              label="Saldo disponível"
              value={formatCents(dash.saldoDisponivelCents)}
              tone={dash.saldoDisponivelCents < 0 ? "danger" : "success"}
              tooltip="Aportes − pagamentos realizados."
              href="/admin/financeiro?t=fluxo"
            />
            <SummaryCard label="Economia (cortesias)" value={formatCents(dash.economiaCents)} tooltip="Valor de mercado dos itens gratuitos — não é saída de caixa." href="/admin/cortesias" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Gastos por classificação">
              {dash.porClassificacao.length === 0 ? (
                <EmptyState title="Classifique as despesas para ver a distribuição.">
                  Defina a classificação de cada despesa em <Link href="/admin/financeiro" className="underline">Lançamentos</Link>.
                </EmptyState>
              ) : (
                <div className="space-y-3 p-6">
                  {dash.porClassificacao.map((c) => (
                    <div key={c.nome}>
                      <div className="mb-0.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-moss">{c.nome}</span>
                        <span className="text-muted">{formatCents(c.cents)} · {c.pct}%</span>
                      </div>
                      <Bar pct={c.pct} />
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Próximas contas" action={<Link href="/admin/financeiro?t=contas&sec=contas&aba=vencendo" className="text-xs text-olive underline">ver todas</Link>}>
              {dash.proximasContas.length === 0 ? (
                <EmptyState title="Nada vencendo em breve." />
              ) : (
                <ul className="divide-y divide-line">
                  {dash.proximasContas.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-moss">{c.descricao}{c.numero ? ` · ${c.numero}/${c.totalParcelas}` : ""}</p>
                        <p className="text-xs text-muted">{c.vencimento ? fmtDateBR(c.vencimento) : "—"}{c.classificacao ? ` · ${c.classificacao}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-moss">{formatCents(c.saldoCents)}</span>
                        <FinanceStatusBadge status={c.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Contas vencidas" action={<Link href="/admin/financeiro?t=contas&sec=contas&aba=vencidas" className="text-xs text-olive underline">ver todas</Link>}>
              {dash.contasVencidas.length === 0 ? (
                <EmptyState title="Nenhuma conta vencida. 🤍" />
              ) : (
                <ul className="divide-y divide-line">
                  {dash.contasVencidas.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-moss">{c.descricao}</p>
                        <p className="text-xs text-danger">venceu {c.vencimento ? fmtDateBR(c.vencimento) : ""}</p>
                      </div>
                      <span className="font-serif text-danger">{formatCents(c.saldoCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Últimas movimentações" action={<Link href="/admin/contratos" className="text-xs text-olive underline">comprovantes</Link>}>
              {dash.ultimosPagamentos.length === 0 ? (
                <EmptyState title="Nenhum pagamento registrado ainda.">
                  Registre pagamentos em <Link href="/admin/financeiro?t=contas&sec=contas&aba=a_pagar" className="underline">Contas a pagar</Link> — inclusive parciais.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-line">
                  {dash.ultimosPagamentos.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-6 py-3">
                      <div>
                        <p className="text-sm text-moss">{fmtDateBR(p.data)}</p>
                        {p.responsavel && <p className="text-xs text-muted">{p.responsavel}</p>}
                      </div>
                      <span className="font-serif text-success">{formatCents(p.valor_cents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <section className="mt-8">
            <h2 className="mb-1 font-serif text-2xl text-moss">Projeção mensal</h2>
            <p className="mb-4 text-sm text-muted">
              Fluxo mês a mês — previsto, pago, pendente, vencido, entradas e saldo acumulado. Tudo vem da
              mesma fonte das Contas; nada é digitado manualmente.
            </p>
            <ProjecaoMensalView proj={proj} visao={visao} basePath="/admin/financeiro-dashboard" />
          </section>
        </>
      )}
    </>
  );
}
