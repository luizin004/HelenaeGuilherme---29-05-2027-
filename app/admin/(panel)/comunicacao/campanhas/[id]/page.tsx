import Link from "next/link";
import { notFound } from "next/navigation";
import { Kpi, KpiGrid, PageTitle, Panel, Notice } from "@/components/admin/ui";
import { aprovarCampanha, agendarCampanha, pausarCampanha, recalcularAudiencia } from "@/app/actions/comm";
import {
  getCampaign,
  listCampaignAudience,
  listGuestsBasic,
  listGuestsForAudience,
  getWhatsappChannel,
} from "@/lib/comm-data";
import { podeEnviar } from "@/domain/comm/consent";
import { MOTIVO_LABEL } from "@/domain/comm/audience";

export const dynamic = "force-dynamic";

export default async function CampanhaDetalhe({ params }: { params: { id: string } }) {
  const campanha = await getCampaign(params.id);
  if (!campanha) notFound();

  const [audiencia, guests, pessoas, canal] = await Promise.all([
    listCampaignAudience(params.id),
    listGuestsBasic(),
    listGuestsForAudience(),
    getWhatsappChannel(),
  ]);
  const nome = (id: string | null) => guests.find((g) => g.id === id)?.nome ?? "—";
  const pessoaMap = new Map(pessoas.map((p) => [p.id, p]));
  const canalValidado = canal?.status === "ativo";
  const inicioMin = Number((canal?.horario_inicio ?? "08:00").slice(0, 2)) * 60;
  const fimMin = Number((canal?.horario_fim ?? "20:00").slice(0, 2)) * 60;

  const incluidos = audiencia.filter((a) => a.incluido);
  const excluidos = audiencia.filter((a) => !a.incluido);

  // Prévia de envio por pessoa (consentimento/telefone) — ilustra §19 sem enviar nada.
  const prontos = incluidos.filter((a) => {
    const p = a.guest_id ? pessoaMap.get(a.guest_id) : undefined;
    if (!p) return false;
    const r = podeEnviar({
      canal: campanha.canal === "email" ? "email" : "whatsapp",
      perfil: { telefone: p.telefone, aceitaWhatsapp: true, optOut: p.optOut ?? false },
      canalValidado: true, // avalia só consentimento/telefone/janela; o canal real é checado no envio
      enviosRecentes: 0,
      limitePorPessoa: canal?.limite_por_pessoa ?? 3,
      janela: { agoraMin: 12 * 60, inicioMin, fimMin },
    });
    return r.ok;
  }).length;

  const podeAprovar = campanha.status === "rascunho" || campanha.status === "revisao";

  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao/campanhas" className="text-sm text-olive underline">← Campanhas</Link></div>
      <PageTitle>{campanha.nome}</PageTitle>

      <Notice>
        Canal: {campanha.canal} · Aprovação: {campanha.aprovacao_tipo} · Status: <strong>{campanha.status}</strong>.{" "}
        {!canalValidado && "O WhatsApp ainda não está validado — o envio fica bloqueado."}
      </Notice>

      <KpiGrid>
        <Kpi label="Na audiência" value={incluidos.length} />
        <Kpi label="Excluídos" value={excluidos.length} />
        <Kpi label="Prontos p/ envio" value={prontos} hint="consentimento + telefone" />
        <Kpi label="Sem telefone" value={incluidos.filter((a) => { const p = a.guest_id ? pessoaMap.get(a.guest_id) : undefined; return p && !p.telefone; }).length} />
      </KpiGrid>

      <Panel
        title={`Audiência incluída (${incluidos.length})`}
        action={
          <form action={recalcularAudiencia}>
            <input type="hidden" name="id" value={campanha.id} />
            <button type="submit" className="text-sm text-olive underline">recalcular</button>
          </form>
        }
      >
        <div className="flex flex-wrap gap-2 p-6">
          {incluidos.length === 0 && <span className="text-sm text-muted">Ninguém na audiência com os filtros atuais.</span>}
          {incluidos.map((a) => {
            const p = a.guest_id ? pessoaMap.get(a.guest_id) : undefined;
            const semTel = p && !p.telefone;
            return (
              <span key={a.id} className={`rounded-full border px-3 py-1 text-sm ${semTel ? "border-warn text-warn" : "border-line text-moss"}`}>
                {nome(a.guest_id)}{semTel ? " · sem telefone" : ""}
              </span>
            );
          })}
        </div>
      </Panel>

      {excluidos.length > 0 && (
        <Panel title={`Excluídos (${excluidos.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr>{["Convidado", "Motivo"].map((h) => (
                <th key={h} className="bg-cream px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
              ))}</tr></thead>
              <tbody>
                {excluidos.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="px-4 py-2 text-muted">{nome(a.guest_id)}</td>
                    <td className="px-4 py-2 text-muted">{MOTIVO_LABEL[a.motivo_exclusao ?? ""] ?? a.motivo_exclusao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Panel title="Fluxo">
        <div className="flex flex-wrap items-end gap-4 p-6">
          {podeAprovar && (
            <form action={aprovarCampanha}>
              <input type="hidden" name="id" value={campanha.id} />
              <button type="submit" className="btn btn-dark">Aprovar (noivos/admin)</button>
            </form>
          )}
          <form action={agendarCampanha} className="flex items-end gap-2">
            <input type="hidden" name="id" value={campanha.id} />
            <div className="flex flex-col gap-1">
              <label className="field-label">Agendar para</label>
              <input type="datetime-local" name="agendado_para" className="field-input" />
            </div>
            <button type="submit" className="btn btn-outline">Agendar</button>
          </form>
          {campanha.status !== "pausada" && (
            <form action={pausarCampanha}>
              <input type="hidden" name="id" value={campanha.id} />
              <button type="submit" className="btn btn-outline">Pausar</button>
            </form>
          )}
        </div>
        <p className="px-6 pb-6 text-sm text-muted">
          O envio efetivo depende do canal validado. Enquanto isso, a campanha fica preparada e auditável.
        </p>
      </Panel>
    </>
  );
}
