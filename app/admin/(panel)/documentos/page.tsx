import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { UploadDocumento } from "@/components/admin/UploadDocumento";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const BUCKET = "hg-documentos";

interface DocRow {
  id: string;
  titulo: string;
  categoria: string | null;
  arquivo_url: string;
  criado_em: string;
}

export default async function DocumentosPage() {
  const supabase = createClient();
  let docs: (DocRow & { link: string | null })[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("hg_documents")
      .select("*")
      .is("deleted_at", null)
      .order("criado_em", { ascending: false });
    docs = await Promise.all(
      ((data ?? []) as DocRow[]).map(async (d) => {
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(d.arquivo_url, 3600);
        return { ...d, link: signed?.signedUrl ?? null };
      }),
    );
  }

  return (
    <>
      <PageTitle>Documentos</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase para enviar documentos.</Notice>}

      <Notice>
        Armazenamento <strong>privado</strong>. Os links de download são temporários (assinados, expiram em 1h).
      </Notice>

      <Panel title="Enviar documento">
        <div className="p-6">
          <UploadDocumento />
        </div>
      </Panel>

      <Panel title="Documentos">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Título", "Categoria", "Arquivo"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-muted">
                    Nenhum documento ainda.
                  </td>
                </tr>
              )}
              {docs.map((d) => (
                <tr key={d.id} className="border-t border-line hover:bg-ivory">
                  <td className="px-6 py-3 font-medium">{d.titulo}</td>
                  <td className="px-6 py-3 text-muted">{d.categoria || "—"}</td>
                  <td className="px-6 py-3">
                    {d.link ? (
                      <a href={d.link} target="_blank" rel="noopener" className="text-olive underline">
                        Baixar
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
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
