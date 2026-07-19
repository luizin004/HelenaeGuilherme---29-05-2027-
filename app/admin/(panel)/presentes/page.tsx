/* eslint-disable @next/next/no-img-element */
import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovoPresente } from "@/components/admin/NovoPresente";
import { PresenteEdit } from "@/components/admin/PresenteEdit";
import { atualizarStatusPresente, excluirPresente } from "@/app/actions/gifts";
import { listGifts } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_BADGE: Record<string, string> = {
  disponivel: "bg-[#e6efe0] text-success",
  reservado: "bg-[#f6ecd6] text-warn",
  adquirido: "bg-cream text-muted",
};

export default async function PresentesAdminPage() {
  const gifts = await listGifts();

  return (
    <>
      <PageTitle>Lista de presentes</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase para gerenciar a lista de presentes.</Notice>
      ) : (
        <Notice>Os presentes cadastrados aqui aparecem na página pública <code>/presentes</code>.</Notice>
      )}

      <Panel title="Novo presente">
        <div className="p-6">
          <NovoPresente />
        </div>
      </Panel>

      <Panel title={`Presentes (${gifts.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Presente", "Valor", "Cota", "Status", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gifts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted">
                    Nenhum presente ainda. Adicione o primeiro acima.
                  </td>
                </tr>
              )}
              {gifts.map((g) => (
                <tr key={g.id} className="border-t border-line align-middle hover:bg-ivory">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {g.imagem_url ? (
                        <img src={g.imagem_url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-gold to-olive text-xs">🎁</span>
                      )}
                      <div>
                        <div className="font-medium">{g.nome}</div>
                        {g.descricao && <div className="text-xs text-muted">{g.descricao}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-serif text-olive">{brl(g.preco)}</td>
                  <td className="px-6 py-3 text-muted">{g.permite_cota ? "Sim" : "—"}</td>
                  <td className="px-6 py-3">
                    <form action={atualizarStatusPresente} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={g.id} />
                      <span className={`inline-block rounded-full px-3 py-0.5 text-xs uppercase tracking-wide ${STATUS_BADGE[g.status] ?? "bg-cream text-muted"}`}>
                        {g.status}
                      </span>
                      <select name="status" defaultValue={g.status} className="field-input py-1 text-xs">
                        <option value="disponivel">disponível</option>
                        <option value="reservado">reservado</option>
                        <option value="adquirido">adquirido</option>
                      </select>
                      <button type="submit" className="text-xs text-olive underline">salvar</button>
                    </form>
                  </td>
                  <td className="px-6 py-3 align-top">
                    <div className="flex items-center gap-3">
                      <PresenteEdit
                        g={{ id: g.id, nome: g.nome, descricao: g.descricao, imagem_url: g.imagem_url, preco: g.preco, permite_cota: g.permite_cota }}
                      />
                      <form action={excluirPresente}>
                        <input type="hidden" name="id" value={g.id} />
                        <button type="submit" className="text-xs text-danger underline">excluir</button>
                      </form>
                    </div>
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
