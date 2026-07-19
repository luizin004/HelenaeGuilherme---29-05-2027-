import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { atualizarStatusLead, excluirLead } from "@/app/actions/leads";
import { listLeads } from "@/lib/admin-data";
import { fmtDateBR } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo", em_contato: "Em contato", visita_agendada: "Visita agendada", ganho: "Ganho", perdido: "Perdido",
};
const BADGE: Record<string, string> = {
  novo: "bg-[#f6ecd6] text-warn", em_contato: "bg-[#eef1e6] text-olive", visita_agendada: "bg-[#e6efe0] text-success",
  ganho: "bg-[#e6efe0] text-success", perdido: "bg-cream text-muted",
};

export default async function LeadsPage() {
  const leads = await listLeads();
  const novos = leads.filter((l) => l.status === "novo").length;

  return (
    <>
      <PageTitle>Leads (Rancho das Águas)</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para ver os contatos.</Notice>
      ) : (
        <Notice>Contatos recebidos pelo site do <strong>Rancho das Águas</strong> (<code>/rancho</code>) — pedidos de orçamento e visita.</Notice>
      )}

      <KpiGrid>
        <Kpi label="Total de leads" value={leads.length} />
        <Kpi label="Novos" value={novos} />
        <Kpi label="Querem visita" value={leads.filter((l) => l.deseja_visita).length} />
      </KpiGrid>

      <Panel title="Contatos">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Quando", "Nome", "Contato", "Evento", "Data", "Conv.", "Visita", "Status", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted">Nenhum lead ainda.</td></tr>
              )}
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">{fmtDateBR(l.criado_em.slice(0, 10))}</td>
                  <td className="px-4 py-2.5 font-medium">{l.nome}{l.mensagem && <div className="text-xs text-muted">{l.mensagem}</div>}</td>
                  <td className="px-4 py-2.5 text-muted">{l.telefone || l.email || "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{l.tipo_evento || "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{l.data_prevista || "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{l.convidados_aprox || "—"}</td>
                  <td className="px-4 py-2.5">{l.deseja_visita ? "✓" : "—"}</td>
                  <td className="px-4 py-2.5">
                    <form action={atualizarStatusLead} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={l.id} />
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${BADGE[l.status] ?? "bg-cream text-muted"}`}>{STATUS_LABEL[l.status] ?? l.status}</span>
                      <select name="status" defaultValue={l.status} className="field-input py-1 text-xs">
                        {Object.entries(STATUS_LABEL).map(([k, val]) => <option key={k} value={k}>{val}</option>)}
                      </select>
                      <button type="submit" className="text-xs text-olive underline">salvar</button>
                    </form>
                  </td>
                  <td className="px-4 py-2.5">
                    <form action={excluirLead}>
                      <input type="hidden" name="id" value={l.id} />
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
