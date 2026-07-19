import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { NovaTarefaPadrinho } from "@/components/admin/comm/NovaTarefaPadrinho";
import { atualizarStatusTarefaPadrinho } from "@/app/actions/padrinhos";
import { listPartyTasks, listPadrinhos } from "@/lib/comm-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const PRIO: Record<string, string> = {
  urgente: "bg-[#f4e2dc] text-danger", alta: "bg-[#f6ecd6] text-warn",
  normal: "bg-cream text-muted", baixa: "bg-cream text-muted",
};

export default async function TarefasPadrinhosPage() {
  const [tarefas, membros] = await Promise.all([listPartyTasks(), listPadrinhos()]);
  const nome = (id: string | null) => membros.find((m) => m.id === id)?.nome ?? "—";

  return (
    <>
      <div className="mb-4"><Link href="/admin/padrinhos" className="text-sm text-olive underline">← Padrinhos</Link></div>
      <PageTitle>Tarefas dos padrinhos</PageTitle>
      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para gerenciar tarefas.</Notice>}

      <Panel title="Nova tarefa">
        <NovaTarefaPadrinho membros={membros.map((m) => ({ id: m.id, nome: m.nome }))} />
      </Panel>

      <Panel title={`Tarefas (${tarefas.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>{["Tarefa", "Padrinho", "Prioridade", "Prazo", "Status", "Ação"].map((h) => (
                <th key={h} className="bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {tarefas.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Nenhuma tarefa ainda.</td></tr>}
              {tarefas.map((t) => (
                <tr key={t.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="px-4 py-2.5 font-medium">{t.titulo}</td>
                  <td className="px-4 py-2.5 text-muted">{nome(t.member_id)}</td>
                  <td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-xs ${PRIO[t.prioridade] ?? "bg-cream text-muted"}`}>{t.prioridade}</span></td>
                  <td className="px-4 py-2.5 text-muted">{t.prazo ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{t.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2.5">
                    <form action={atualizarStatusTarefaPadrinho} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={t.id} />
                      <select name="status" defaultValue={t.status} className="field-input py-1 text-xs">
                        {["aberta", "em_andamento", "concluida", "cancelada"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                      <button type="submit" className="text-xs text-olive underline">salvar</button>
                    </form>
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
