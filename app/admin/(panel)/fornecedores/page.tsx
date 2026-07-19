import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovoFornecedor } from "@/components/admin/NovoFornecedor";
import { FornecedorActions } from "@/components/admin/FornecedorActions";
import { listSuppliers } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  prospeccao: "bg-[#f6ecd6] text-warn",
  negociando: "bg-[#f6ecd6] text-warn",
  contratado: "bg-[#e6efe0] text-success",
  concluido: "bg-[#e6efe0] text-success",
  cancelado: "bg-[#f4e2dc] text-danger",
};

export default async function FornecedoresPage() {
  const suppliers = await listSuppliers();

  return (
    <>
      <PageTitle>Fornecedores</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase para cadastrar fornecedores.</Notice>}

      <Panel title="Novo fornecedor">
        <div className="p-6">
          <NovoFornecedor />
        </div>
      </Panel>

      <Panel title="Fornecedores">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Nome", "Categoria", "Contato", "Status", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted">
                    Nenhum fornecedor ainda. Cadastre o primeiro acima.
                  </td>
                </tr>
              )}
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="px-6 py-3 font-medium">{s.nome}</td>
                  <td className="px-6 py-3 text-muted">{s.categoria || "—"}</td>
                  <td className="px-6 py-3 text-muted">{s.contato_nome || s.telefone || s.email || "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block rounded-full px-3 py-0.5 text-xs uppercase tracking-wide ${STATUS_BADGE[s.status] ?? "bg-cream text-muted"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <FornecedorActions f={s} />
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
