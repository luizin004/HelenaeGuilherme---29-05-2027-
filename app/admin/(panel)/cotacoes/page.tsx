import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovaProposta } from "@/components/admin/NovaProposta";
import { escolherProposta, excluirProposta } from "@/app/actions/quotes";
import { listCotacoes, listSuppliers, type PropostaItem } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function CotacoesPage() {
  const [itens, suppliers] = await Promise.all([listCotacoes(), listSuppliers()]);
  const supplierNome = new Map(suppliers.map((s) => [s.id, s.nome]));
  const fornecedores = suppliers.map((s) => ({ id: s.id, nome: s.nome }));

  const comProposta = itens.filter((i) => i.propostas.length > 0);
  const semProposta = itens.filter((i) => i.propostas.length === 0);
  const escolhidos = comProposta.filter((i) => i.propostas.some((p) => p.escolhida)).length;

  const nomeFornecedor = (p: PropostaItem) =>
    p.fornecedor_nome || (p.supplier_id ? supplierNome.get(p.supplier_id) ?? "—" : "—");

  return (
    <>
      <PageTitle>Cotações & propostas</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para gerenciar cotações.</Notice>
      ) : (
        <Notice>
          Registre propostas de fornecedores por item e compare lado a lado. Ao <strong>escolher</strong>{" "}
          uma proposta, o item vira <strong>contratado</strong> com o valor da proposta e, se houver
          parcelamento, o cronograma é gerado (datas você define em Parcelas). As demais propostas
          ficam como recusadas, mas seguem guardadas.
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Itens" value={itens.length} />
        <Kpi label="Em cotação" value={comProposta.length} hint="com ao menos 1 proposta" />
        <Kpi label="Escolhidos" value={escolhidos} />
      </KpiGrid>

      {comProposta.map((item) => {
        const menor = Math.min(...item.propostas.map((p) => p.valor_cents));
        return (
          <Panel
            key={item.id}
            title={`${item.descricao}${item.categoria ? ` · ${item.categoria}` : ""}${
              item.valor_total_cents !== null ? ` · contratado ${formatCents(item.valor_total_cents)}` : ""
            }`}
          >
            <div className="space-y-3 p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted">
                      <th className="py-2">Fornecedor</th>
                      <th className="py-2">Valor</th>
                      <th className="py-2">Entrada</th>
                      <th className="py-2">Parcelas</th>
                      <th className="py-2">Prazo</th>
                      <th className="py-2">Inclui</th>
                      <th className="py-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.propostas.map((p) => (
                      <tr key={p.id} className={`border-t border-line ${p.escolhida ? "bg-[#eef1e6]" : ""}`}>
                        <td className="py-2 font-medium">
                          {nomeFornecedor(p)}
                          {p.escolhida && <span className="ml-2 rounded-full bg-[#e6efe0] px-2 py-0.5 text-[10px] uppercase text-success">escolhida</span>}
                        </td>
                        <td className="py-2 font-serif text-moss">
                          {formatCents(p.valor_cents)}
                          {p.valor_cents === menor && item.propostas.length > 1 && (
                            <span className="ml-1 text-[10px] uppercase text-olive">menor</span>
                          )}
                        </td>
                        <td className="py-2 text-muted">{p.entrada_cents !== null ? formatCents(p.entrada_cents) : "—"}</td>
                        <td className="py-2 text-muted">{p.parcelas ?? "—"}</td>
                        <td className="py-2 text-muted">{p.prazo || "—"}</td>
                        <td className="py-2 text-xs text-muted">{p.inclui || "—"}</td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {!p.escolhida && (
                              <form action={escolherProposta}>
                                <input type="hidden" name="id" value={p.id} />
                                <button type="submit" className="text-xs text-olive underline">escolher</button>
                              </form>
                            )}
                            <form action={excluirProposta}>
                              <input type="hidden" name="id" value={p.id} />
                              <button type="submit" className="text-xs text-danger underline">excluir</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <NovaProposta expenseId={item.id} fornecedores={fornecedores} />
            </div>
          </Panel>
        );
      })}

      <Panel title={`Itens sem proposta ainda (${semProposta.length})`}>
        <div className="divide-y divide-line">
          {semProposta.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-muted">Todos os itens já têm ao menos uma proposta.</p>
          )}
          {semProposta.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-medium">{item.descricao}</span>
                {item.categoria && <span className="ml-2 text-xs text-muted">{item.categoria}</span>}
              </div>
              <NovaProposta expenseId={item.id} fornecedores={fornecedores} />
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
