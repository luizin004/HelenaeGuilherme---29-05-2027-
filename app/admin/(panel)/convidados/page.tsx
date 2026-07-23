/* eslint-disable @next/next/no-img-element */
import { Kpi, KpiGrid, Notice, PageTitle, Panel, StatusBadge } from "@/components/admin/ui";
import { NovoConvidado } from "@/components/admin/NovoConvidado";
import { ImportarConvidados } from "@/components/admin/ImportarConvidados";
import { ImportarPlanilha } from "@/components/admin/ImportarPlanilha";
import { ConvidadoActions } from "@/components/admin/ConvidadoActions";
import { getGuestStats, listGuests, listGrupos } from "@/lib/admin-data";
import { conviteUrl, qrDataUrl } from "@/lib/qr-image";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ConvidadosPage() {
  const [stats, guests, grupos] = await Promise.all([getGuestStats(), listGuests(), listGrupos()]);
  const gruposOpts = grupos.map((gr) => ({ id: gr.id, nome: gr.nome }));

  // Gera o QR de cada convidado (link pessoal por token).
  const comQr = await Promise.all(
    guests.map(async (g) => ({
      ...g,
      link: conviteUrl(g.qr_token),
      qr: await qrDataUrl(conviteUrl(g.qr_token)),
    })),
  );

  return (
    <>
      <PageTitle>Convidados</PageTitle>

      <KpiGrid>
        <Kpi label="Total" value={stats.total} />
        <Kpi label="Confirmados" value={stats.confirmados} />
        <Kpi label="Pendentes" value={stats.pendentes} />
        <Kpi label="Crianças" value={stats.criancas} />
      </KpiGrid>

      {!isSupabaseConfigured && (
        <Notice>Conecte o Supabase para cadastrar convidados e emitir os QR Codes.</Notice>
      )}

      <Panel title="Novo convidado">
        <div className="p-6">
          <NovoConvidado />
        </div>
      </Panel>

      <Panel title="Criar lista rápida / importar planilha">
        <div className="p-6">
          <ImportarPlanilha />
        </div>
      </Panel>

      <Panel title="Importar CSV (com cabeçalho)">
        <div className="p-6">
          <ImportarConvidados />
        </div>
      </Panel>

      <Panel title="Lista de convidados">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Nome", "Contato", "Mesa", "Status", "Link pessoal", "QR", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comQr.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted">
                    Nenhum convidado ainda. Adicione o primeiro acima.
                  </td>
                </tr>
              )}
              {comQr.map((g) => (
                <tr key={g.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="px-6 py-3">
                    {g.nome} {g.eh_crianca && <span className="text-xs text-muted">(criança)</span>}
                  </td>
                  <td className="px-6 py-3 text-muted">{g.email || g.telefone || "—"}</td>
                  <td className="px-6 py-3 text-muted">{g.mesa || "—"}</td>
                  <td className="px-6 py-3"><StatusBadge status={g.status} /></td>
                  <td className="px-6 py-3">
                    <a href={g.link} target="_blank" rel="noopener" className="text-xs text-olive underline">
                      /rsvp/{g.qr_token.slice(0, 8)}…
                    </a>
                  </td>
                  <td className="px-6 py-3">
                    <img src={g.qr} alt={`QR de ${g.nome}`} className="h-16 w-16" />
                  </td>
                  <td className="px-6 py-3">
                    <ConvidadoActions
                      g={{ id: g.id, nome: g.nome, email: g.email, telefone: g.telefone, mesa: g.mesa, group_id: g.group_id, papel: g.papel, eh_crianca: g.eh_crianca }}
                      grupos={gruposOpts}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
