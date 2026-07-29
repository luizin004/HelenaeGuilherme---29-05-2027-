import { Kpi, KpiGrid, Notice, Panel } from "@/components/admin/ui";
import { NovaDespesa } from "@/components/admin/NovaDespesa";
import { LancamentosTable, type LinhaLancamento } from "@/components/admin/financeiro/LancamentosTable";
import {
  getClassificacoesOptions,
  getExpensePayers,
  getExpensesSummary,
  getFinanceByCostCenter,
  getFinanceByResponsible,
  getGiftTotals,
  getPayers,
  listExpenses,
  listSuppliers,
  listParcelaveis,
  type AggRow,
  type InstallmentItem,
} from "@/lib/admin-data";
import { loadFinance } from "@/lib/finance-core";
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

export async function LancamentosTab() {
  const [summary, expenses, gifts, classificacoes, responsaveis, expensePayers, porResp, porClass, suppliers, parcelaveis, financeData] =
    await Promise.all([
      getExpensesSummary(),
      listExpenses(),
      getGiftTotals(),
      getClassificacoesOptions(),
      getPayers(),
      getExpensePayers(),
      getFinanceByResponsible(),
      getFinanceByCostCenter(),
      listSuppliers(),
      listParcelaveis(),
      loadFinance(),
    ]);
  const nomeClass = new Map(classificacoes.map((c) => [c.id, c.nome]));
  const fornecedores = suppliers.map((s) => s.nome);
  const metodos = financeData.metodos.filter((m) => m.ativo).map((m) => ({ id: m.id, nome: m.nome }));
  const parcelasPorDespesa = new Map<string, { parcelas: InstallmentItem[]; versoes: number }>(
    parcelaveis.map((p) => [p.id, { parcelas: p.parcelas, versoes: p.versoes }]),
  );

  const aPagar = summary.totalOrcadoCents - summary.pagoCents;

  return (
    <>
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
        <ResumoPanel titulo="Por classificação financeira" linhas={porClass} vazio="Sem despesas classificadas ainda." />
      </div>

      <Panel title="Nova despesa">
        <div className="p-6">
          <NovaDespesa fornecedores={fornecedores} />
        </div>
      </Panel>

      <Panel title="Lançamentos">
        <LancamentosTable
          linhas={expenses.map((e): LinhaLancamento => {
            const info = parcelasPorDespesa.get(e.id);
            return {
              d: {
                id: e.id,
                descricao: e.descricao,
                estado: e.estado,
                gratuito: e.gratuito,
                valor_total_cents: e.valor_total_cents,
                observacao: e.observacao,
                categoria: e.categoria,
              },
              classificacaoNome: (e.classification_id && nomeClass.get(e.classification_id)) || e.categoria || "—",
              classificacaoAtual: e.classification_id,
              responsavelAtual: expensePayers[e.id] ?? null,
              temParcelas: (info?.parcelas.length ?? 0) > 0,
              parcelas: info?.parcelas ?? [],
            };
          })}
          classificacoes={classificacoes}
          responsaveis={responsaveis}
          metodos={metodos}
        />
      </Panel>
    </>
  );
}
