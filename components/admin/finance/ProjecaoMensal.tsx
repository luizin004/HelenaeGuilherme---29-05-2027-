import Link from "next/link";
import { Notice, Panel } from "@/components/admin/ui";
import { EmptyState } from "@/components/admin/finance/ui";
import type { ProjecaoV2, VisaoProjecao } from "@/lib/finance-core";
import { labelMesPT } from "@/domain/finance/status";
import { formatCents } from "@/domain/money";
import { WEDDING } from "@/lib/constants";

const YM_CASAMENTO = WEDDING.dataISO.slice(0, 7);

export const VISOES_PROJECAO: { key: VisaoProjecao; label: string }[] = [
  { key: "vencimento", label: "Por vencimento" },
  { key: "competencia", label: "Por competência" },
  { key: "pagamento", label: "Por pagamento realizado" },
];

/**
 * Projeção mês a mês (gráfico + tabela). Componente único usado tanto no
 * Dashboard financeiro quanto em qualquer deep-link — mesma fonte de dados.
 * `basePath` define para onde as abas de visão apontam.
 */
export function ProjecaoMensalView({
  proj,
  visao,
  basePath,
}: {
  proj: ProjecaoV2;
  visao: VisaoProjecao;
  basePath: string;
}) {
  const maxMes = Math.max(1, ...proj.meses.map((m) => Math.max(m.previstoCents, m.entradasCents)));

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Visões da projeção">
        {VISOES_PROJECAO.map((v) => (
          <Link
            key={v.key}
            role="tab"
            aria-selected={visao === v.key}
            href={`${basePath}?visao=${v.key}`}
            className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-wide transition ${
              visao === v.key ? "bg-moss text-white" : "bg-white text-muted shadow-card hover:text-moss"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {proj.meses.length === 0 ? (
        <Panel title="Fluxo mês a mês">
          <EmptyState title="Sem dados para projetar ainda.">
            Cadastre despesas em <strong>Lançamentos</strong>, gere parcelas ou contrate uma proposta em <strong>Cotações</strong> — a projeção monta sozinha.
          </EmptyState>
        </Panel>
      ) : (
        <>
          <Panel title="Gráfico — previsto × pago × entradas">
            <div className="space-y-3 p-6">
              {proj.meses.map((m) => {
                const isCasamento = m.ym === YM_CASAMENTO;
                return (
                  <Link key={m.ym} href="/admin/financeiro?t=contas&sec=contas&aba=todas" className="block" title={`${labelMesPT(m.ym)} · previsto ${formatCents(m.previstoCents)} · pago ${formatCents(m.pagoCents)} · pendente ${formatCents(m.pendenteCents)}${m.vencidoCents ? ` · vencido ${formatCents(m.vencidoCents)}` : ""}${m.entradasCents ? ` · entradas ${formatCents(m.entradasCents)}` : ""}`}>
                    <div className="mb-0.5 flex items-center justify-between text-xs">
                      <span className={`font-medium ${isCasamento ? "text-wood" : "text-moss"}`}>
                        {labelMesPT(m.ym)}{isCasamento ? " · casamento" : ""}
                      </span>
                      <span className="text-muted">{formatCents(m.previstoCents)}</span>
                    </div>
                    <div className="relative h-4 w-full overflow-hidden rounded bg-cream">
                      <div className="absolute inset-y-0 left-0 rounded bg-olive/35" style={{ width: `${(m.previstoCents / maxMes) * 100}%` }} />
                      <div className="absolute inset-y-0 left-0 rounded bg-success/80" style={{ width: `${(m.pagoCents / maxMes) * 100}%` }} />
                      {m.vencidoCents > 0 && (
                        <div className="absolute inset-y-0 rounded bg-danger/70" style={{ left: `${(m.pagoCents / maxMes) * 100}%`, width: `${(m.vencidoCents / maxMes) * 100}%` }} />
                      )}
                      {m.entradasCents > 0 && (
                        <div className="absolute bottom-0 left-0 h-1 rounded bg-gold" style={{ width: `${(m.entradasCents / maxMes) * 100}%` }} />
                      )}
                    </div>
                  </Link>
                );
              })}
              <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-muted">
                <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-olive/35 align-middle" />previsto</span>
                <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-success/80 align-middle" />pago</span>
                <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-danger/70 align-middle" />vencido</span>
                <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-gold align-middle" />entradas (aportes)</span>
              </div>
            </div>
          </Panel>

          <Panel title="Tabela mês a mês">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {["Mês", "Previsto", "Pago", "Pendente", "Vencido", "Entradas", "Saldo", "Acumulado", "Contas"].map((h) => (
                      <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proj.meses.map((m) => (
                    <tr key={m.ym} className={`border-t border-line ${m.ym === YM_CASAMENTO ? "bg-gold-soft/40" : "hover:bg-ivory"}`}>
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium">{labelMesPT(m.ym)}</td>
                      <td className="px-4 py-2.5 font-serif text-moss">{formatCents(m.previstoCents)}</td>
                      <td className="px-4 py-2.5 text-success">{formatCents(m.pagoCents)}</td>
                      <td className="px-4 py-2.5 text-warn">{formatCents(m.pendenteCents)}</td>
                      <td className="px-4 py-2.5 text-danger">{m.vencidoCents ? formatCents(m.vencidoCents) : "—"}</td>
                      <td className="px-4 py-2.5 text-olive">{m.entradasCents ? formatCents(m.entradasCents) : "—"}</td>
                      <td className={`px-4 py-2.5 ${m.saldoCents < 0 ? "text-danger" : "text-moss"}`}>{formatCents(m.saldoCents)}</td>
                      <td className={`px-4 py-2.5 ${m.acumuladoCents < 0 ? "text-danger" : "text-muted"}`}>{formatCents(m.acumuladoCents)}</td>
                      <td className="px-4 py-2.5 text-muted">{m.qtde}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {proj.semDataCents > 0 && (
            <Notice>
              Há <strong>{formatCents(proj.semDataCents)}</strong> em contas <strong>sem data</strong> — elas não entram
              nos meses acima. Defina vencimento em <Link href="/admin/financeiro?t=contas&sec=a_definir" className="underline">Contas → Parcelas a definir</Link>.
            </Notice>
          )}
        </>
      )}
    </>
  );
}
