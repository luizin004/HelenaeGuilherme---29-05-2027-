import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovoReembolso } from "@/components/admin/NovoReembolso";
import { atualizarStatusReembolso, excluirReembolso } from "@/app/actions/reembolsos";
import { listReembolsos, getPayers } from "@/lib/admin-data";
import { formatCents, sumCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  a_reembolsar: "A reembolsar",
  parcial: "Parcial",
  reembolsado: "Reembolsado",
  compensado: "Compensado",
  cancelado: "Cancelado",
};
const BADGE: Record<string, string> = {
  a_reembolsar: "bg-[#f6ecd6] text-warn",
  parcial: "bg-[#f6ecd6] text-warn",
  reembolsado: "bg-[#e6efe0] text-success",
  compensado: "bg-[#e6efe0] text-success",
  cancelado: "bg-cream text-muted",
};

export default async function ReembolsosPage() {
  const [reembolsos, payers] = await Promise.all([listReembolsos(), getPayers()]);
  const responsaveis = payers.filter((p) => p.nome !== "Gratuito").map((p) => ({ id: p.id, nome: p.nome }));
  const pendentes = reembolsos.filter((r) => r.status === "a_reembolsar" || r.status === "parcial");

  return (
    <>
      <PageTitle>Reembolsos</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para registrar reembolsos.</Notice>
      ) : (
        <Notice>Quando alguém paga no lugar de outro responsável. Controle quem deve acertar com quem.</Notice>
      )}

      <KpiGrid>
        <Kpi label="A reembolsar" value={formatCents(sumCents(pendentes.map((r) => r.valor_cents)))} hint={`${pendentes.length} pendente(s)`} />
        <Kpi label="Total registrado" value={formatCents(sumCents(reembolsos.map((r) => r.valor_cents)))} />
      </KpiGrid>

      <Panel title="Novo reembolso">
        <div className="p-6"><NovoReembolso responsaveis={responsaveis} /></div>
      </Panel>

      <Panel title="Reembolsos">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Data", "Pagou", "Deve reembolsar", "Valor", "Motivo", "Status", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reembolsos.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Nenhum reembolso ainda.</td></tr>
              )}
              {reembolsos.map((r) => (
                <tr key={r.id} className="border-t border-line hover:bg-ivory">
                  <td className="whitespace-nowrap px-4 py-2.5">{fmtDateBR(r.data)}</td>
                  <td className="px-4 py-2.5 font-medium">{r.pagador}</td>
                  <td className="px-4 py-2.5">{r.devedor}</td>
                  <td className="px-4 py-2.5 font-serif text-moss">{formatCents(r.valor_cents)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{r.motivo || "—"}</td>
                  <td className="px-4 py-2.5">
                    <form action={atualizarStatusReembolso} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${BADGE[r.status] ?? "bg-cream text-muted"}`}>{STATUS_LABEL[r.status] ?? r.status}</span>
                      <select name="status" defaultValue={r.status} className="field-input py-1 text-xs">
                        {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <button type="submit" className="text-xs text-olive underline">salvar</button>
                    </form>
                  </td>
                  <td className="px-4 py-2.5">
                    <form action={excluirReembolso}>
                      <input type="hidden" name="id" value={r.id} />
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
