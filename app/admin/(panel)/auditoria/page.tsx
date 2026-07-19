import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { listAuditLog } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default async function AuditoriaPage() {
  const eventos = await listAuditLog();

  return (
    <>
      <PageTitle>Auditoria</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase para ver a trilha de auditoria.</Notice>}

      <Notice>
        Registro das ações críticas (quem, quando, o quê). Alimentado automaticamente pelas ações do painel.
      </Notice>

      <Panel title="Últimos eventos">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Quando", "Módulo", "Ação", "Registro"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eventos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted">
                    Nenhum evento registrado ainda.
                  </td>
                </tr>
              )}
              {eventos.map((e) => (
                <tr key={e.id} className="border-t border-line hover:bg-ivory">
                  <td className="whitespace-nowrap px-6 py-3 text-muted">{fmt(e.criado_em)}</td>
                  <td className="px-6 py-3">{e.modulo}</td>
                  <td className="px-6 py-3">
                    <span className="inline-block rounded-full bg-cream px-3 py-0.5 text-xs uppercase tracking-wide text-moss">
                      {e.acao}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-muted">{e.registro ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
