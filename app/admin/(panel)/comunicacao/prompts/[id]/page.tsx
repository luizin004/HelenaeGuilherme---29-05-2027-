import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { NovaVersaoPrompt } from "@/components/admin/comm/NovaVersaoPrompt";
import { publicarVersaoPrompt } from "@/app/actions/comm";
import { getPrompt, listPromptVersions } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (!itens.length) return null;
  return (
    <p className="text-xs text-muted"><span className="uppercase tracking-wide">{titulo}:</span> {itens.join(", ")}</p>
  );
}

export default async function PromptDetalhe({ params }: { params: { id: string } }) {
  const prompt = await getPrompt(params.id);
  if (!prompt) notFound();
  const versoes = await listPromptVersions(params.id);
  const base = versoes[0] ?? null;
  const toArr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao/prompts" className="text-sm text-olive underline">← Estúdio de prompts</Link></div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <PageTitle>{prompt.nome}</PageTitle>
        <Link href={`/admin/comunicacao/prompts/${prompt.id}/testar`} className="btn btn-dark">Testar</Link>
      </div>
      <Notice>{prompt.descricao} · A IA usa somente o contexto permitido; dados privados são removidos antes do envio.</Notice>

      <Panel title={`Versões (${versoes.length})`}>
        <ul className="divide-y divide-line">
          {versoes.map((v) => {
            const publicada = prompt.versao_publicada_id === v.id;
            return (
              <li key={v.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-sm font-medium text-moss">v{v.versao}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${v.status === "publicado" ? "bg-[#e6efe0] text-success" : "bg-[#f6ecd6] text-warn"}`}>{v.status}</span>
                    {publicada && <span className="text-xs uppercase tracking-wide text-success">em uso</span>}
                  </div>
                  {!publicada && (
                    <form action={publicarVersaoPrompt}>
                      <input type="hidden" name="version_id" value={v.id} />
                      <input type="hidden" name="prompt_id" value={prompt.id} />
                      <button type="submit" className="text-xs text-olive underline">publicar (noivos/admin)</button>
                    </form>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {v.objetivo && <p className="text-sm text-moss">{v.objetivo}</p>}
                  {v.tom && <p className="text-xs text-muted">Tom: {v.tom}</p>}
                  <Lista titulo="Contexto permitido" itens={toArr(v.contexto_permitido)} />
                  <Lista titulo="Sempre proibido" itens={toArr(v.contexto_proibido)} />
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Nova versão (rascunho)">
        <NovaVersaoPrompt promptId={prompt.id} base={base} />
      </Panel>
    </>
  );
}
