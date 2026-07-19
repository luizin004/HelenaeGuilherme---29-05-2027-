import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovoAporte } from "@/components/admin/NovoAporte";
import { excluirAporte } from "@/app/actions/aportes";
import { listAportes, getPayers } from "@/lib/admin-data";
import { formatCents, sumCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function AportesPage() {
  const [aportes, payers] = await Promise.all([listAportes(), getPayers()]);
  const responsaveis = payers.filter((p) => p.nome !== "Gratuito").map((p) => ({ id: p.id, nome: p.nome }));
  const total = sumCents(aportes.map((a) => a.valor_cents));

  return (
    <>
      <PageTitle>Aportes</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para registrar aportes.</Notice>
      ) : (
        <Notice>Entradas de recurso de Helena, Guilherme, Toninho ou terceiros. Alimentam o Fluxo de caixa.</Notice>
      )}

      <KpiGrid>
        <Kpi label="Total aportado" value={formatCents(total)} hint={`${aportes.length} aporte(s)`} />
      </KpiGrid>

      <Panel title="Novo aporte">
        <div className="p-6"><NovoAporte responsaveis={responsaveis} /></div>
      </Panel>

      <Panel title="Aportes">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Data", "Responsável", "Valor", "Finalidade", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aportes.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Nenhum aporte ainda.</td></tr>
              )}
              {aportes.map((a) => (
                <tr key={a.id} className="border-t border-line hover:bg-ivory">
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium">{fmtDateBR(a.data)}</td>
                  <td className="px-4 py-2.5">{a.responsavel}</td>
                  <td className="px-4 py-2.5 font-serif text-success">{formatCents(a.valor_cents)}</td>
                  <td className="px-4 py-2.5 text-muted">{a.finalidade || "—"}</td>
                  <td className="px-4 py-2.5">
                    <form action={excluirAporte}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="text-xs text-danger underline">excluir</button>
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
