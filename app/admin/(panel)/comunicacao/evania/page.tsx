import Link from "next/link";
import { Kpi, KpiGrid, PageTitle, Panel, Notice } from "@/components/admin/ui";
import { atualizarStatusTarefaComm } from "@/app/actions/comm";
import {
  getCommDashboard,
  getPadrinhosPendencias,
  listCommTasks,
  listInbound,
  getWhatsappChannel,
} from "@/lib/comm-data";

export const dynamic = "force-dynamic";

export default async function EvaniaOperacaoPage() {
  const [d, pend, tarefas, inbound, canal] = await Promise.all([
    getCommDashboard(),
    getPadrinhosPendencias(),
    listCommTasks(),
    listInbound(),
    getWhatsappChannel(),
  ]);
  const abertas = tarefas.filter((t) => t.status === "aberta" || t.status === "em_andamento");
  const naoResolvidas = inbound.filter((m) => !m.resolvido);

  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Operação da Evania</PageTitle>

      <Notice>
        Painel operacional da <strong>Evania</strong>, responsável inicial pela comunicação dos padrinhos. A responsável
        pode ser substituída no futuro sem perder o histórico. Canal:{" "}
        {canal?.status === "ativo" ? <strong>WhatsApp ativo</strong> : <strong>WhatsApp pendente de configuração</strong>}.
      </Notice>

      <KpiGrid>
        <Kpi label="Respostas pendentes" value={naoResolvidas.length} />
        <Kpi label="Tarefas abertas" value={abertas.length} hint={`${d.tarefasUrgentes} urgentes`} />
        <Kpi label="Padrinhos sem telefone" value={pend.semTelefone} />
        <Kpi label="Padrinhos sem confirmar" value={pend.semConfirmacao} />
        <Kpi label="Traje pendente" value={pend.trajePendente} />
        <Kpi label="Ensaio pendente" value={pend.ensaioPendente} />
        <Kpi label="Falhas de envio" value={d.falhas} />
        <Kpi label="Áudios p/ aprovar" value={d.audiosAguardandoAprovacao} />
      </KpiGrid>

      <Panel title="Tarefas" action={<Link href="/admin/comunicacao/caixa-de-entrada" className="text-sm text-olive underline">ver caixa de entrada</Link>}>
        {abertas.length === 0 ? (
          <p className="p-6 text-sm text-muted">Nenhuma tarefa aberta. 🤍</p>
        ) : (
          <ul className="divide-y divide-line">
            {abertas.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                <div>
                  <p className="font-medium text-moss">{t.titulo}</p>
                  <p className="text-xs uppercase tracking-wide text-muted">{t.categoria ?? "geral"} · {t.prioridade}{t.prazo ? ` · até ${t.prazo}` : ""}</p>
                </div>
                <form action={atualizarStatusTarefaComm} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={t.id} />
                  <select name="status" defaultValue={t.status} className="field-input py-1 text-xs">
                    {["aberta", "em_andamento", "concluida", "cancelada"].map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                  <button type="submit" className="text-xs text-olive underline">salvar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Atalhos da operação">
        <div className="flex flex-wrap gap-3 p-6">
          <Link href="/admin/padrinhos/pendencias" className="btn btn-outline">Pendências dos padrinhos</Link>
          <Link href="/admin/comunicacao/caixa-de-entrada" className="btn btn-outline">Caixa de entrada</Link>
          <Link href="/admin/comunicacao/audios/novo" className="btn btn-outline">Gravar áudio</Link>
          <Link href="/admin/comunicacao/campanhas" className="btn btn-outline">Campanhas</Link>
        </div>
      </Panel>
    </>
  );
}
