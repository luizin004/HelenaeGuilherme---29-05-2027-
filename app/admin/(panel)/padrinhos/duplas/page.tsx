import Link from "next/link";
import { Kpi, KpiGrid, PageTitle, Panel, Notice } from "@/components/admin/ui";
import { VincularCasal } from "@/components/admin/padrinhos/VincularCasal";
import { desvincularPar, marcarCaixaIndividual } from "@/app/actions/padrinhos";
import { listPadrinhos, listParesPadrinhos } from "@/lib/comm-data";
import { resumoCaixas } from "@/domain/convites/caixas";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const PAPEL_LABEL: Record<string, string> = { padrinho: "Padrinho", madrinha: "Madrinha" };

export default async function DuplasPage() {
  const [membros, pares] = await Promise.all([listPadrinhos(), listParesPadrinhos()]);
  const resumo = resumoCaixas(
    membros.map((m) => ({ id: m.id, papel: m.papel, caixa_individual: m.caixa_individual })),
    pares.map((p) => ({ member_a: p.member_a, member_b: p.member_b })),
  );

  const emPar = new Set<string>();
  for (const p of pares) {
    if (p.member_a) emPar.add(p.member_a);
    if (p.member_b) emPar.add(p.member_b);
  }
  const foraDePar = membros.filter((m) => !emPar.has(m.id));
  const aVincular = foraDePar.filter((m) => !m.caixa_individual);
  const individuais = foraDePar.filter((m) => m.caixa_individual);

  return (
    <>
      <div className="mb-4"><Link href="/admin/padrinhos" className="text-sm text-olive underline">← Padrinhos</Link></div>
      <PageTitle>Casais e caixas de padrinhos</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para gerenciar os casais.</Notice>}

      <Notice>
        Um <strong>casal vinculado</strong> conta como <strong>1 caixa</strong>. Um padrinho sozinho só vira caixa
        quando marcado como <strong>caixa individual</strong>. Quem está em <strong>A vincular</strong> ainda não
        entra na produção final.
      </Notice>

      <KpiGrid>
        <Kpi label="Padrinhos e madrinhas" value={resumo.totalPadrinhos} hint={`${resumo.totalPadrinhosHomens} padrinhos · ${resumo.totalMadrinhas} madrinhas`} />
        <Kpi label="Casais vinculados" value={resumo.casaisVinculados} />
        <Kpi label="A vincular" value={resumo.semPar} hint="sem par e sem caixa" />
        <Kpi label="Caixas confirmadas" value={resumo.caixasConfirmadas} hint={`${resumo.caixasIndividuais} individuais`} />
        <Kpi label="Caixas pendentes" value={resumo.caixasPendentes} />
        <Kpi label="Previsão máxima" value={resumo.previsaoMaxCaixas} hint="se cada pendente virar 1 caixa" />
      </KpiGrid>

      <Panel title={`Casais vinculados (${pares.length})`}>
        <div className="p-6">
          {pares.length === 0 ? (
            <p className="text-sm text-muted">Nenhum casal formado ainda. Use a área “A vincular” abaixo.</p>
          ) : (
            <ul className="grid gap-2">
              {pares.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3">
                  <div>
                    <span className="font-medium text-moss">{p.nome ?? `${p.nomeA} e ${p.nomeB}`}</span>
                    <div className="text-xs text-muted">
                      {p.nomeA ?? "?"} + {p.nomeB ?? "?"} · {p.caixas} caixa · {p.convites_grandes} convite grande · {p.convites_pequenos} pequenos
                    </div>
                  </div>
                  <form action={desvincularPar}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="text-xs text-danger underline">desvincular</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel title={`A vincular (${aVincular.length})`}>
        <div className="space-y-4 p-6">
          {aVincular.length === 0 ? (
            <p className="text-sm text-muted">Ninguém aguardando vínculo. 🤍</p>
          ) : (
            <>
              <VincularCasal pessoas={aVincular.map((m) => ({ id: m.id, nome: m.nome, papel: m.papel }))} />
              <ul className="grid gap-1.5">
                {aVincular.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-md bg-ivory px-3 py-2 text-sm">
                    <span>
                      <span className="font-medium text-moss">{m.nome}</span>
                      <span className="ml-2 text-xs uppercase tracking-wide text-muted">{PAPEL_LABEL[m.papel] ?? m.papel}</span>
                      {!m.telefone && <span className="ml-2 text-xs text-warn">sem telefone</span>}
                    </span>
                    <form action={marcarCaixaIndividual}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="marcar" value="true" />
                      <button type="submit" className="text-xs text-olive underline">caixa individual</button>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Panel>

      <Panel title={`Caixas individuais (${individuais.length})`}>
        <div className="p-6">
          {individuais.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma caixa individual marcada.</p>
          ) : (
            <ul className="grid gap-1.5">
              {individuais.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
                  <span className="font-medium text-moss">{m.nome} <span className="ml-1 text-xs uppercase tracking-wide text-muted">{PAPEL_LABEL[m.papel] ?? m.papel}</span></span>
                  <form action={marcarCaixaIndividual}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="marcar" value="false" />
                    <button type="submit" className="text-xs text-danger underline">voltar para A vincular</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </>
  );
}
