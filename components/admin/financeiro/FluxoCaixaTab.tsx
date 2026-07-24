import Link from "next/link";
import { Notice, Panel } from "@/components/admin/ui";
import { SummaryCard, EmptyState } from "@/components/admin/finance/ui";
import { loadFinance, fluxoCaixa } from "@/lib/finance-core";
import { labelMesPT } from "@/domain/finance/status";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const MODOS = [
  { key: "realizado", label: "Realizado" },
  { key: "projetado", label: "Projetado" },
  { key: "combinado", label: "Combinado" },
] as const;
type Modo = (typeof MODOS)[number]["key"];

export async function FluxoCaixaTab({ searchParams }: { searchParams: { modo?: string } }) {
  const d = await loadFinance();
  const modo = (MODOS.some((m) => m.key === searchParams.modo) ? searchParams.modo : "combinado") as Modo;

  const realizado = fluxoCaixa(d, "realizado");
  const projetado = fluxoCaixa(d, "projetado");
  const saldoInicial = d.contasFinanceiras.reduce((n, c) => n + c.saldo_inicial_cents, 0);

  const exibidos = modo === "realizado" ? [realizado] : modo === "projetado" ? [projetado] : [realizado, projetado];

  return (
    <>
      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver o fluxo.</Notice>}

      <Notice>
        Entradas (aportes) × saídas — calculado a partir dos mesmos lançamentos e contas das outras abas. Nada é
        digitado aqui: cadastre o custo em <strong>Lançamentos</strong> e defina os aportes em{" "}
        <Link href="/admin/aportes" className="underline">Aportes</Link> — o fluxo se atualiza sozinho.
      </Notice>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Saldo inicial" value={formatCents(saldoInicial)} tooltip="Soma do saldo inicial das contas financeiras cadastradas." />
        <SummaryCard label="Entradas (aportes)" value={formatCents(realizado.totalEntradasCents)} tone="success" tooltip="Aportes registrados." href="/admin/aportes" />
        <SummaryCard label="Saídas realizadas" value={formatCents(realizado.totalSaidasCents)} tooltip="Pagamentos efetivamente registrados (estornos fora)." href="/admin/financeiro?t=contas&sec=contas&aba=pagas" />
        <SummaryCard
          label="Saldo do período"
          value={formatCents(saldoInicial + realizado.saldoCents)}
          tone={saldoInicial + realizado.saldoCents < 0 ? "danger" : "success"}
          tooltip="Saldo inicial + entradas − saídas realizadas."
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Modo do fluxo">
        {MODOS.map((m) => (
          <Link
            key={m.key}
            role="tab"
            aria-selected={modo === m.key}
            href={`/admin/financeiro?t=fluxo&modo=${m.key}`}
            className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-wide transition ${
              modo === m.key ? "bg-moss text-white" : "bg-white text-muted shadow-card hover:text-moss"
            }`}
          >
            {m.label}
          </Link>
        ))}
      </div>

      {exibidos.map((f) => (
        <Panel key={f.modo} title={f.modo === "realizado" ? "Fluxo realizado (pagamentos)" : "Fluxo projetado (vencimentos e previsões)"}>
          {f.meses.length === 0 ? (
            <EmptyState title={f.modo === "realizado" ? "Nenhum pagamento registrado ainda." : "Nenhuma conta em aberto com data."}>
              {f.modo === "realizado"
                ? "Registre pagamentos em Contas — cada um aparece aqui na data real."
                : "Contas com vencimento ou previsão aparecem aqui automaticamente."}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {["Mês", "Entradas", "Saídas", "Saldo do mês", "Acumulado"].map((h) => (
                      <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {f.meses.map((m) => (
                    <tr key={m.ym} className="border-t border-line hover:bg-ivory">
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium">{labelMesPT(m.ym)}</td>
                      <td className="px-4 py-2.5 text-success">{m.entradasCents ? formatCents(m.entradasCents) : "—"}</td>
                      <td className="px-4 py-2.5 text-moss">{m.saidasCents ? formatCents(m.saidasCents) : "—"}</td>
                      <td className={`px-4 py-2.5 ${m.saldoCents < 0 ? "text-danger" : "text-success"}`}>{formatCents(m.saldoCents)}</td>
                      <td className={`px-4 py-2.5 ${m.acumuladoCents < 0 ? "text-danger" : "text-muted"}`}>{formatCents(m.acumuladoCents)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-line bg-cream font-medium">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-success">{formatCents(f.totalEntradasCents)}</td>
                    <td className="px-4 py-3 text-moss">{formatCents(f.totalSaidasCents)}</td>
                    <td className={`px-4 py-3 ${f.saldoCents < 0 ? "text-danger" : "text-success"}`} colSpan={2}>{formatCents(f.saldoCents)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Panel>
      ))}
    </>
  );
}
