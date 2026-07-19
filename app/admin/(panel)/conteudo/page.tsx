import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { ConteudoForm } from "@/components/admin/ConteudoForm";
import { PrazoRsvpForm } from "@/components/admin/PrazoRsvpForm";
import { getSettings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ConteudoPage() {
  const settings = await getSettings();

  return (
    <>
      <PageTitle>Conteúdo do site</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase para editar o conteúdo do site.</Notice>
      ) : (
        <Notice>As mudanças aqui aparecem no site público automaticamente.</Notice>
      )}

      <Panel title="Nossa história & identidade">
        <div className="p-6">
          <ConteudoForm historia={settings?.historia ?? ""} hashtag={settings?.hashtag ?? ""} />
        </div>
      </Panel>

      <Panel title="Prazo de confirmação (RSVP)">
        <div className="p-6">
          <PrazoRsvpForm prazo={settings?.rsvp_prazo ?? null} />
        </div>
      </Panel>
    </>
  );
}
