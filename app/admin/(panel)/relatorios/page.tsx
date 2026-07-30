import Link from "next/link";
import { Notice, Panel } from "@/components/admin/ui";
import { PageHeader, SummaryCard } from "@/components/admin/finance/ui";
import { carregarConsolidado } from "@/lib/relatorio-consolidado";
import { formatCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const TOM_SITUACAO = {
  coberto: { classe: "bg-[#e6efe0] text-success", rotulo: "Caixa coberto" },
  apertado: { classe: "bg-[#f6ecd6] text-warn", rotulo: "Caixa apertado" },
  descoberto: { classe: "bg-[#f4e2dc] text-danger", rotulo: "Caixa descoberto" },
} as const;

/**
 * Relatórios = a visão CONSOLIDADA. É o espelho do PDF consolidado: cruza
 * Lançamentos, Contas, Fluxo e prazos de contratação e responde o que decide —
 * o caixa cobre o que já foi assumido? o que está vencido? onde o dinheiro
 * está concentrado? O detalhe item a item fica no relatório detalhado.
 */
export default async function RelatoriosPage() {
  const dados = await carregarConsolidado();
  const c = dados.consolidado;
  const tom = TOM_SITUACAO[c.situacao];

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Visão consolidada para decidir — os mesmos números das abas do Financeiro, cruzados e resumidos."
        crumbs={[{ label: "Financeiro", href: "/admin/financeiro-dashboard" }, { label: "Relatórios", href: "/admin/relatorios" }]}
        actions={
          <>
            <Link href="/admin/relatorios/pdf" className="btn btn-dark text-xs">Relatório consolidado (PDF)</Link>
            <Link href="/admin/financeiro/relatorio" className="btn btn-outline text-xs">Relatório detalhado (PDF)</Link>
          </>
        }
      />

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver os relatórios.</Notice>}

      {/* Leitura do caixa — a frase que resume tudo */}
      <div className={`mb-6 rounded-lg px-5 py-4 ${tom.classe}`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em]">{tom.rotulo}</p>
        <p className="mt-1 text-sm leading-relaxed">{dados.leitura}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Aportes (entradas)" value={formatCents(c.aportesCents)} tooltip="Tudo que os responsáveis já colocaram." href="/admin/aportes" />
        <SummaryCard label="Custo conhecido" value={formatCents(c.custoConhecidoCents)} tooltip="Soma dos itens com valor definido (sem cortesias)." href="/admin/financeiro" />
        <SummaryCard label="Pago" value={formatCents(c.pagoCents)} tone="success" tooltip={`${c.execucaoPct}% do custo conhecido já quitado.`} href="/admin/financeiro?t=contas&sec=contas&aba=pagas" />
        <SummaryCard
          label="Sobra após tudo pago"
          value={formatCents(c.saldoAposCompromissosCents)}
          tone={c.saldoAposCompromissosCents < 0 ? "danger" : "success"}
          tooltip="Aportes − custo conhecido. É o que resta se todo o assumido for pago."
          href="/admin/financeiro?t=fluxo"
        />
        <SummaryCard label="Contratado" value={formatCents(c.contratadoCents)} tooltip="Itens já fechados com fornecedor." href="/admin/contratos" />
        <SummaryCard label="Falta contratar" value={formatCents(c.aContratarCents)} tone="warn" tooltip="Custo conhecido que ainda não virou contrato." href="/admin/financeiro?t=cotacoes" />
        <SummaryCard label="Em aberto" value={formatCents(c.pendenteCents)} tone="warn" tooltip="Saldo das contas ainda não pagas." href="/admin/financeiro?t=contas&sec=contas&aba=a_pagar" />
        <SummaryCard label="Vencido" value={formatCents(c.vencidoCents)} tone={c.vencidoCents > 0 ? "danger" : "default"} tooltip="Contas com vencimento no passado." href="/admin/financeiro?t=contas&sec=contas&aba=vencidas" />
      </div>

      {dados.avisos.length > 0 && (
        <Panel title="Pontos de atenção">
          <ul className="divide-y divide-line">
            {dados.avisos.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-6 py-3 text-sm">
                <span className="mt-0.5 text-gold">•</span>
                <span className="text-ink">{a}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Notice>
        <strong>{c.itens.total} itens</strong> no orçamento: {c.itens.comValor} com valor,{" "}
        <strong>{c.itens.semValor} ainda sem valor</strong> (não contam como R$ 0 — o custo total tende
        a subir) e {c.itens.gratuitos} cortesias, que representam {formatCents(c.economiaCents)} de
        economia.
      </Notice>

      <Panel title="Onde o dinheiro está — por classificação">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Classificação", "Previsto", "%", "Contratado", "Pago", "Em aberto"].map((h, i) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap bg-cream px-4 py-3 text-xs font-medium uppercase tracking-wide text-moss ${i > 0 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dados.porClassificacao.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Sem contas classificadas ainda.</td></tr>
              )}
              {dados.porClassificacao.map((l) => (
                <tr key={l.nome} className="border-t border-line hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">{l.nome}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCents(l.previstoCents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{l.pct}%</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-moss">{formatCents(l.contratadoCents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-success">{formatCents(l.pagoCents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-warn">{formatCents(l.abertoCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={`Próximos vencimentos (${dados.proximas.length})`}
          action={<Link href="/admin/financeiro?t=calendario" className="text-xs text-olive underline">calendário</Link>}
        >
          {dados.proximas.length === 0 ? (
            <p className="px-6 py-5 text-sm text-muted">Nada vencendo em breve.</p>
          ) : (
            <ul className="divide-y divide-line">
              {dados.proximas.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-6 py-3 text-sm">
                  <span>
                    <span className="font-medium text-moss">{p.descricao}{p.numero ? ` · ${p.numero}/${p.totalParcelas}` : ""}</span>
                    <span className="ml-2 text-xs text-muted">{p.vencimento ? fmtDateBR(p.vencimento) : "—"}</span>
                  </span>
                  <span className="font-serif text-moss">{formatCents(p.saldoCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title={`Falta contratar (${dados.contratacao.pendentes})`}
          action={<Link href="/admin/evania" className="text-xs text-olive underline">lembretes</Link>}
        >
          <ul className="divide-y divide-line">
            <li className="flex items-center justify-between px-6 py-3 text-sm">
              <span className="text-muted">Passaram do prazo</span>
              <span className={`font-serif ${dados.contratacao.vencidos.length > 0 ? "text-danger" : "text-moss"}`}>
                {dados.contratacao.vencidos.length}
              </span>
            </li>
            <li className="flex items-center justify-between px-6 py-3 text-sm">
              <span className="text-muted">Vencem em até 7 dias</span>
              <span className="font-serif text-moss">{dados.contratacao.semana.length}</span>
            </li>
            <li className="flex items-center justify-between px-6 py-3 text-sm">
              <span className="text-muted">Sem prazo definido</span>
              <span className="font-serif text-moss">{dados.contratacao.semPrazo.length}</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel title="Por responsável">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Responsável", "Assumido", "Pago", "Em aberto", "Vence este mês", "Próximo mês", "Aportes"].map((h, i) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap bg-cream px-4 py-3 text-xs font-medium uppercase tracking-wide text-moss ${i > 0 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dados.porResponsavel.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Nenhum responsável configurado.</td></tr>
              )}
              {dados.porResponsavel.map((r) => (
                <tr key={r.nome} className="border-t border-line hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">{r.nome}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCents(r.assumidoCents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-success">{formatCents(r.pagoCents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-warn">{formatCents(r.abertoCents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCents(r.esteMesCents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCents(r.proxMesCents)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-olive">{formatCents(r.aportesCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Notice>
        Presentes ficam <strong>fora</strong> destes números — entram como receita à parte em
        Presentes. Cortesias contam como economia, nunca como saída de caixa.
      </Notice>
    </>
  );
}
