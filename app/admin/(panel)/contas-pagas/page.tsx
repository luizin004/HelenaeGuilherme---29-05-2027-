import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { pagarParcela } from "@/app/actions/installments";
import { listParcelasDetalhado } from "@/lib/admin-data";
import { formatCents, sumCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ContasPagasPage() {
  const parcelas = (await listParcelasDetalhado()).filter((p) => p.pago);
  parcelas.sort((a, b) => (b.pago_em ?? "").localeCompare(a.pago_em ?? ""));

  const totalPago = sumCents(parcelas.map((p) => p.valor_cents));

  return (
    <>
      <PageTitle>Contas pagas</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver o histórico.</Notice>}

      <KpiGrid>
        <Kpi label="Total pago" value={formatCents(totalPago)} hint={`${parcelas.length} parcela(s)`} />
      </KpiGrid>

      <Panel title="Pagamentos realizados">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Pago em", "Item", "Categoria", "Responsável", "Valor", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parcelas.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Nenhum pagamento registrado ainda.</td></tr>
              )}
              {parcelas.map((p) => (
                <tr key={p.id} className="border-t border-line hover:bg-ivory">
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium">{fmtDateBR(p.pago_em)}</td>
                  <td className="px-4 py-2.5">{p.descricao}{p.is_entrada && <span className="ml-1 text-[10px] uppercase text-olive">entrada</span>}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{p.categoria || "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{p.responsavel}</td>
                  <td className="px-4 py-2.5 font-serif text-success">{formatCents(p.valor_cents)}</td>
                  <td className="px-4 py-2.5">
                    <form action={pagarParcela}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="pago" value="false" />
                      <button type="submit" className="text-xs text-danger underline">estornar</button>
                    </form>
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
