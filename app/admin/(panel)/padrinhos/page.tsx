import Link from "next/link";
import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { PadrinhoForm } from "@/components/admin/comm/PadrinhoForm";
import { excluirPadrinho } from "@/app/actions/padrinhos";
import { listPadrinhos, getPadrinhosPendencias, listParesPadrinhos } from "@/lib/comm-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const FILTROS = [
  { k: "todos", label: "Todos" },
  { k: "padrinhos", label: "Padrinhos" },
  { k: "madrinhas", label: "Madrinhas" },
  { k: "casal", label: "Em casal" },
  { k: "sem_par", label: "A vincular" },
  { k: "individual", label: "Caixa individual" },
  { k: "sem_telefone", label: "Sem telefone" },
] as const;
type Filtro = (typeof FILTROS)[number]["k"];

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

export default async function PadrinhosPage({ searchParams }: { searchParams: { f?: string } }) {
  const [membros, pend, pares] = await Promise.all([listPadrinhos(), getPadrinhosPendencias(), listParesPadrinhos()]);
  const filtro = (FILTROS.some((f) => f.k === searchParams.f) ? searchParams.f : "todos") as Filtro;

  // Status de vínculo/caixa de cada padrinho.
  const parDe = new Map<string, string>(); // memberId → nome do par
  for (const p of pares) {
    if (p.member_a) parDe.set(p.member_a, p.nomeB ?? "par");
    if (p.member_b) parDe.set(p.member_b, p.nomeA ?? "par");
  }
  const vinculo = (id: string, caixaIndividual: boolean): { label: string; tom: string } => {
    if (parDe.has(id)) return { label: `casal · ${parDe.get(id)}`, tom: "bg-[#e6efe0] text-success" };
    if (caixaIndividual) return { label: "caixa individual", tom: "bg-[#eef1e6] text-olive" };
    return { label: "a vincular", tom: "bg-[#f6ecd6] text-warn" };
  };

  const lista = membros.filter((m) => {
    switch (filtro) {
      case "padrinhos": return m.papel === "padrinho";
      case "madrinhas": return m.papel === "madrinha";
      case "casal": return parDe.has(m.id);
      case "sem_par": return !parDe.has(m.id) && !m.caixa_individual;
      case "individual": return !parDe.has(m.id) && m.caixa_individual;
      case "sem_telefone": return !m.telefone;
      default: return true;
    }
  });

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

      <Panel title={`Lista (${lista.length})`} action={<Link href="/admin/padrinhos/duplas" className="text-sm text-olive underline">casais e caixas</Link>}>
        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3" role="tablist" aria-label="Filtros de padrinhos">
          {FILTROS.map((f) => (
            <Link
              key={f.k}
              role="tab"
              aria-selected={filtro === f.k}
              href={f.k === "todos" ? "/admin/padrinhos" : `/admin/padrinhos?f=${f.k}`}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide transition ${
                filtro === f.k ? "bg-moss text-white" : "bg-white text-muted shadow-card hover:text-moss"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Nome", "Papel", "Vínculo / caixa", "Lado", "Confirmação", "Traje", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Nenhum padrinho neste filtro.</td></tr>
              )}
              {lista.map((m) => {
                const v = vinculo(m.id, m.caixa_individual);
                return (
                  <tr key={m.id} className="border-t border-line align-top hover:bg-ivory">
                    <td className="px-4 py-2.5 font-medium">
                      <Link href={`/admin/padrinhos/${m.id}`} className="text-moss underline-offset-2 hover:underline">{m.nome}</Link>
                      {!m.telefone && <div className="text-xs text-warn">sem telefone</div>}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-muted">{m.papel}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${v.tom}`}>{v.label}</span>
                    </td>
                    <td className="px-4 py-2.5 capitalize text-muted">{m.lado ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${STATUS_BADGE[m.status] ?? "bg-cream text-muted"}`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{m.traje_status.replace(/_/g, " ")}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
