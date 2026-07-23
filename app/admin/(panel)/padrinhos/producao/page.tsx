import Link from "next/link";
import { Kpi, KpiGrid, PageTitle, Panel, Notice } from "@/components/admin/ui";
import { listPadrinhos, listParesPadrinhos } from "@/lib/comm-data";
import { resumoCaixas, producaoGrupo, somarProducao } from "@/domain/convites/caixas";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

interface LinhaCaixa {
  nome: string;
  tipo: string;
  integrantes: string;
  caixas: number;
  grandes: number;
  pequenos: number;
  status: string;
}

export default async function ProducaoCaixasPage() {
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
  const individuais = membros.filter((m) => !emPar.has(m.id) && m.caixa_individual);

  // Linhas de produção — SÓ caixas confirmadas (casais + individuais).
  const linhas: LinhaCaixa[] = [
    ...pares.map((p) => ({
      nome: p.nome ?? `${p.nomeA} e ${p.nomeB}`,
      tipo: "Casal",
      integrantes: `${p.nomeA ?? "?"} + ${p.nomeB ?? "?"}`,
      caixas: p.caixas,
      grandes: p.convites_grandes,
      pequenos: p.convites_pequenos,
      status: p.status_producao,
    })),
    ...individuais.map((m) => {
      const prod = producaoGrupo("padrinhos_individual", [{ faixa: "adulto" }]);
      return { nome: m.nome, tipo: "Individual", integrantes: m.nome, caixas: prod.caixas, grandes: prod.convitesGrandes, pequenos: prod.convitesPequenos, status: m.entrega_status };
    }),
  ];

  const totalProd = somarProducao(linhas.map((l) => ({ caixas: l.caixas, convitesGrandes: l.grandes, convitesPequenos: l.pequenos })));

  return (
    <>
      <div className="mb-4"><Link href="/admin/padrinhos" className="text-sm text-olive underline">← Padrinhos</Link></div>
      <PageTitle>Produção de caixas — padrinhos</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver a produção.</Notice>}

      <KpiGrid>
        <Kpi label="Caixas de casal" value={resumo.casaisVinculados} />
        <Kpi label="Caixas individuais" value={resumo.caixasIndividuais} />
        <Kpi label="Caixas confirmadas" value={resumo.caixasConfirmadas} />
        <Kpi label="Convites grandes" value={totalProd.convitesGrandes} />
        <Kpi label="Convites pequenos" value={totalProd.convitesPequenos} />
      </KpiGrid>

      {resumo.caixasPendentes > 0 && (
        <Notice>
          Existem <strong>{resumo.caixasPendentes} padrinho(s) sem definição de caixa</strong>. Eles NÃO entram nesta
          lista de produção. Resolva em{" "}
          <Link href="/admin/padrinhos/duplas" className="underline">Casais e caixas</Link> (vincular como casal ou marcar caixa individual).
        </Notice>
      )}

      <Panel title={`Lista de produção — caixas confirmadas (${linhas.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Identificação", "Tipo", "Integrantes", "Caixas", "Convites grandes", "Convites pequenos", "Status"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Nenhuma caixa confirmada ainda. Vincule casais ou marque caixas individuais.</td></tr>
              )}
              {linhas.map((l, i) => (
                <tr key={i} className="border-t border-line hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium text-moss">{l.nome}</td>
                  <td className="px-4 py-2.5 text-muted">{l.tipo}</td>
                  <td className="px-4 py-2.5 text-muted">{l.integrantes}</td>
                  <td className="px-4 py-2.5">{l.caixas}</td>
                  <td className="px-4 py-2.5">{l.grandes}</td>
                  <td className="px-4 py-2.5">{l.pequenos}</td>
                  <td className="px-4 py-2.5 text-xs uppercase tracking-wide text-muted">{l.status}</td>
                </tr>
              ))}
            </tbody>
            {linhas.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-line bg-cream font-medium">
                  <td className="px-4 py-3" colSpan={3}>Total</td>
                  <td className="px-4 py-3">{totalProd.caixas}</td>
                  <td className="px-4 py-3">{totalProd.convitesGrandes}</td>
                  <td className="px-4 py-3">{totalProd.convitesPequenos}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Panel>
    </>
  );
}
