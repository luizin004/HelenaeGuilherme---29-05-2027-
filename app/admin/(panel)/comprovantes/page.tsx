import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { UploadComprovante } from "@/components/admin/UploadComprovante";
import { excluirComprovante } from "@/app/actions/comprovantes";
import { listComprovantes } from "@/lib/admin-data";
import { createClient } from "@/lib/supabase/server";
import { formatCents, sumCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const BUCKET = "hg-documentos";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default async function ComprovantesPage() {
  const itens = await listComprovantes();
  const supabase = createClient();

  // URLs assinadas (temporárias) para download seguro.
  const links = new Map<string, string>();
  if (supabase) {
    const todos = itens.flatMap((i) => i.comprovantes.map((c) => c.arquivo_url));
    await Promise.all(
      todos.map(async (path) => {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
        if (data?.signedUrl) links.set(path, data.signedUrl);
      }),
    );
  }

  const totalComp = itens.reduce((n, i) => n + i.comprovantes.length, 0);
  const comAlgum = itens.filter((i) => i.comprovantes.length > 0).length;
  const valorComprovado = sumCents(
    itens.flatMap((i) => i.comprovantes.map((c) => c.valor_cents ?? 0)),
  );

  return (
    <>
      <PageTitle>Comprovantes</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para anexar comprovantes.</Notice>
      ) : (
        <Notice>
          Anexe recibos, notas e comprovantes a cada despesa (armazenamento <strong>privado</strong>,
          links de download expiram em 1h). Ao vincular um comprovante a uma <strong>parcela</strong>,
          ela é marcada como paga automaticamente.
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Comprovantes" value={totalComp} />
        <Kpi label="Despesas com comprovante" value={comAlgum} hint={`de ${itens.length} com valor`} />
        <Kpi label="Valor comprovado" value={formatCents(valorComprovado)} hint="soma dos comprovantes com valor" />
      </KpiGrid>

      {itens.length === 0 && (
        <Notice>Nenhuma despesa com valor definido ainda. Defina valores no Financeiro para anexar comprovantes.</Notice>
      )}

      <div className="grid gap-6">
        {itens.map((item) => (
          <Panel
            key={item.id}
            title={`${item.descricao}${item.categoria ? ` · ${item.categoria}` : ""} · ${formatCents(item.valor_total_cents)}`}
          >
            <div className="space-y-3 p-6">
              {item.comprovantes.length === 0 ? (
                <p className="text-sm text-muted">Nenhum comprovante anexado.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {item.comprovantes.map((c) => {
                    const link = links.get(c.arquivo_url);
                    return (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        <div>
                          <span className="font-medium">{c.titulo || "Comprovante"}</span>
                          {c.valor_cents !== null && <span className="ml-2 text-olive">{formatCents(c.valor_cents)}</span>}
                          {c.data_pagamento && <span className="ml-2 text-xs text-muted">{fmtDate(c.data_pagamento)}</span>}
                          {c.installment_id && <span className="ml-2 rounded-full bg-[#e6efe0] px-2 py-0.5 text-[10px] uppercase text-success">parcela paga</span>}
                          {c.observacao && <span className="ml-2 text-xs text-muted">· {c.observacao}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          {link ? (
                            <a href={link} target="_blank" rel="noopener" className="text-xs text-olive underline">baixar</a>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                          <form action={excluirComprovante}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="path" value={c.arquivo_url} />
                            <button type="submit" className="text-xs text-danger underline">excluir</button>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <UploadComprovante expenseId={item.id} parcelas={item.parcelasAbertas} />
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
