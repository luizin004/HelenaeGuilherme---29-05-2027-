import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { ClassificarDespesa } from "@/components/admin/ClassificarDespesa";
import { NovaDespesa } from "@/components/admin/NovaDespesa";
import { DespesaActions } from "@/components/admin/DespesaActions";
import {
  getCostCenters,
  getExpensePayers,
  getExpensesSummary,
  getFinanceByCostCenter,
  getFinanceByResponsible,
  getGiftTotals,
  getPayers,
  listExpenses,
} from "@/lib/admin-data";
import type { AggRow } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function ResumoPanel({ titulo, linhas, vazio }: { titulo: string; linhas: AggRow[]; vazio: string }) {
  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-card">
      <div className="border-b border-line px-6 py-4 font-serif text-xl text-moss">{titulo}</div>
      {linhas.length === 0 ? (
        <p className="p-6 text-sm text-muted">{vazio}</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-t border-line first:border-0">
                <td className="px-6 py-2.5">{l.nome}</td>
                <td className="px-6 py-2.5 text-right font-serif text-base text-moss">{formatCents(l.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export const dynamic = "force-dynamic";

const ESTADO_BADGE: Record<string, string> = {
  orcado: "bg-[#eef1e6] text-olive",
  contratado: "bg-[#e6efe0] text-success",
  pago: "bg-[#e6efe0] text-success",
  previsto: "bg-[#f6ecd6] text-warn",
  gratuito: "bg-gold-soft text-moss",
};

export default async function FinanceiroPage() {
  const [summary, expenses, gifts, centros, responsaveis, expensePayers, porResp, porCentro] =
    await Promise.all([
      getExpensesSummary(),
      listExpenses(),
      getGiftTotals(),
      getCostCenters(),
      getPayers(),
      getExpensePayers(),
      getFinanceByResponsible(),
      getFinanceByCostCenter(),
    ]);

  const aPagar = summary.totalOrcadoCents - summary.pagoCents;

  return (
    <>
      <PageTitle>Financeiro</PageTitle>

      {!isSupabaseConfigured && (
        <Notice>Conecte o Supabase para ver os lançamentos reais.</Notice>
      )}

      <KpiGrid>
        <Kpi label="Orçado (conhecido)" value={formatCents(summary.totalOrcadoCents)} hint={`${summary.comValor} itens com valor`} />
        <Kpi label="Pago" value={formatCents(summary.pagoCents)} />
        <Kpi label="A pagar" value={formatCents(aPagar)} />
        <Kpi label="Recebido (presentes)" value={formatCents(Math.round(gifts.recebido * 100))} hint={`${gifts.contribuicoes} contribuições`} />
      </KpiGrid>

      <Notice>
        {summary.semValor > 0 && (
          <>
            <strong>{summary.semValor} itens ainda sem valor</strong> (não contam como R$ 0 — regra 11).{" "}
          </>
        )}
        {summary.gratuitos > 0 && <><strong>{summary.gratuitos} itens gratuitos</strong> (não geram parcela).</>}
      </Notice>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <ResumoPanel titulo="Por responsável (desembolso)" linhas={porResp} vazio="Classifique os responsáveis nas despesas." />
        <ResumoPanel titulo="Por centro de custo (orçado)" linhas={porCentro} vazio="Sem despesas classificadas ainda." />
      </div>

      <Panel title="Nova despesa">
        <div className="p-6">
          <NovaDespesa />
        </div>
      </Panel>

      <Panel title="Lançamentos">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Descrição", "Categoria", "Estado", "Valor", "Classificar (centro · responsável)", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted">
                    Faça login para visualizar os lançamentos (dados protegidos por RLS).
                  </td>
                </tr>
              )}
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="px-6 py-3 font-medium">{e.descricao}</td>
                  <td className="px-6 py-3 text-xs text-muted">{e.categoria || "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block rounded-full px-3 py-0.5 text-xs uppercase tracking-wide ${ESTADO_BADGE[e.estado] ?? "bg-cream text-muted"}`}>
                      {e.estado}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 font-serif text-base text-moss">
                    {e.gratuito ? "Gratuito" : e.valor_total_cents === null ? "— a definir" : formatCents(e.valor_total_cents)}
                  </td>
                  <td className="px-6 py-3" title={e.observacao ?? ""}>
                    <ClassificarDespesa
                      expenseId={e.id}
                      centros={centros}
                      responsaveis={responsaveis}
                      centroAtual={e.cost_center_id}
                      responsavelAtual={expensePayers[e.id] ?? null}
                    />
                  </td>
                  <td className="px-6 py-3">
                    <DespesaActions
                      d={{
                        id: e.id,
                        descricao: e.descricao,
                        estado: e.estado,
                        gratuito: e.gratuito,
                        valor_total_cents: e.valor_total_cents,
                        observacao: e.observacao,
                        categoria: e.categoria,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
