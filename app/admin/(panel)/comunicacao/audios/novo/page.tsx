import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { AudioRecorder } from "@/components/admin/comm/AudioRecorder";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default function NovoAudioPage() {
  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao/audios" className="text-sm text-olive underline">← Áudios</Link></div>
      <PageTitle>Gravar / enviar áudio</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para enviar áudios.</Notice>}
      <Notice>
        Grave direto pelo navegador (precisa de permissão do microfone) ou envie um arquivo (MP3, M4A, OGG, WAV).
        O áudio vai para um <strong>cofre privado</strong> e nasce como “gravado” — depois passa por revisão/aprovação.
      </Notice>

      <Panel title="Áudio">
        <AudioRecorder />
      </Panel>
    </>
  );
}
