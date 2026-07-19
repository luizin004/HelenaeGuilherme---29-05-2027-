import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function pendentes() {
  const supabase = createClient();
  if (!supabase) return { mensagens: [], audios: [] as { id: string; titulo: string }[] };
  const [{ data: msgs }, { data: aud }] = await Promise.all([
    supabase.from("hg_comm_messages").select("id,corpo,canal").eq("status", "aguardando_aprovacao").limit(50),
    supabase.from("hg_audio_assets").select("id,titulo").eq("status", "em_revisao").is("deleted_at", null).limit(50),
  ]);
  return {
    mensagens: (msgs ?? []) as { id: string; corpo: string | null; canal: string }[],
    audios: (aud ?? []) as { id: string; titulo: string }[],
  };
}

export default async function AprovacoesPage() {
  const { mensagens, audios } = await pendentes();
  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Aprovações</PageTitle>
      <Notice>Mensagens críticas e áudios personalizados exigem revisão humana antes do envio (§20). Nada é enviado pela IA sozinha.</Notice>

      <Panel title={`Mensagens aguardando aprovação (${mensagens.length})`}>
        {mensagens.length === 0 ? (
          <p className="p-6 text-sm text-muted">Nenhuma mensagem aguardando aprovação.</p>
        ) : (
          <ul className="divide-y divide-line">
            {mensagens.map((m) => (
              <li key={m.id} className="px-6 py-3">
                <span className="text-xs uppercase tracking-wide text-muted">{m.canal}</span>
                <p className="text-sm text-moss">{m.corpo ?? "—"}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={`Áudios em revisão (${audios.length})`} action={<Link href="/admin/comunicacao/audios" className="text-sm text-olive underline">abrir áudios</Link>}>
        {audios.length === 0 ? (
          <p className="p-6 text-sm text-muted">Nenhum áudio em revisão.</p>
        ) : (
          <ul className="divide-y divide-line">
            {audios.map((a) => <li key={a.id} className="px-6 py-3 text-sm text-moss">{a.titulo}</li>)}
          </ul>
        )}
      </Panel>
    </>
  );
}
