import Link from "next/link";
import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovoContrato } from "@/components/admin/NovoContrato";
import { ContratoActions } from "@/components/admin/ContratoActions";
import { UploadContrato } from "@/components/admin/UploadContrato";
import { listContracts, listSuppliers } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BUCKET = "hg-documentos";

export default async function ContratosPage() {
  const [contracts, suppliers] = await Promise.all([listContracts(), listSuppliers()]);
  const supplierName = new Map(suppliers.map((s) => [s.id, s.nome]));

  const supabase = createClient();
  const links = new Map<string, string>();
  if (supabase) {
    await Promise.all(
      contracts
        .filter((c) => c.arquivo_url)
        .map(async (c) => {
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(c.arquivo_url as string, 3600);
          if (data?.signedUrl) links.set(c.id, data.signedUrl);
        }),
    );
  }

  return (
    <>
      <PageTitle>Contratos</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase para cadastrar contratos.</Notice>}

      <Notice>
        Itens marcados como <strong>contratado</strong> (ou <strong>pago</strong>) no{" "}
        <Link href="/admin/financeiro" className="text-olive underline">Financeiro</Link> aparecem aqui
        automaticamente — anexe o arquivo do contrato assinado entre as partes na coluna
        &quot;Arquivo&quot;.
      </Notice>

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
                {["Título", "Fornecedor", "Valor", "Data do evento", "Status", "Arquivo", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted">
                    Nenhum contrato ainda. Cadastre o primeiro acima ou marque um item como
                    &quot;contratado&quot; no Financeiro.
                  </td>
                </tr>
              )}
              {contracts.map((c) => (
                <tr key={c.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="px-6 py-3 font-medium">
                    {c.titulo}
                    {c.expense_id && (
                      <span className="ml-2 inline-block rounded-full bg-cream px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                        via Lançamentos
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted">{c.supplier_id ? supplierName.get(c.supplier_id) ?? "—" : "—"}</td>
                  <td className="px-6 py-3 font-serif text-base text-moss">{formatCents(Math.round(Number(c.valor) * 100))}</td>
                  <td className="px-6 py-3 text-muted">{c.data_evento ?? "—"}</td>
                  <td className="px-6 py-3">
                    <span className="inline-block rounded-full bg-cream px-3 py-0.5 text-xs uppercase tracking-wide text-muted">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col items-start gap-1">
                      {links.has(c.id) && (
                        <a href={links.get(c.id)} target="_blank" rel="noopener" className="text-xs text-olive underline">
                          Baixar
                        </a>
                      )}
                      <UploadContrato contractId={c.id} temArquivo={!!c.arquivo_url} />
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <ContratoActions c={c} fornecedores={suppliers.map((s) => ({ id: s.id, nome: s.nome }))} />
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
