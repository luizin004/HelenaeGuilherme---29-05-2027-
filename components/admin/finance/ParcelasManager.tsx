import { Panel } from "@/components/admin/ui";
import { SummaryCard, FinanceStatusBadge } from "@/components/admin/finance/ui";
import { PagamentoForm } from "@/components/admin/finance/PagamentoForm";
import { GerarParcelas } from "@/components/admin/GerarParcelas";
import { atualizarVencimentoParcela } from "@/app/actions/installments";
import type { ParcelavelRow, Option } from "@/lib/admin-data";
import type { ContaRow } from "@/lib/finance-core";
import { formatCents, sumCents } from "@/domain/money";

/**
 * Cronograma de parcelas por despesa — mesma fonte de Contas/Projeção/Fluxo.
 * Vive dentro de Contas (sub-aba "Parcelas"); as parcelas fecham exatamente o
 * total e aceitam pagamento parcial. Cada data pode ser ajustada individualmente.
 */
export function ParcelasManager({
  rows,
  contas,
  hoje,
  metodos,
  contasFin,
  responsaveis,
}: {
  rows: ParcelavelRow[];
  contas: ContaRow[];
  hoje: string;
  metodos: { id: string; nome: string }[];
  contasFin: { id: string; nome: string }[];
  responsaveis: Option[];
}) {
  const porParcela = new Map<string, ContaRow>();
  for (const c of contas) if (c.installmentId) porParcela.set(c.installmentId, c);

  const parcelas = [...porParcela.values()];
  const pagoCents = parcelas.reduce((n, c) => n + c.pagoCents, 0);
  const abertoCents = parcelas.reduce((n, c) => n + c.saldoCents, 0);
  const vencidas = parcelas.filter((c) => c.status === "vencido").length;

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Pago" value={formatCents(pagoCents)} tone="success" tooltip="Pagamentos válidos registrados nas parcelas." href="/admin/financeiro?t=contas&sec=contas&aba=pagas" />
        <SummaryCard label="Em aberto" value={formatCents(abertoCents)} tone="warn" tooltip="Saldo pendente de todas as parcelas." href="/admin/financeiro?t=contas&sec=contas&aba=a_pagar" />
        <SummaryCard label="Vencidas" value={String(vencidas)} tone={vencidas > 0 ? "danger" : "default"} tooltip="Parcelas com saldo e vencimento no passado." href="/admin/financeiro?t=contas&sec=contas&aba=vencidas" />
      </div>

      {rows.length === 0 && (
        <p className="rounded-lg bg-cream px-4 py-3 text-sm text-muted">
          Nenhuma despesa com valor definido. Defina valores em Lançamentos para poder parcelar.
        </p>
      )}

      <div className="grid gap-6">
        {rows.map((r) => {
          const somaParcelas = sumCents(r.parcelas.map((p) => p.valor_cents));
          const fechaExato = r.parcelas.length > 0 && somaParcelas === r.valor_total_cents;
          return (
            <Panel key={r.id} title={`${r.descricao} · ${formatCents(r.valor_total_cents)}${r.versoes > 0 ? ` · v${r.versoes + 1}` : ""}`}>
              <div className="space-y-4 p-6">
                <GerarParcelas
                  expenseId={r.id}
                  temParcelas={r.parcelas.length > 0}
                  metodos={metodos}
                  responsaveis={responsaveis}
                  totalCents={r.valor_total_cents}
                />

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
                                        hoje={hoje}
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
