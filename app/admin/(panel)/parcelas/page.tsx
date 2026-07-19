import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { GerarParcelas } from "@/components/admin/GerarParcelas";
import { pagarParcela } from "@/app/actions/installments";
import { listParcelaveis } from "@/lib/admin-data";
import { formatCents, sumCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const hojeISO = () => new Date().toISOString().slice(0, 10);

function fmtDate(iso: string | null): string {
  if (!iso) return "sem data";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default async function ParcelasPage() {
  const rows = await listParcelaveis();
  const hoje = hojeISO();

  const todasParcelas = rows.flatMap((r) => r.parcelas);
  const pagoCents = sumCents(todasParcelas.filter((p) => p.pago).map((p) => p.valor_cents));
  const abertoCents = sumCents(todasParcelas.filter((p) => !p.pago).map((p) => p.valor_cents));
  const vencidas = todasParcelas.filter((p) => !p.pago && p.vencimento && p.vencimento < hoje).length;

  return (
    <>
      <PageTitle>Parcelas</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para gerenciar as parcelas.</Notice>
      ) : (
        <Notice>
          As parcelas fecham <strong>exatamente</strong> o total da despesa. Renegociar versiona o
          cronograma anterior (auditado). Parcela sem data nunca fica vencida (regra 5).
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Parcelas pagas" value={formatCents(pagoCents)} />
        <Kpi label="Em aberto" value={formatCents(abertoCents)} />
        <Kpi label="Vencidas" value={String(vencidas)} hint="não pagas com data no passado" />
      </KpiGrid>

      {rows.length === 0 && (
        <Notice>Nenhuma despesa com valor definido. Defina valores no Financeiro para poder parcelar.</Notice>
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
                <GerarParcelas expenseId={r.id} temParcelas={r.parcelas.length > 0} />

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
                            <th className="py-2">Vencimento</th>
                            <th className="py-2">Situação</th>
                            <th className="py-2 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.parcelas.map((p) => {
                            const vencida = !p.pago && p.vencimento && p.vencimento < hoje;
                            return (
                              <tr key={p.id} className="border-t border-line">
                                <td className="py-2">{p.numero}</td>
                                <td className="py-2 font-serif text-moss">{formatCents(p.valor_cents)}</td>
                                <td className="py-2 text-muted">{fmtDate(p.vencimento)}</td>
                                <td className="py-2">
                                  {p.pago ? (
                                    <span className="rounded-full bg-[#e6efe0] px-2.5 py-0.5 text-xs text-success">
                                      pago {p.pago_em ? `· ${fmtDate(p.pago_em)}` : ""}
                                    </span>
                                  ) : vencida ? (
                                    <span className="rounded-full bg-[#f4e2dc] px-2.5 py-0.5 text-xs text-danger">vencida</span>
                                  ) : (
                                    <span className="rounded-full bg-[#f6ecd6] px-2.5 py-0.5 text-xs text-warn">em aberto</span>
                                  )}
                                </td>
                                <td className="py-2 text-right">
                                  <form action={pagarParcela}>
                                    <input type="hidden" name="id" value={p.id} />
                                    <input type="hidden" name="pago" value={p.pago ? "false" : "true"} />
                                    <button type="submit" className="text-xs text-olive underline">
                                      {p.pago ? "estornar" : "marcar pago"}
                                    </button>
                                  </form>
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
