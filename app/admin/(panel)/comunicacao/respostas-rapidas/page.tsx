import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { listQuickReplies } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

export default async function RespostasRapidasPage() {
  const respostas = await listQuickReplies();
  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Respostas rápidas</PageTitle>
      <Notice>Modelos prontos (texto ou áudio) para responder dúvidas frequentes com agilidade. Áudios podem ser cadastrados no Centro de áudios.</Notice>

      <Panel title={`Respostas (${respostas.length})`}>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          {respostas.length === 0 && <p className="text-sm text-muted">Nenhuma resposta rápida ainda.</p>}
          {respostas.map((r) => (
            <div key={r.id} className="rounded-lg border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-moss">{r.titulo}</span>
                <span className="text-xs uppercase tracking-wide text-muted">{r.tipo}{r.categoria ? ` · ${r.categoria}` : ""}</span>
              </div>
              {r.corpo && <p className="mt-2 text-sm text-muted">{r.corpo}</p>}
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
