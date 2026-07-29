import Link from "next/link";
import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { definirValorMercado } from "@/app/actions/expenses";
import { listCortesias } from "@/lib/admin-data";
import { formatCents, sumCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MoneyInput } from "@/components/admin/MoneyInput";

export const dynamic = "force-dynamic";

export default async function CortesiasPage() {
  const cortesias = await listCortesias();
  const economia = sumCents(cortesias.map((c) => c.valor_mercado_cents ?? 0));

  return (
    <>
      <PageTitle>Itens gratuitos & cortesias</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para gerenciar as cortesias.</Notice>
      ) : (
        <Notice>
          Itens marcados como <strong>gratuito</strong> no{" "}
          <Link href="/admin/financeiro" className="text-olive underline">Financeiro</Link> aparecem aqui.
          Registre o <strong>valor de mercado</strong> para calcular a economia — sem gerar desembolso
          (regra: gratuito não sai do caixa).
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Itens gratuitos" value={cortesias.length} />
        <Kpi label="Economia estimada" value={formatCents(economia)} hint="soma dos valores de mercado" />
      </KpiGrid>

      <Panel title="Cortesias">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Item", "Categoria", "Valor de mercado", "Desembolso"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cortesias.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">Nenhum item gratuito. Marque uma despesa como &quot;gratuito&quot; no Financeiro.</td></tr>
              )}
              {cortesias.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">{c.descricao}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{c.categoria || "—"}</td>
                  <td className="px-4 py-2.5">
                    <form action={definirValorMercado} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <MoneyInput name="valor_mercado" defaultValueCents={c.valor_mercado_cents} placeholder="R$ 0,00" className="field-input w-32 py-1 text-sm" />
                      <button type="submit" className="text-xs text-olive underline">salvar</button>
                    </form>
                  </td>
                  <td className="px-4 py-2.5 text-success">R$ 0,00</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
