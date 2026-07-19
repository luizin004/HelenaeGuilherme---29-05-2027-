import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { listPrompts } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  publicado: "bg-[#e6efe0] text-success",
  rascunho: "bg-[#f6ecd6] text-warn",
  arquivado: "bg-cream text-muted",
};

export default async function PromptsPage() {
  const prompts = await listPrompts();
  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Estúdio de prompts</PageTitle>
      <Notice>
        Os prompts geram <strong>rascunhos</strong> humanos e pessoais. Cada alteração cria uma <strong>nova versão</strong> —
        a versão publicada nunca é sobrescrita. Só os noivos/administrador publicam.
      </Notice>

      <Panel title={`Prompts (${prompts.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>{["Nome", "Categoria", "Público", "Momento", "Status", ""].map((h) => (
                <th key={h} className="bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {prompts.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Nenhum prompt ainda.</td></tr>}
              {prompts.map((p) => (
                <tr key={p.id} className="border-t border-line hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">{p.nome}<div className="text-xs text-muted">{p.descricao}</div></td>
                  <td className="px-4 py-2.5 text-muted">{p.categoria ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{p.publico ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{p.momento ?? "—"}</td>
                  <td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS[p.status] ?? "bg-cream text-muted"}`}>{p.status}</span></td>
                  <td className="px-4 py-2.5"><Link href={`/admin/comunicacao/prompts/${p.id}`} className="text-xs text-olive underline">abrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
