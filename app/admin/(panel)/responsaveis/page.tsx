import Link from "next/link";
import { Notice, PageTitle } from "@/components/admin/ui";
import { getResponsavelResumo } from "@/lib/admin-data";
import { formatCents } from "@/domain/money";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ResponsaveisPage() {
  const resumo = await getResponsavelResumo();

  return (
    <>
      <PageTitle>Responsáveis pelo pagamento</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para ver os responsáveis.</Notice>
      ) : (
        <Notice>
          Visão por responsável (Helena, Guilherme, Toninho). &quot;Assumido&quot; = soma das parcelas
          atribuídas; classifique o responsável de cada despesa no{" "}
          <Link href="/admin/financeiro" className="text-olive underline">Financeiro</Link>. Aportes vêm
          da aba <Link href="/admin/aportes" className="text-olive underline">Aportes</Link>.
        </Notice>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {resumo.map((r) => (
          <div key={r.nome} className="rounded-lg bg-white p-6 shadow-card">
            <h3 className="mb-3 font-serif text-2xl text-moss">{r.nome}</h3>
            <dl className="space-y-1.5 text-sm">
              <Linha label="Assumido" valor={r.assumidoCents} />
              <Linha label="Pago" valor={r.pagoCents} cor="text-success" />
              <Linha label="Em aberto" valor={r.abertoCents} cor="text-warn" />
              <Linha label="Vence este mês" valor={r.esteMesCents} />
              <Linha label="Próximo mês" valor={r.proxMesCents} />
              <div className="mt-2 border-t border-line pt-2">
                <Linha label="Aportes" valor={r.aportesCents} cor="text-olive" />
              </div>
            </dl>
          </div>
        ))}
        {resumo.length === 0 && <p className="text-sm text-muted">Nenhum responsável configurado.</p>}
      </div>
    </>
  );
}

function Linha({ label, valor, cor }: { label: string; valor: number; cor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-serif ${cor ?? "text-moss"}`}>{formatCents(valor)}</dd>
    </div>
  );
}
