import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { LocalForm } from "@/components/admin/LocalForm";
import { getVenues } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = { cerimonia: "Cerimônia", recepcao: "Recepção", outro: "Outro" };

export default async function LocaisPage() {
  const venues = (await getVenues()) ?? [];

  return (
    <>
      <PageTitle>Locais</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para editar os locais.</Notice>
      ) : (
        <Notice>
          Preencher <strong>latitude/longitude</strong> ou o <strong>link do Google Maps</strong> ativa
          os botões de rota (Maps/Waze) e o QR de localização no site. As mudanças aparecem
          automaticamente nas páginas públicas.
        </Notice>
      )}

      {venues.length === 0 && <Notice>Nenhum local cadastrado.</Notice>}

      <div className="grid gap-6">
        {venues.map((v) => (
          <Panel key={v.id} title={`${TIPO_LABEL[v.tipo] ?? v.tipo} · ${v.nome}`}>
            <div className="p-6"><LocalForm v={v} /></div>
          </Panel>
        ))}
      </div>
    </>
  );
}
