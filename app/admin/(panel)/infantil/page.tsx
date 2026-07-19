import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovaCrianca } from "@/components/admin/NovaCrianca";
import { CriancaActions } from "@/components/admin/CriancaActions";
import { listChildren, listGuests } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function InfantilPage() {
  const [children, guests] = await Promise.all([listChildren(), listGuests()]);
  const nome = new Map(guests.map((g) => [g.id, g.nome]));

  return (
    <>
      <PageTitle>Espaço infantil</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase para cadastrar as crianças.</Notice>}

      <KpiGrid>
        <Kpi label="Crianças cadastradas" value={children.length} />
        <Kpi label="Usarão o espaço" value={children.filter((c) => c.usara_espaco).length} />
        <Kpi label="Com observações" value={children.filter((c) => c.observacoes).length} hint="alergias / cuidados" />
      </KpiGrid>

      <Notice>Espaço acompanhado por monitores. Registre alergias e cuidados especiais de cada criança.</Notice>

      <Panel title="Nova criança">
        <div className="p-6">
          <NovaCrianca responsaveis={guests} />
        </div>
      </Panel>

      <Panel title="Crianças">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Nome", "Idade", "Responsável", "Alergias / cuidados", "Espaço", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {children.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted">
                    Nenhuma criança cadastrada ainda.
                  </td>
                </tr>
              )}
              {children.map((c) => (
                <tr key={c.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="px-6 py-3 font-medium">{c.nome}</td>
                  <td className="px-6 py-3 text-muted">{c.idade ?? "—"}</td>
                  <td className="px-6 py-3 text-muted">{c.responsavel_id ? nome.get(c.responsavel_id) ?? "—" : "—"}</td>
                  <td className="px-6 py-3 text-muted">{c.observacoes ?? "—"}</td>
                  <td className="px-6 py-3">
                    {c.usara_espaco ? (
                      <span className="rounded-full bg-[#e6efe0] px-2.5 py-0.5 text-xs text-success">sim</span>
                    ) : (
                      <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs text-muted">não</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <CriancaActions
                      c={c}
                      responsaveis={guests.map((g) => ({ id: g.id, nome: g.nome }))}
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
