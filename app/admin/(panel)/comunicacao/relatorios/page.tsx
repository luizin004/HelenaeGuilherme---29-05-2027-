import Link from "next/link";
import { Kpi, KpiGrid, PageTitle, Panel, Notice } from "@/components/admin/ui";
import { getCommDashboard } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

export default async function RelatoriosComunicacaoPage() {
  const d = await getCommDashboard();
  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Relatórios de comunicação</PageTitle>
      <Notice>Acompanhe entregas, respostas, falhas e tarefas. As métricas servem para organizar a operação — nunca para pressionar convidados.</Notice>

      <KpiGrid>
        <Kpi label="Campanhas ativas" value={d.campanhasAtivas} />
        <Kpi label="Mensagens programadas" value={d.mensagensProgramadas} />
        <Kpi label="Mensagens enviadas" value={d.mensagensEnviadas} />
        <Kpi label="Falhas" value={d.falhas} />
        <Kpi label="Respostas pendentes" value={d.respostasPendentes} />
        <Kpi label="Tarefas abertas" value={d.tarefasAbertas} hint={`${d.tarefasUrgentes} urgentes`} />
        <Kpi label="Áudios p/ aprovar" value={d.audiosAguardandoAprovacao} />
        <Kpi label="WhatsApp" value={d.whatsappPendente ? "pendente" : "ativo"} />
      </KpiGrid>
    </>
  );
}
