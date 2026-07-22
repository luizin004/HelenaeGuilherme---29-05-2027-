import { Notice, Panel } from "@/components/admin/ui";
import { PageHeader, SummaryCard, FinanceStatusBadge } from "@/components/admin/finance/ui";
import { PagamentoForm } from "@/components/admin/finance/PagamentoForm";
import { GerarParcelas } from "@/components/admin/GerarParcelas";
import { atualizarVencimentoParcela } from "@/app/actions/installments";
import { listParcelaveis, getPayers } from "@/lib/admin-data";
import { loadFinance, type ContaRow } from "@/lib/finance-core";
import { formatCents, sumCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ParcelasPage() {
  const [rows, d, payers] = await Promise.all([listParcelaveis(), loadFinance(), getPayers()]);
  const responsaveis = payers.filter((p) => p.nome !== "Gratuito");

  // Estado calculado de cada parcela vem da FONTE ÚNICA (pagamentos parciais incluídos).
  const porParcela = new Map<string, ContaRow>();
  for (const c of d.contas) if (c.installmentId) porParcela.set(c.installmentId, c);

  const parcelas = [...porParcela.values()];
  const pagoCents = parcelas.reduce((n, c) => n + c.pagoCents, 0);
  const abertoCents = parcelas.reduce((n, c) => n + c.saldoCents, 0);
  const vencidas = parcelas.filter((c) => c.status === "vencido").length;

  const metodos = d.metodos.filter((m) => m.ativo).map((m) => ({ id: m.id, nome: m.nome }));
  const contasFin = d.contasFinanceiras.filter((c) => c.ativo).map((c) => ({ id: c.id, nome: c.nome }));

  return (
    <>
      <PageHeader
        title="Parcelas"
        description="Visão consolidada dos cronogramas — mesma fonte de Contas, Projeção e Fluxo. As parcelas fecham exatamente o total e aceitam pagamento parcial."
        crumbs={[{ label: "Financeiro", href: "/admin/financeiro-dashboard" }, { label: "Parcelas", href: "/admin/parcelas" }]}
      />

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para gerenciar as parcelas.</Notice>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Pago" value={formatCents(pagoCents)} tone="success" tooltip="Pagamentos válidos registrados nas parcelas." href="/admin/contas?aba=pagas" />
        <SummaryCard label="Em aberto" value={formatCents(abertoCents)} tone="warn" tooltip="Saldo pendente de todas as parcelas." href="/admin/contas?aba=a_pagar" />
        <SummaryCard label="Vencidas" value={String(vencidas)} tone={vencidas > 0 ? "danger" : "default"} tooltip="Parcelas com saldo e vencimento no passado." href="/admin/contas?aba=vencidas" />
      </div>

      {rows.length === 0 && (
        <Notice>Nenhuma despesa com valor definido. Defina valores em Lançamentos para poder parcelar.</Notice>
      )}

      <div className="grid gap-6">
        {rows.map((r) => {
          const somaParcelas = sumCents(r.parcelas.map((p) => p.valor_cents));
          const fechaExato = r.parcelas.length > 0 && somaParcelas === r.valor_total_cents;
          return (
            <Panel
              key={r.id}
              title={`${r.descricao} · ${formatCents(r.valor_total_cents)}${r.versoes > 0 ? ` · v${r.versoes + 1}` : ""}`}
            >
              <div className="space-y-4 p-6">
                <GerarParcelas expenseId={r.id} temParcelas={r.parcelas.length > 0} metodos={metodos} responsaveis={responsaveis} />

                {r.parcelas.length === 0 ? (
                  <p className="text-sm text-muted">Sem cronograma. Gere as parcelas acima.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-muted">
                            <th className="py-2">#</th>
                            <th className="py-2">Valor</th>
                            <th className="py-2">Pago</th>
                            <th className="py-2">Saldo</th>
                            <th className="py-2">Vencimento</th>
                            <th className="py-2">Status</th>
                            <th className="py-2 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.parcelas.map((p) => {
                            const c = porParcela.get(p.id);
                            return (
                              <tr key={p.id} className="border-t border-line align-top">
                                <td className="py-2">{p.numero}</td>
                                <td className="py-2 font-serif text-moss">{formatCents(p.valor_cents)}</td>
                                <td className="py-2 text-success">{c?.pagoCents ? formatCents(c.pagoCents) : "—"}</td>
                                <td className="py-2 text-warn">{c?.saldoCents ? formatCents(c.saldoCents) : "—"}</td>
                                <td className="py-2">
                                  <form action={atualizarVencimentoParcela} className="flex items-center gap-1">
                                    <input type="hidden" name="id" value={p.id} />
                                    <input type="date" name="vencimento" defaultValue={p.vencimento ?? ""} className="field-input py-1 text-xs" aria-label={`Vencimento da parcela ${p.numero}`} />
                                    <button type="submit" className="text-xs text-olive underline">salvar</button>
                                  </form>
                                </td>
                                <td className="py-2">{c ? <FinanceStatusBadge status={c.status} /> : "—"}</td>
                                <td className="py-2 text-right">
                                  {c && c.saldoCents > 0 ? (
                                    <div className="inline-block text-left">
                                      <PagamentoForm
                                        expenseId={c.expenseId}
                                        installmentId={p.id}
                                        saldoCents={c.saldoCents}
                                        hoje={d.hoje}
                                        metodos={metodos}
                                        contas={contasFin}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted">quitada</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className={`text-xs ${fechaExato ? "text-olive" : "text-danger"}`}>
                      Soma das parcelas: {formatCents(somaParcelas)} — {fechaExato ? "fecha exato ✓" : "não fecha o total!"}
                    </p>
                  </>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
