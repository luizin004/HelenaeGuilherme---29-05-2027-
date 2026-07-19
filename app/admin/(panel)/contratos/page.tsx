import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovoContrato } from "@/components/admin/NovoContrato";
import { listContracts, listSuppliers } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  const [contracts, suppliers] = await Promise.all([listContracts(), listSuppliers()]);
  const supplierName = new Map(suppliers.map((s) => [s.id, s.nome]));

  return (
    <>
      <PageTitle>Contratos</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase para cadastrar contratos.</Notice>}

      <Panel title="Novo contrato">
        <div className="p-6">
          <NovoContrato fornecedores={suppliers} />
        </div>
      </Panel>

      <Panel title="Contratos">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Título", "Fornecedor", "Valor", "Data do evento", "Status"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted">
                    Nenhum contrato ainda. Cadastre o primeiro acima.
                  </td>
                </tr>
              )}
              {contracts.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-ivory">
                  <td className="px-6 py-3 font-medium">{c.titulo}</td>
                  <td className="px-6 py-3 text-muted">{c.supplier_id ? supplierName.get(c.supplier_id) ?? "—" : "—"}</td>
                  <td className="px-6 py-3 font-serif text-base text-moss">{formatCents(Math.round(Number(c.valor) * 100))}</td>
                  <td className="px-6 py-3 text-muted">{c.data_evento ?? "—"}</td>
                  <td className="px-6 py-3">
                    <span className="inline-block rounded-full bg-cream px-3 py-0.5 text-xs uppercase tracking-wide text-muted">
                      {c.status}
                    </span>
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
