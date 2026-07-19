import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { CampanhaForm } from "@/components/admin/comm/CampanhaForm";
import { listJourneys } from "@/lib/comm-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function NovaCampanhaPage() {
  const jornadas = await listJourneys();
  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao/campanhas" className="text-sm text-olive underline">← Campanhas</Link></div>
      <PageTitle>Nova campanha</PageTitle>
      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para criar campanhas.</Notice>}
      <Notice>
        Defina o público por filtros. Ao criar, o sistema já monta a audiência (com deduplicação) e mostra quem entra
        e quem fica de fora, com o motivo. O envio só acontece depois da aprovação e com o canal validado.
      </Notice>
      <Panel title="Configuração">
        <CampanhaForm jornadas={jornadas.map((j) => ({ id: j.id, nome: j.nome }))} />
      </Panel>
    </>
  );
}
