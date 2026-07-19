import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { getTransporteResumo } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function TransportePage() {
  const t = await getTransporteResumo();
  const estimativaCarros = (t.opcoes.find((o) => o.chave === "carro")?.total ?? 0) + (t.opcoes.find((o) => o.chave === "oferece_vagas")?.total ?? 0);

  return (
    <>
      <PageTitle>Transporte</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para ver as respostas de transporte.</Notice>
      ) : (
        <Notice>
          Respostas coletadas na confirmação. Os dados de contato <strong>não são compartilhados
          automaticamente</strong> entre convidados — qualquer conexão de carona é intermediada por vocês.
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Estimativa de carros" value={estimativaCarros} hint="de carro + oferecem carona" />
        <Kpi label="Oferecem carona" value={t.oferecemCarona.length} />
        <Kpi label="Precisam de carona" value={t.precisamCarona.length} />
        <Kpi label="Com Instagram" value={t.comInstagram} hint="para interações" />
      </KpiGrid>

      <Panel title="Como pretendem chegar">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {t.opcoes.map((o) => (
                <tr key={o.chave} className="border-t border-line first:border-0">
                  <td className="px-6 py-2.5">{o.label}</td>
                  <td className="px-6 py-2.5 text-right font-serif text-base text-moss">{o.total}</td>
                </tr>
              ))}
              <tr className="border-t border-line">
                <td className="px-6 py-2.5 text-muted">Sem resposta ainda</td>
                <td className="px-6 py-2.5 text-right text-muted">{t.semResposta}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title={`Oferecem carona (${t.oferecemCarona.length})`}>
          {t.oferecemCarona.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted">Ninguém ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {t.oferecemCarona.map((g, i) => (
                <li key={i} className="flex items-center justify-between px-6 py-2.5 text-sm">
                  <span>{g.nome}</span>
                  <span className="text-muted">{g.telefone || "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={`Precisam de carona (${t.precisamCarona.length})`}>
          {t.precisamCarona.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted">Ninguém ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {t.precisamCarona.map((g, i) => (
                <li key={i} className="flex items-center justify-between px-6 py-2.5 text-sm">
                  <span>{g.nome}</span>
                  <span className="text-muted">{g.telefone || "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
