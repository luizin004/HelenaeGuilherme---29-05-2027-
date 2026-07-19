import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { listCampaigns } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  enviando: "bg-[#eef1e6] text-olive", agendada: "bg-[#f6ecd6] text-warn",
  aprovada: "bg-[#e6efe0] text-success", concluida: "bg-[#e6efe0] text-success",
  rascunho: "bg-cream text-muted", revisao: "bg-[#f6ecd6] text-warn",
  pausada: "bg-cream text-muted", cancelada: "bg-[#f4e2dc] text-danger",
};

export default async function CampanhasPage() {
  const campanhas = await listCampaigns();
  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Campanhas</PageTitle>
      <Notice>
        Cada campanha passa por: público → filtros → consentimento → deduplicação → contexto → mensagem →
        pré-visualização → <strong>aprovação</strong> → agendamento → envio → acompanhamento. O envio só ocorre com o
        canal validado.
      </Notice>

      <Panel title={`Campanhas (${campanhas.length})`} action={<Link href="/admin/comunicacao/campanhas/nova" className="btn btn-dark">Nova campanha</Link>}>
        {campanhas.length === 0 ? (
          <p className="p-6 text-sm text-muted">Nenhuma campanha ainda. Crie uma com <Link href="/admin/comunicacao/campanhas/nova" className="underline">Nova campanha</Link>.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr>{["Nome", "Tipo", "Canal", "Aprovação", "Agendada", "Status"].map((h) => (
                <th key={h} className="bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
              ))}</tr></thead>
              <tbody>
                {campanhas.map((c) => (
                  <tr key={c.id} className="border-t border-line hover:bg-ivory">
                    <td className="px-4 py-2.5 font-medium"><Link href={`/admin/comunicacao/campanhas/${c.id}`} className="text-moss underline-offset-2 hover:underline">{c.nome}</Link></td>
                    <td className="px-4 py-2.5 capitalize text-muted">{c.tipo}</td>
                    <td className="px-4 py-2.5 capitalize text-muted">{c.canal}</td>
                    <td className="px-4 py-2.5 text-muted">{c.aprovacao_tipo}</td>
                    <td className="px-4 py-2.5 text-muted">{c.agendado_para ? new Date(c.agendado_para).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</td>
                    <td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS[c.status] ?? "bg-cream text-muted"}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
