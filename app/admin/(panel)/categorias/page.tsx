import Link from "next/link";
import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { CategoriaRename } from "@/components/admin/CategoriaRename";
import { getCategoriasResumo } from "@/lib/admin-data";
import { TOTAL_ITENS_CATALOGO } from "@/domain/orcamento/catalogo";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const cats = await getCategoriasResumo();

  return (
    <>
      <PageTitle>Categorias</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para gerenciar categorias.</Notice>
      ) : (
        <Notice>
          Categorias em uso nas despesas. Renomeie para padronizar (ou mesclar: se o novo nome já
          existir, os itens se juntam). Novas categorias nascem ao classificar despesas no{" "}
          <Link href="/admin/financeiro" className="text-olive underline">Financeiro</Link> ou pelo{" "}
          <Link href="/admin/orcamento" className="text-olive underline">Montar orçamento</Link>{" "}
          (catálogo com {TOTAL_ITENS_CATALOGO} itens).
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Categorias em uso" value={cats.length} />
        <Kpi label="Previsto total" value={formatCents(cats.reduce((n, c) => n + c.previstoCents, 0))} />
      </KpiGrid>

      <Panel title="Categorias">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Categoria", "Itens", "Previsto", "Pago", "Renomear / mesclar"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Nenhuma categoria em uso ainda.</td></tr>
              )}
              {cats.map((c) => (
                <tr key={c.categoria} className="border-t border-line hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">{c.categoria}</td>
                  <td className="px-4 py-2.5 text-muted">{c.itens}</td>
                  <td className="px-4 py-2.5 font-serif text-moss">{formatCents(c.previstoCents)}</td>
                  <td className="px-4 py-2.5 text-success">{formatCents(c.pagoCents)}</td>
                  <td className="px-4 py-2.5"><CategoriaRename de={c.categoria} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
