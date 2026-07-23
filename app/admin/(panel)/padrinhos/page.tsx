import Link from "next/link";
import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { PadrinhoForm } from "@/components/admin/comm/PadrinhoForm";
import { excluirPadrinho } from "@/app/actions/padrinhos";
import { listPadrinhos, getPadrinhosPendencias } from "@/lib/comm-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  confirmado: "bg-[#e6efe0] text-success",
  convidado: "bg-[#eef1e6] text-olive",
  pendente: "bg-[#f6ecd6] text-warn",
  recusado: "bg-[#f4e2dc] text-danger",
};

const ATALHOS: { href: string; ico: string; titulo: string; desc: string }[] = [
  { href: "/admin/padrinhos/duplas", ico: "💞", titulo: "Casais e caixas", desc: "Vincular casais, caixa individual e contadores." },
  { href: "/admin/padrinhos/producao", ico: "📦", titulo: "Produção de caixas", desc: "Lista final de caixas confirmadas." },
  { href: "/admin/padrinhos/grupos", ico: "👥", titulo: "Grupos", desc: "Organizar por grupos e lados." },
  { href: "/admin/padrinhos/compromissos", ico: "📍", titulo: "Compromissos", desc: "Encontros, ensaios e datas." },
  { href: "/admin/padrinhos/trajes", ico: "🤵", titulo: "Trajes e medidas", desc: "Tamanhos, provas e status." },
  { href: "/admin/padrinhos/pendencias", ico: "⚠️", titulo: "Pendências", desc: "O que falta resolver com cada um." },
  { href: "/admin/padrinhos/tarefas", ico: "✅", titulo: "Tarefas", desc: "To-dos e responsáveis." },
];

export default async function PadrinhosPage() {
  const [membros, pend] = await Promise.all([listPadrinhos(), getPadrinhosPendencias()]);

  return (
    <>
      <PageTitle>Padrinhos & madrinhas</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para gerenciar os padrinhos.</Notice>}

      <KpiGrid>
        <Kpi label="Total" value={pend.total} />
        <Kpi label="Sem confirmação" value={pend.semConfirmacao} />
        <Kpi label="Traje pendente" value={pend.trajePendente} />
        <Kpi label="Ensaio pendente" value={pend.ensaioPendente} />
      </KpiGrid>

      <Panel title="Atalhos">
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {ATALHOS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 transition hover:border-olive hover:shadow-card"
            >
              <span className="text-2xl" aria-hidden>{a.ico}</span>
              <span>
                <span className="block font-medium text-moss">{a.titulo}</span>
                <span className="block text-sm text-muted">{a.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Adicionar padrinho ou madrinha">
        <PadrinhoForm />
      </Panel>

      <Panel title={`Lista (${membros.length})`} action={<Link href="/admin/padrinhos/pendencias" className="text-sm text-olive underline">ver pendências</Link>}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Nome", "Papel", "Lado", "Cidade", "Confirmação", "Traje", "Ensaio", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {membros.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">Nenhum padrinho cadastrado ainda.</td></tr>
              )}
              {membros.map((m) => (
                <tr key={m.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">
                    <Link href={`/admin/padrinhos/${m.id}`} className="text-moss underline-offset-2 hover:underline">{m.nome}</Link>
                    {m.relacao && <div className="text-xs text-muted">{m.relacao}</div>}
                  </td>
                  <td className="px-4 py-2.5 capitalize text-muted">{m.papel}</td>
                  <td className="px-4 py-2.5 capitalize text-muted">{m.lado ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{m.cidade ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${STATUS_BADGE[m.status] ?? "bg-cream text-muted"}`}>{m.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">{m.traje_status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{m.ensaio_status}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-3">
                      <Link href={`/admin/padrinhos/${m.id}`} className="text-xs text-olive underline">abrir</Link>
                      <form action={excluirPadrinho}>
                        <input type="hidden" name="id" value={m.id} />
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
