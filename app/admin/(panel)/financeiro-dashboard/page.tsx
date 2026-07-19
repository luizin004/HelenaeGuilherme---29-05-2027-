import Link from "next/link";
import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { getFinanceDashboard } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Paleta para as barras de participação.
const CORES = ["#6f7352", "#8a7359", "#b89b6a", "#4b5540", "#8f9470", "#c79a4a", "#6f8a5e"];

function Card({ label, value, hint, href, tone }: { label: string; value: string; hint?: string; href?: string; tone?: "danger" | "warn" | "success" }) {
  const toneCls = tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : tone === "success" ? "text-success" : "text-moss";
  const inner = (
    <div className="rounded-lg bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${toneCls}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function FinanceDashboardPage() {
  const d = await getFinanceDashboard();

  return (
    <>
      <PageTitle>Dashboard financeiro</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para ver o painel.</Notice>
      ) : (
        <Notice>Visão executiva. Clique num card para abrir a lista correspondente. Presentes ficam fora destes números.</Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Previsto (com valor)" value={formatCents(d.previstoCents)} hint={`${d.semValor} item(ns) sem valor`} href="/admin/financeiro" />
        <Card label="Contratado" value={formatCents(d.contratadoCents)} href="/admin/cotacoes" />
        <Card label="Pago" value={formatCents(d.pagoCents)} tone="success" href="/admin/contas-pagas" />
        <Card label="Em aberto" value={formatCents(d.abertoCents)} tone="warn" href="/admin/contas-a-pagar" />
        <Card label="Vencido" value={formatCents(d.vencidoCents)} tone="danger" href="/admin/contas-a-pagar" />
        <Card label="A pagar hoje" value={formatCents(d.aPagarHojeCents)} href="/admin/calendario" />
        <Card label="A pagar (7 dias)" value={formatCents(d.aPagarSemanaCents)} href="/admin/calendario" />
        <Card label="A pagar este mês" value={formatCents(d.aPagarMesCents)} href="/admin/projecao" />
        <Card label="Saldo de caixa" value={formatCents(d.saldoCaixaCents)} tone={d.saldoCaixaCents < 0 ? "danger" : undefined} href="/admin/fluxo-caixa" />
        <Card label="Compromissos futuros" value={formatCents(d.compromissosFuturosCents)} href="/admin/parcelas" />
        <Card label="Aportes" value={formatCents(d.aportesCents)} href="/admin/aportes" />
        <Card label="Economia (cortesias)" value={formatCents(d.economiaCents)} hint={`${d.cortesias} item(ns)`} href="/admin/cortesias" />
        <Card label="Contratos" value={String(d.contratos)} href="/admin/contratos" />
        <Card label="Parcelas" value={String(d.parcelas)} href="/admin/parcelas" />
        <Card label="Confirmados" value={String(d.confirmados)} href="/admin/convidados" />
        <Card label="Custo por convidado" value={d.custoPorConvidadoCents !== null ? formatCents(d.custoPorConvidadoCents) : "—"} hint="previsto ÷ confirmados" />
      </div>

      <Panel title="Participação por categoria (previsto)">
        <div className="space-y-3 p-6">
          {d.participacao.length === 0 && <p className="text-sm text-muted">Defina valores e categorias no Financeiro para ver a distribuição.</p>}
          {d.participacao.map((p, i) => (
            <div key={p.categoria}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{p.categoria}</span>
                <span className="text-muted">{formatCents(p.cents)} · {p.pct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream">
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, p.pct)}%`, background: CORES[i % CORES.length] }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
