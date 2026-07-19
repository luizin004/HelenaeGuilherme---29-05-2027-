import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovoCentroCusto, CentroCustoEdit } from "@/components/admin/CentroCustoForms";
import { listCentrosFull } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function CentrosCustoPage() {
  const centros = await listCentrosFull();

  return (
    <>
      <PageTitle>Centros de custo</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para gerenciar os centros.</Notice>
      ) : (
        <Notice>
          Os grandes blocos do casamento. Cada despesa pode ser classificada num centro (no
          Financeiro). Centros com lançamentos não podem ser excluídos — só inativados.
        </Notice>
      )}

      <Panel title="Novo centro de custo">
        <div className="p-6"><NovoCentroCusto /></div>
      </Panel>

      <Panel title={`Centros (${centros.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["", "Nome", "Orçamento", "Lançamentos", "Previsto", "Situação", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {centros.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Nenhum centro ainda.</td></tr>
              )}
              {centros.map((c) => (
                <tr key={c.id} className={`border-t border-line align-top hover:bg-ivory ${c.ativo ? "" : "opacity-50"}`}>
                  <td className="px-4 py-3"><span className="inline-block h-4 w-4 rounded-full" style={{ background: c.cor ?? "#6f7352" }} /></td>
                  <td className="px-4 py-3 font-medium">{c.nome}</td>
                  <td className="px-4 py-3 text-muted">{c.orcamento_cents !== null ? formatCents(c.orcamento_cents) : "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.lancamentos}</td>
                  <td className="px-4 py-3 font-serif text-moss">{c.previstoCents ? formatCents(c.previstoCents) : "—"}</td>
                  <td className="px-4 py-3">
                    {c.ativo ? (
                      <span className="rounded-full bg-[#e6efe0] px-2.5 py-0.5 text-xs text-success">ativo</span>
                    ) : (
                      <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs text-muted">inativo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CentroCustoEdit c={{ id: c.id, nome: c.nome, cor: c.cor, orcamento_cents: c.orcamento_cents, ativo: c.ativo }} />
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
