import Link from "next/link";
import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { pagarParcela } from "@/app/actions/installments";
import { listParcelasDetalhado } from "@/lib/admin-data";
import { formatCents, sumCents } from "@/domain/money";
import { fmtDateBR, hojeISO, diasAte } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ContasAPagarPage() {
  const parcelas = (await listParcelasDetalhado()).filter((p) => !p.pago);
  const hoje = hojeISO();

  // Ordena: com data primeiro (mais próxima), sem data por último.
  parcelas.sort((a, b) => {
    if (a.vencimento && b.vencimento) return a.vencimento.localeCompare(b.vencimento);
    if (a.vencimento) return -1;
    if (b.vencimento) return 1;
    return 0;
  });

  const totalAberto = sumCents(parcelas.map((p) => p.valor_cents));
  const vencidas = parcelas.filter((p) => p.vencimento && p.vencimento < hoje);

  return (
    <>
      <PageTitle>Contas a pagar</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver as contas.</Notice>}

      <KpiGrid>
        <Kpi label="Em aberto" value={formatCents(totalAberto)} hint={`${parcelas.length} parcela(s)`} />
        <Kpi label="Vencidas" value={formatCents(sumCents(vencidas.map((p) => p.valor_cents)))} hint={`${vencidas.length} parcela(s)`} />
        <Kpi label="A vencer" value={formatCents(totalAberto - sumCents(vencidas.map((p) => p.valor_cents)))} />
      </KpiGrid>

      <Panel title="Parcelas em aberto">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Vencimento", "Item", "Categoria", "Responsável", "Valor", "Situação", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parcelas.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Nenhuma conta em aberto.</td></tr>
              )}
              {parcelas.map((p) => {
                const d = diasAte(p.vencimento, hoje);
                const vencida = d !== null && d < 0;
                const hojeVence = d === 0;
                return (
                  <tr key={p.id} className="border-t border-line hover:bg-ivory">
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium">{fmtDateBR(p.vencimento)}</td>
                    <td className="px-4 py-2.5">{p.descricao}{p.is_entrada && <span className="ml-1 text-[10px] uppercase text-olive">entrada</span>}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{p.categoria || "—"}</td>
                    <td className="px-4 py-2.5 text-muted">{p.responsavel}</td>
                    <td className="px-4 py-2.5 font-serif text-moss">{formatCents(p.valor_cents)}</td>
                    <td className="px-4 py-2.5">
                      {vencida ? (
                        <span className="rounded-full bg-[#f4e2dc] px-2.5 py-0.5 text-xs text-danger">vencida {Math.abs(d!)}d</span>
                      ) : hojeVence ? (
                        <span className="rounded-full bg-[#f6ecd6] px-2.5 py-0.5 text-xs text-warn">vence hoje</span>
                      ) : d !== null ? (
                        <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs text-muted">em {d}d</span>
                      ) : (
                        <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs text-muted">sem data</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <form action={pagarParcela}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="pago" value="true" />
                          <button type="submit" className="text-xs text-olive underline">marcar pago</button>
                        </form>
                        <Link href="/admin/comprovantes" className="text-xs text-muted underline">comprovante</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
