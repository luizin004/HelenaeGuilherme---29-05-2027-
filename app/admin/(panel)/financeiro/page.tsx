import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { getExpensesSummary, getGiftTotals, listExpenses } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const ESTADO_BADGE: Record<string, string> = {
  orcado: "bg-[#eef1e6] text-olive",
  contratado: "bg-[#e6efe0] text-success",
  pago: "bg-[#e6efe0] text-success",
  previsto: "bg-[#f6ecd6] text-warn",
  gratuito: "bg-gold-soft text-moss",
};

export default async function FinanceiroPage() {
  const [summary, expenses, gifts] = await Promise.all([
    getExpensesSummary(),
    listExpenses(),
    getGiftTotals(),
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

      <Panel title="Lançamentos">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Descrição", "Estado", "Valor", "Observações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted">
                    Faça login para visualizar os lançamentos (dados protegidos por RLS).
                  </td>
                </tr>
              )}
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="px-6 py-3 font-medium">{e.descricao}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block rounded-full px-3 py-0.5 text-xs uppercase tracking-wide ${ESTADO_BADGE[e.estado] ?? "bg-cream text-muted"}`}>
                      {e.estado}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 font-serif text-base text-moss">
                    {e.gratuito ? "Gratuito" : e.valor_total_cents === null ? "— a definir" : formatCents(e.valor_total_cents)}
                  </td>
                  <td className="max-w-md px-6 py-3 text-xs text-muted">{e.observacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
