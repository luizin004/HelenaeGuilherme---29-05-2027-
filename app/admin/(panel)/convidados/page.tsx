import { Kpi, KpiGrid, Notice, PageTitle, Panel, StatusBadge } from "@/components/admin/ui";
import { getGuestStats, listGuests } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Guest } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const DEMO: Guest[] = [
  demo("Maria Souza", "confirmado", "12", false),
  demo("João Pereira", "pendente", "—", false),
  demo("Lucas Souza", "confirmado", "12", true),
];

function demo(nome: string, status: string, mesa: string, crianca: boolean): Guest {
  return {
    id: nome, group_id: null, nome, email: null, telefone: null, eh_crianca: crianca,
    faixa_etaria: null, lado: null, status: status as Guest["status"], respondeu_em: null,
    mensagem: null, restricao_alimentar: null, qr_token: "demo", mesa,
    check_in_em: null, check_in_por: null, criado_em: "", atualizado_em: "",
  };
}

export default async function ConvidadosPage() {
  const [stats, guests] = await Promise.all([getGuestStats(), listGuests()]);
  const rows = isSupabaseConfigured ? guests : DEMO;

  return (
    <>
      <PageTitle>Convidados</PageTitle>

      <KpiGrid>
        <Kpi label="Total" value={rows.length} />
        <Kpi label="Confirmados" value={isSupabaseConfigured ? stats.confirmados : 2} />
        <Kpi label="Pendentes" value={isSupabaseConfigured ? stats.pendentes : 1} />
        <Kpi label="Crianças" value={isSupabaseConfigured ? stats.criancas : 1} />
      </KpiGrid>

      {!isSupabaseConfigured && (
        <Notice>Exibindo dados de exemplo. Conecte o Supabase para ver os convidados reais e emitir os QR Codes.</Notice>
      )}

      <Panel title="Lista de convidados">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Nome", "Contato", "Status", "Mesa", "QR / Check-in"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted">
                    Nenhum convidado cadastrado ainda.
                  </td>
                </tr>
              )}
              {rows.map((g) => (
                <tr key={g.id} className="border-t border-line hover:bg-ivory">
                  <td className="px-6 py-3">
                    {g.nome} {g.eh_crianca && <span className="text-xs text-muted">(criança)</span>}
                  </td>
                  <td className="px-6 py-3 text-muted">{g.email || g.telefone || "—"}</td>
                  <td className="px-6 py-3"><StatusBadge status={g.status} /></td>
                  <td className="px-6 py-3">{g.mesa || "—"}</td>
                  <td className="px-6 py-3">
                    <button className="rounded border border-line px-3 py-1 text-xs uppercase tracking-wide text-moss hover:bg-cream">
                      Ver QR
                    </button>
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
