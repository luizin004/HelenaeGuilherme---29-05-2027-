import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { getProjecaoMensal } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { WEDDING } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const YM_CASAMENTO = WEDDING.dataISO.slice(0, 7); // "2027-05"

export default async function ProjecaoPage() {
  const proj = await getProjecaoMensal();
  const temSemData = proj.semData.previstoCents > 0;

  // Acumulado do previsto ao longo dos meses.
  let acumulado = 0;

  return (
    <>
      <PageTitle>Projeção mensal</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para ver a projeção.</Notice>
      ) : (
        <Notice>
          Cada <strong>parcela</strong> aparece no seu mês de vencimento — previsto, já pago e em
          aberto, no total e por responsável. Parcela sem data fica no bloco &quot;sem data&quot; (não
          conta como vencida). Não há teto de orçamento: isto é uma ferramenta de gestão.
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Previsto (parcelas)" value={formatCents(proj.totalPrevistoCents)} />
        <Kpi label="Já pago" value={formatCents(proj.totalPagoCents)} />
        <Kpi label="Em aberto" value={formatCents(proj.totalPrevistoCents - proj.totalPagoCents)} />
      </KpiGrid>

      {proj.meses.length === 0 && !temSemData && (
        <Notice>Sem parcelas ainda. Gere cronogramas em Parcelas ou contrate uma proposta em Cotações.</Notice>
      )}

      <Panel title="Fluxo mês a mês">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Mês", "Previsto", "Pago", "Em aberto", "Acumulado", ...proj.responsaveis].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proj.meses.map((m) => {
                acumulado += m.previstoCents;
                const isCasamento = m.ym === YM_CASAMENTO;
                return (
                  <tr key={m.ym} className={`border-t border-line ${isCasamento ? "bg-gold-soft/40" : "hover:bg-ivory"}`}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium">
                      {m.label}
                      {isCasamento && <span className="ml-2 text-[10px] uppercase tracking-wide text-wood">casamento 💍</span>}
                    </td>
                    <td className="px-4 py-2.5 font-serif text-moss">{formatCents(m.previstoCents)}</td>
                    <td className="px-4 py-2.5 text-success">{formatCents(m.pagoCents)}</td>
                    <td className="px-4 py-2.5 text-warn">{formatCents(m.abertoCents)}</td>
                    <td className="px-4 py-2.5 text-muted">{formatCents(acumulado)}</td>
                    {proj.responsaveis.map((r) => (
                      <td key={r} className="px-4 py-2.5 text-muted">{m.porResp[r] ? formatCents(m.porResp[r]) : "—"}</td>
                    ))}
                  </tr>
                );
              })}
              {temSemData && (
                <tr className="border-t border-line bg-cream/50">
                  <td className="px-4 py-2.5 font-medium">Sem data</td>
                  <td className="px-4 py-2.5 font-serif text-moss">{formatCents(proj.semData.previstoCents)}</td>
                  <td className="px-4 py-2.5 text-success">{formatCents(proj.semData.pagoCents)}</td>
                  <td className="px-4 py-2.5 text-warn">{formatCents(proj.semData.abertoCents)}</td>
                  <td className="px-4 py-2.5 text-muted">—</td>
                  {proj.responsaveis.map((r) => (
                    <td key={r} className="px-4 py-2.5 text-muted">{proj.semData.porResp[r] ? formatCents(proj.semData.porResp[r]) : "—"}</td>
                  ))}
                </tr>
              )}
            </tbody>
            {proj.meses.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-line bg-cream font-medium">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 font-serif text-moss">{formatCents(proj.totalPrevistoCents)}</td>
                  <td className="px-4 py-3 text-success">{formatCents(proj.totalPagoCents)}</td>
                  <td className="px-4 py-3 text-warn">{formatCents(proj.totalPrevistoCents - proj.totalPagoCents)}</td>
                  <td className="px-4 py-3" />
                  {proj.responsaveis.map((r) => {
                    const t =
                      proj.meses.reduce((n, m) => n + (m.porResp[r] ?? 0), 0) + (proj.semData.porResp[r] ?? 0);
                    return <td key={r} className="px-4 py-3 text-moss">{t ? formatCents(t) : "—"}</td>;
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Panel>

      <p className="mt-4 text-xs text-muted">
        Dica: contrate propostas em <strong>Cotações</strong> (gera entrada + parcelas) e ajuste as
        datas em <strong>Parcelas</strong> — tudo reflete aqui automaticamente.
      </p>
    </>
  );
}
