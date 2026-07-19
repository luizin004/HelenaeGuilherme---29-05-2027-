import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { atualizarStatusAudio, excluirAudio } from "@/app/actions/comm";
import { listAudios } from "@/lib/comm-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const dur = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "—");

export default async function AudiosPage() {
  const audios = await listAudios();
  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Centro de áudios</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para gerenciar áudios.</Notice>}
      <Notice>
        Áudios ficam em um <strong>cofre privado</strong> (URLs assinadas). Priorizamos áudios reais gravados pelos
        responsáveis — <strong>sem clonagem de voz</strong>. Aprovação por noivos/administrador antes de usar.
      </Notice>

      <Panel title="Novo áudio" action={<Link href="/admin/comunicacao/audios/novo" className="btn btn-dark">Gravar / enviar</Link>}>
        <p className="p-6 text-sm text-muted">Grave pelo navegador ou envie um arquivo. Depois, envie para revisão e aprovação.</p>
      </Panel>

      <Panel title={`Áudios (${audios.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>{["Título", "Categoria", "Duração", "Transcrição", "Status", "Ações"].map((h) => (
                <th key={h} className="bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {audios.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Nenhum áudio ainda.</td></tr>}
              {audios.map((a) => (
                <tr key={a.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">{a.titulo}{a.quick_reply && <span className="ml-2 text-xs text-olive">⚡ resposta rápida</span>}</td>
                  <td className="px-4 py-2.5 text-muted">{a.categoria ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{dur(a.duracao_seg)}</td>
                  <td className="px-4 py-2.5 text-muted">{a.transcricao ? (a.transcricao_auto ? "auto — revisar" : "ok") : "—"}</td>
                  <td className="px-4 py-2.5"><span className="rounded-full bg-cream px-2.5 py-0.5 text-xs uppercase tracking-wide text-muted">{a.status}</span></td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={atualizarStatusAudio} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={a.id} />
                        <select name="status" defaultValue={a.status} className="field-input py-1 text-xs">
                          {["gravado", "em_revisao", "aprovado", "disponivel", "arquivado"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                        <button type="submit" className="text-xs text-olive underline">salvar</button>
                      </form>
                      <form action={excluirAudio}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="text-xs text-danger underline">excluir</button>
                      </form>
                    </div>
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
