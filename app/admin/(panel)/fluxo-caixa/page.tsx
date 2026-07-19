import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { getFluxoCaixa } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function FluxoCaixaPage() {
  const f = await getFluxoCaixa();
  const falta = f.compromissosFuturosCents - f.saldoAtualCents;

  return (
    <>
      <PageTitle>Fluxo de caixa</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para ver o fluxo.</Notice>
      ) : (
        <Notice>
          Entradas = aportes registrados. Saídas = parcelas pagas (por data de pagamento). Presentes
          ficam <strong>fora</strong> deste caixa (spec). Sem teto de orçamento obrigatório.
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Entradas (aportes)" value={formatCents(f.totalEntradasCents)} />
        <Kpi label="Saídas (pago)" value={formatCents(f.totalSaidasCents)} />
        <Kpi label="Saldo atual" value={formatCents(f.saldoAtualCents)} />
        <Kpi label="Compromissos futuros" value={formatCents(f.compromissosFuturosCents)} hint="parcelas em aberto" />
      </KpiGrid>

      {falta > 0 && (
        <div className="rounded-lg border border-danger/30 bg-[#f4e2dc]/50 px-5 py-3 text-sm text-danger">
          ⚠️ Atenção: os aportes atuais não cobrem os compromissos futuros. Faltam{" "}
          <strong>{formatCents(falta)}</strong> — considere registrar novos aportes.
        </div>
      )}

      <Panel title="Mês a mês">
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
              {f.meses.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Sem movimentações ainda. Registre aportes e pagamentos.</td></tr>
              )}
              {f.meses.map((m) => (
                <tr key={m.ym} className="border-t border-line hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">{m.label}</td>
                  <td className="px-4 py-2.5 text-success">{formatCents(m.entradasCents)}</td>
                  <td className="px-4 py-2.5 text-warn">{formatCents(m.saidasCents)}</td>
                  <td className={`px-4 py-2.5 ${m.saldoMesCents < 0 ? "text-danger" : "text-moss"}`}>{formatCents(m.saldoMesCents)}</td>
                  <td className={`px-4 py-2.5 font-serif ${m.acumuladoCents < 0 ? "text-danger" : "text-moss"}`}>{formatCents(m.acumuladoCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
