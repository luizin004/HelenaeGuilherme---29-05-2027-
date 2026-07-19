import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovoGrupo, GrupoActions } from "@/components/admin/GrupoForms";
import { listGrupos } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const LADO_LABEL: Record<string, string> = { noiva: "Noiva", noivo: "Noivo", ambos: "Ambos" };

export default async function GruposPage() {
  const grupos = await listGrupos();

  return (
    <>
      <PageTitle>Grupos familiares</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para gerenciar os grupos.</Notice>
      ) : (
        <Notice>
          Grupos organizam quem pertence ao mesmo convite. Cada integrante mantém confirmação e QR
          próprios. Vincule convidados a um grupo pela edição na Lista de convidados.
        </Notice>
      )}

      <Panel title="Novo grupo">
        <div className="p-6"><NovoGrupo /></div>
      </Panel>

      <Panel title={`Grupos (${grupos.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Grupo", "Lado", "Integrantes", "Máx.", "Observação", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grupos.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Nenhum grupo ainda. Crie o primeiro acima.</td></tr>
              )}
              {grupos.map((g) => (
                <tr key={g.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="px-4 py-3 font-medium">{g.nome}</td>
                  <td className="px-4 py-3 text-muted">{g.lado ? LADO_LABEL[g.lado] ?? g.lado : "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {g.integrantes}
                    {g.max_convidados && g.integrantes > g.max_convidados && <span className="ml-1 text-xs text-danger">(acima do máx.)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{g.max_convidados ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted">{g.observacao || "—"}</td>
                  <td className="px-4 py-3"><GrupoActions g={g} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
