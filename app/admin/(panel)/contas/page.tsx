import Link from "next/link";
import { Notice, Panel } from "@/components/admin/ui";
import { PageHeader, FinanceStatusBadge, SummaryCard, EmptyState } from "@/components/admin/finance/ui";
import { PagamentoForm } from "@/components/admin/finance/PagamentoForm";
import { estornarPagamento } from "@/app/actions/pagamentos";
import { loadFinance, filtrarAba, contarAbas, type AbaConta } from "@/lib/finance-core";
import { formatCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const ABAS: { key: AbaConta; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "a_pagar", label: "A pagar" },
  { key: "vencendo", label: "Vencendo" },
  { key: "vencidas", label: "Vencidas" },
  { key: "parciais", label: "Parcialmente pagas" },
  { key: "pagas", label: "Pagas" },
  { key: "canceladas", label: "Canceladas" },
];

export default async function ContasPage({ searchParams }: { searchParams: { aba?: string } }) {
  const d = await loadFinance();
  const aba = (ABAS.some((a) => a.key === searchParams.aba) ? searchParams.aba : "a_pagar") as AbaConta;
  const contagens = contarAbas(d.contas, d.hoje);
  const linhas = filtrarAba(d.contas, aba, d.hoje).sort((a, b) => {
    const da = a.vencimento ?? a.previsao ?? "9999-99-99";
    const db = b.vencimento ?? b.previsao ?? "9999-99-99";
    return da.localeCompare(db);
  });

  const totalAba = linhas.reduce((n, c) => n + c.valorCents, 0);
  const saldoAba = linhas.reduce((n, c) => n + c.saldoCents, 0);
  const pagoAba = linhas.reduce((n, c) => n + c.pagoCents, 0);

  const metodos = d.metodos.filter((m) => m.ativo).map((m) => ({ id: m.id, nome: m.nome }));
  const contasFin = d.contasFinanceiras.filter((c) => c.ativo).map((c) => ({ id: c.id, nome: c.nome }));

  // Pagamentos da despesa (histórico) por conta exibida.
  const paysPorChave = new Map<string, typeof d.pagamentos>();
  for (const p of d.pagamentos) {
    const chave = p.installment_id ?? `exp:${p.expense_id}`;
    const arr = paysPorChave.get(chave) ?? [];
    arr.push(p);
    paysPorChave.set(chave, arr);
  }

  return (
    <>
      <PageHeader
        title="Contas"
        description="Todas as obrigações financeiras numa única fonte: uma conta paga não é copiada — o mesmo registro muda de aba conforme o status."
        crumbs={[{ label: "Financeiro", href: "/admin/financeiro-dashboard" }, { label: "Contas", href: "/admin/contas" }]}
      />

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver as contas.</Notice>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total na aba" value={formatCents(totalAba)} hint={`${linhas.length} conta(s)`} tooltip="Soma do valor das contas exibidas nesta aba." />
        <SummaryCard label="Pago" value={formatCents(pagoAba)} tone="success" tooltip="Soma dos pagamentos válidos (estornos não contam)." />
        <SummaryCard label="Saldo pendente" value={formatCents(saldoAba)} tone={saldoAba > 0 ? "warn" : "default"} tooltip="Valor − pago. Nunca negativo." />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Abas de contas">
        {ABAS.map((a) => (
          <Link
            key={a.key}
            role="tab"
            aria-selected={aba === a.key}
            href={`/admin/contas?aba=${a.key}`}
            className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-wide transition ${
              aba === a.key ? "bg-moss text-white" : "bg-white text-muted shadow-card hover:text-moss"
            }`}
          >
            {a.label}
            <span className="ml-1.5 opacity-70">{contagens[a.key]}</span>
          </Link>
        ))}
      </div>

      <Panel title={ABAS.find((a) => a.key === aba)?.label ?? "Contas"}>
        {linhas.length === 0 ? (
          <EmptyState title="Nada por aqui.">
            {aba === "vencidas" ? "Nenhuma conta vencida — tudo em dia. 🤍" : "Cadastre despesas em Lançamentos ou contrate uma proposta em Cotações."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {["Vencimento", "Descrição", "Classificação", "Parcela", "Valor", "Pago", "Saldo", "Status", "Ações"].map((h) => (
                    <th key={h} className="sticky top-0 whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((c) => {
                  const pays = (paysPorChave.get(c.installmentId ?? `exp:${c.expenseId}`) ?? []).filter((p) => !p.estornado_em);
                  return (
                    <tr key={c.id} className="border-t border-line align-top hover:bg-ivory">
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                        {c.vencimento ? fmtDateBR(c.vencimento) : c.previsao ? `~${fmtDateBR(c.previsao)}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-moss">
                        {c.descricao}
                        {c.fornecedor && <div className="text-xs font-normal text-muted">{c.fornecedor}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">{c.classificacao ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {c.numero ? `${c.numero}/${c.totalParcelas}` : "única"}
                        {c.isEntrada && <span className="ml-1 text-[10px] uppercase text-olive">entrada</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-serif text-moss">{formatCents(c.valorCents)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-success">{c.pagoCents ? formatCents(c.pagoCents) : "—"}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-warn">{c.saldoCents ? formatCents(c.saldoCents) : "—"}</td>
                      <td className="px-4 py-2.5"><FinanceStatusBadge status={c.status} /></td>
                      <td className="px-4 py-2.5">
                        {c.saldoCents > 0 && c.status !== "gratuito" ? (
                          <PagamentoForm
                            expenseId={c.expenseId}
                            installmentId={c.installmentId}
                            saldoCents={c.saldoCents}
                            hoje={d.hoje}
                            metodos={metodos}
                            contas={contasFin}
                          />
                        ) : pays.length > 0 ? (
                          <details className="text-xs text-muted">
                            <summary className="cursor-pointer underline">histórico ({pays.length})</summary>
                            <ul className="mt-1 space-y-1">
                              {pays.map((p) => (
                                <li key={p.id} className="flex items-center gap-2">
                                  {fmtDateBR(p.data)} · {formatCents(p.valor_cents)}
                                  <form action={estornarPagamento}>
                                    <input type="hidden" name="id" value={p.id} />
                                    <button type="submit" className="text-danger underline">estornar</button>
                                  </form>
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-3 text-xs text-muted">
        Pagamentos parciais são permitidos — uma conta de R$ 5.000,00 pode receber R$ 2.000,00 + R$ 1.500,00 + R$ 1.500,00.
        O histórico fica no botão &quot;histórico&quot; e um estorno devolve o saldo pendente.
      </p>
    </>
  );
}
