import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { getGiftTotals } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function FinanceiroPage() {
  const gifts = await getGiftTotals();

  return (
    <>
      <PageTitle>Financeiro</PageTitle>

      <KpiGrid>
        <Kpi label="Orçamento total" value={brl(0)} />
        <Kpi label="Pago" value={brl(0)} />
        <Kpi label="A pagar" value={brl(0)} />
        <Kpi label="Recebido (presentes)" value={brl(gifts.recebido)} hint={`${gifts.contribuicoes} contribuições`} />
      </KpiGrid>

      <Panel title="Projeção mensal — Maio 2027">
        <div className="p-6">
          <p className="mb-2 text-sm text-muted">Orçado x Realizado</p>
          <div className="h-2 overflow-hidden rounded bg-cream">
            <div className="h-full bg-gradient-to-r from-gold to-olive" style={{ width: "0%" }} />
          </div>
        </div>
      </Panel>

      <Panel title="Lançamentos">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Descrição", "Categoria", "Fornecedor", "Valor", "Vencimento", "Status"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted">
                  Nenhum lançamento ainda. Os lançamentos virão de contratos, parcelas e despesas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <Notice>
        O financeiro integra as tabelas <code>finance_transactions</code>, <code>contract_installments</code>{" "}
        e <code>budget_projections</code>. O CRUD completo entra na Fase 4.
      </Notice>
    </>
  );
}
