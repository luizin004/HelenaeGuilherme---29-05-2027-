import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { listExpenses, listParcelasDetalhado, getExpensePayers, getPayers, getResponsavelResumo } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

interface Agg {
  previsto: number;
  contratado: number;
  pago: number;
}

const zero = (): Agg => ({ previsto: 0, contratado: 0, pago: 0 });
const CONTRATADO = new Set(["contratado", "pago"]);

function Tabela({ titulo, linhas }: { titulo: string; linhas: [string, Agg][] }) {
  const total = linhas.reduce<Agg>((t, [, a]) => ({ previsto: t.previsto + a.previsto, contratado: t.contratado + a.contratado, pago: t.pago + a.pago }), zero());
  return (
    <Panel title={titulo}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["", "Previsto", "Contratado", "Pago", "Em aberto"].map((h) => (
                <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Sem dados ainda.</td></tr>}
            {linhas.map(([nome, a]) => (
              <tr key={nome} className="border-t border-line hover:bg-ivory">
                <td className="px-4 py-2.5 font-medium">{nome}</td>
                <td className="px-4 py-2.5 text-muted">{formatCents(a.previsto)}</td>
                <td className="px-4 py-2.5 text-moss">{formatCents(a.contratado)}</td>
                <td className="px-4 py-2.5 text-success">{formatCents(a.pago)}</td>
                <td className="px-4 py-2.5 text-warn">{formatCents(Math.max(0, a.contratado - a.pago))}</td>
              </tr>
            ))}
          </tbody>
          {linhas.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-line bg-cream font-medium">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">{formatCents(total.previsto)}</td>
                <td className="px-4 py-3 text-moss">{formatCents(total.contratado)}</td>
                <td className="px-4 py-3 text-success">{formatCents(total.pago)}</td>
                <td className="px-4 py-3 text-warn">{formatCents(Math.max(0, total.contratado - total.pago))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Panel>
  );
}

function ResponsavelLinha({ label, valor, cor }: { label: string; valor: number; cor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-serif ${cor ?? "text-moss"}`}>{formatCents(valor)}</dd>
    </div>
  );
}

export default async function RelatoriosPage() {
  const [expenses, parcelas, expensePayers, payers, respResumo] = await Promise.all([
    listExpenses(),
    listParcelasDetalhado(),
    getExpensePayers(),
    getPayers(),
    getResponsavelResumo(),
  ]);
  const payerNome = new Map(payers.map((p) => [p.id, p.nome]));

  // Pago por despesa (das parcelas).
  const pagoPorExpense = new Map<string, number>();
  for (const p of parcelas) if (p.pago) pagoPorExpense.set(p.expense_id, (pagoPorExpense.get(p.expense_id) ?? 0) + p.valor_cents);

  const porCategoria = new Map<string, Agg>();
  const porResponsavel = new Map<string, Agg>();
  let cortesias = 0;

  for (const e of expenses) {
    if (e.gratuito) { cortesias += 1; continue; }
    const valor = e.valor_total_cents ?? 0;
    const pago = pagoPorExpense.get(e.id) ?? 0;
    const contratado = CONTRATADO.has(e.estado) ? valor : 0;
    const cat = e.categoria || "Sem categoria";
    const resp = (expensePayers[e.id] && payerNome.get(expensePayers[e.id])) || "Não atribuído";

    const ac = porCategoria.get(cat) ?? zero();
    ac.previsto += valor; ac.contratado += contratado; ac.pago += pago; porCategoria.set(cat, ac);
    const ar = porResponsavel.get(resp) ?? zero();
    ar.previsto += valor; ar.contratado += contratado; ar.pago += pago; porResponsavel.set(resp, ar);
  }

  const linhasCat = [...porCategoria.entries()].sort((a, b) => b[1].previsto - a[1].previsto);
  const ordemResp = ["Helena", "Guilherme", "Toninho"];
  const linhasResp = [...porResponsavel.entries()].sort((a, b) => {
    const ia = ordemResp.indexOf(a[0]), ib = ordemResp.indexOf(b[0]);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return b[1].previsto - a[1].previsto;
  });

  const totPrev = expenses.filter((e) => !e.gratuito).reduce((n, e) => n + (e.valor_total_cents ?? 0), 0);
  const totPago = [...pagoPorExpense.values()].reduce((n, v) => n + v, 0);

  return (
    <>
      <PageTitle>Relatórios</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver os relatórios.</Notice>}

      <KpiGrid>
        <Kpi label="Previsto (com valor)" value={formatCents(totPrev)} />
        <Kpi label="Pago" value={formatCents(totPago)} />
        <Kpi label="Em aberto" value={formatCents(Math.max(0, totPrev - totPago))} />
        <Kpi label="Cortesias" value={cortesias} hint="itens gratuitos" />
      </KpiGrid>

      <Notice>
        Previsto = valor informado da despesa; Contratado = itens em estado contratado/pago; Pago =
        soma das parcelas quitadas. Presentes ficam <strong>fora</strong> destes números.
      </Notice>

      <div className="grid gap-6">
        <Tabela titulo="Por categoria" linhas={linhasCat} />
        <Tabela titulo="Por responsável" linhas={linhasResp} />
      </div>

      <Panel title="Responsáveis — visão detalhada">
        <div className="p-6">
          <p className="mb-4 text-sm text-muted">
            Consolidado por responsável (Helena, Guilherme, Toninho): quanto cada um assumiu nas parcelas,
            o que já pagou, o que está em aberto, o que vence este mês e no próximo, e os aportes registrados.
          </p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {respResumo.map((r) => (
              <div key={r.nome} className="rounded-lg border border-line bg-white p-6 shadow-card">
                <h3 className="mb-3 font-serif text-2xl text-moss">{r.nome}</h3>
                <dl className="space-y-1.5 text-sm">
                  <ResponsavelLinha label="Assumido" valor={r.assumidoCents} />
                  <ResponsavelLinha label="Pago" valor={r.pagoCents} cor="text-success" />
                  <ResponsavelLinha label="Em aberto" valor={r.abertoCents} cor="text-warn" />
                  <ResponsavelLinha label="Vence este mês" valor={r.esteMesCents} />
                  <ResponsavelLinha label="Próximo mês" valor={r.proxMesCents} />
                  <div className="mt-2 border-t border-line pt-2">
                    <ResponsavelLinha label="Aportes" valor={r.aportesCents} cor="text-olive" />
                  </div>
                </dl>
              </div>
            ))}
            {respResumo.length === 0 && <p className="text-sm text-muted">Nenhum responsável configurado.</p>}
          </div>
        </div>
      </Panel>
    </>
  );
}
