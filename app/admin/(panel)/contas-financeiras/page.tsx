import { Notice, Panel } from "@/components/admin/ui";
import { PageHeader } from "@/components/admin/finance/ui";
import { ContaFinanceiraForm } from "@/components/admin/finance/ContaFinanceiraForm";
import { alternarContaFinanceira } from "@/app/actions/finance-config";
import { loadFinance } from "@/lib/finance-core";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  conta: "Conta bancária",
  carteira: "Carteira",
  cartao_credito: "Cartão de crédito",
  poupanca: "Poupança",
  outro: "Outro",
};

export default async function ContasFinanceirasPage() {
  const d = await loadFinance();

  // Movimento por conta = pagamentos válidos vinculados a ela.
  const saidas = new Map<string, number>();
  for (const p of d.pagamentos) {
    if (p.estornado_em || !p.conta_id) continue;
    saidas.set(p.conta_id, (saidas.get(p.conta_id) ?? 0) + p.valor_cents);
  }

  return (
    <>
      <PageHeader
        title="Contas financeiras"
        description="De onde o dinheiro sai: contas, carteiras e cartões. O saldo considera o saldo inicial menos os pagamentos vinculados."
        crumbs={[{ label: "Financeiro", href: "/admin/financeiro-dashboard" }, { label: "Contas financeiras", href: "/admin/contas-financeiras" }]}
      />

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para gerenciar as contas.</Notice>}

      <Panel title="Nova conta financeira">
        <ContaFinanceiraForm />
      </Panel>

      <Panel title={`Contas (${d.contasFinanceiras.length})`}>
        <ul className="divide-y divide-line">
          {d.contasFinanceiras.map((c) => {
            const saida = saidas.get(c.id) ?? 0;
            const saldo = c.saldo_inicial_cents - saida;
            return (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                <div>
                  <span className={c.ativo ? "font-medium text-moss" : "text-muted line-through"}>{c.nome}</span>
                  <span className="ml-2 text-xs text-muted">{TIPO_LABEL[c.tipo] ?? c.tipo}</span>
                  <div className="text-xs text-muted">
                    saldo inicial {formatCents(c.saldo_inicial_cents)} · saídas {formatCents(saida)} · saldo{" "}
                    <strong className={saldo < 0 ? "text-danger" : "text-moss"}>{formatCents(saldo)}</strong>
                  </div>
                </div>
                <form action={alternarContaFinanceira}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="ativo" value={String(c.ativo)} />
                  <button type="submit" className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${c.ativo ? "bg-[#e6efe0] text-success" : "bg-cream text-muted"}`}>
                    {c.ativo ? "ativa" : "inativa"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
