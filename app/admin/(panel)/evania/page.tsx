import Link from "next/link";
import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { CopyMensagem } from "@/components/admin/CopyMensagem";
import { EvaniaConfigForm } from "@/components/admin/EvaniaConfigForm";
import { getEvaniaConfig, getEvaniaAgenda, type EvaniaAgenda, type ParcelaDetalhe } from "@/lib/admin-data";
import { formatCents, sumCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import { WEDDING } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG = {
  ativa: true, grupo_nome: null, grupo_link: null, grupo_numero: null, horario: "08:00",
  dias: "seg,ter,qua,qui,sex", canais: "painel", responsaveis: null,
  lembrete_30d: true, lembrete_15d: true, lembrete_7d: true, lembrete_3d: true, lembrete_1d: true, lembrete_dia: true, lembrete_apos: true, observacao: null,
};

/** Monta a mensagem que a Evania enviaria hoje (para copiar no grupo). */
function montarMensagem(agenda: EvaniaAgenda): string {
  const linha = (p: ParcelaDetalhe) => `• ${p.descricao} — ${formatCents(p.valor_cents)} (resp.: ${p.responsavel})`;
  if (agenda.hoje.length > 0) {
    const total = sumCents(agenda.hoje.map((p) => p.valor_cents));
    const corpo = agenda.hoje.map(linha).join("\n");
    return [
      `Bom dia, ${WEDDING.noiva} e ${WEDDING.noivo}! ☀️`,
      `Hoje temos ${agenda.hoje.length} pagamento(s) programado(s):`,
      "",
      corpo,
      "",
      `Total previsto hoje: ${formatCents(total)}`,
      "",
      "Após pagar, envie o comprovante aqui no grupo ou pelo sistema para a conciliação. — Evania 💌",
    ].join("\n");
  }
  if (agenda.vencidas.length > 0) {
    const total = sumCents(agenda.vencidas.map((p) => p.valor_cents));
    return [
      `Atenção, ${WEDDING.noiva} e ${WEDDING.noivo}. ⚠️`,
      `Há ${agenda.vencidas.length} pagamento(s) vencido(s), somando ${formatCents(total)}:`,
      "",
      agenda.vencidas.map((p) => `• ${p.descricao} — ${formatCents(p.valor_cents)} (venceu ${fmtDateBR(p.vencimento)})`).join("\n"),
      "",
      "Vamos regularizar? — Evania",
    ].join("\n");
  }
  if (agenda.semana.length > 0) {
    const total = sumCents(agenda.semana.map((p) => p.valor_cents));
    return [
      `Bom dia! Nada vence hoje. 🎉`,
      `Nos próximos 7 dias há ${agenda.semana.length} pagamento(s) (${formatCents(total)}):`,
      "",
      agenda.semana.map((p) => `• ${fmtDateBR(p.vencimento)} — ${p.descricao} — ${formatCents(p.valor_cents)}`).join("\n"),
      "",
      "— Evania",
    ].join("\n");
  }
  return "Bom dia! Nenhum pagamento programado para hoje nem para os próximos 7 dias. Tudo em dia. 🤍 — Evania";
}

function ListaParcelas({ itens }: { itens: ParcelaDetalhe[] }) {
  if (itens.length === 0) return <p className="px-6 py-4 text-sm text-muted">Nada aqui.</p>;
  return (
    <ul className="divide-y divide-line">
      {itens.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 text-sm">
          <span>
            <span className="font-medium">{p.descricao}</span>
            <span className="ml-2 text-xs text-muted">{fmtDateBR(p.vencimento)} · {p.responsavel}</span>
          </span>
          <span className="font-serif text-moss">{formatCents(p.valor_cents)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function EvaniaPage() {
  const [config, agenda] = await Promise.all([getEvaniaConfig(), getEvaniaAgenda()]);
  const cfg = config ?? DEFAULT_CONFIG;
  const mensagem = montarMensagem(agenda);

  const diagnosticos = [
    { label: "Parcelas vencidas", n: agenda.vencidas.length, href: "/admin/contas-a-pagar", cor: "text-danger" },
    { label: "Pagas sem comprovante", n: agenda.pagasSemComprovante.length, href: "/admin/contratos", cor: "text-warn" },
    { label: "Itens sem valor (a cotar)", n: agenda.itensSemValor, href: "/admin/financeiro?t=cotacoes", cor: "text-warn" },
    { label: "Com valor, sem parcelas", n: agenda.comValorSemParcela, href: "/admin/financeiro?t=contas&sec=parcelas", cor: "text-warn" },
    { label: "Fornecedores sem contrato", n: agenda.fornecedoresSemContrato, href: "/admin/contratos", cor: "text-muted" },
  ];

  return (
    <>
      <PageTitle>Evania · assistente financeira</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para a Evania acompanhar o financeiro.</Notice>
      ) : (
        <Notice>
          A Evania acompanha a agenda financeira e nunca paga nada — ela lembra, organiza e concilia.
          {cfg.ativa ? " Está ativa." : " Está desativada nas configurações."}
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Vencem hoje" value={formatCents(sumCents(agenda.hoje.map((p) => p.valor_cents)))} hint={`${agenda.hoje.length} parcela(s)`} />
        <Kpi label="Próximos 7 dias" value={formatCents(sumCents(agenda.semana.map((p) => p.valor_cents)))} hint={`${agenda.semana.length} parcela(s)`} />
        <Kpi label="Este mês" value={formatCents(sumCents(agenda.mes.map((p) => p.valor_cents)))} hint={`${agenda.mes.length} parcela(s)`} />
        <Kpi label="Vencidas" value={formatCents(sumCents(agenda.vencidas.map((p) => p.valor_cents)))} hint={`${agenda.vencidas.length} parcela(s)`} />
      </KpiGrid>

      <Panel title="Mensagem do dia (copie para o grupo)">
        <div className="p-6"><CopyMensagem texto={mensagem} /></div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`Vencem hoje (${agenda.hoje.length})`}><ListaParcelas itens={agenda.hoje} /></Panel>
        <Panel title={`Próximos 7 dias (${agenda.semana.length})`}><ListaParcelas itens={agenda.semana} /></Panel>
      </div>

      <Panel title="Diagnósticos da Evania">
        <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {diagnosticos.map((d) => (
            <Link key={d.label} href={d.href} className="flex items-center justify-between rounded-lg border border-line px-4 py-3 hover:bg-ivory">
              <span className="text-sm text-muted">{d.label}</span>
              <span className={`font-serif text-xl ${d.n > 0 ? d.cor : "text-muted"}`}>{d.n}</span>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Configuração da Evania">
        <div className="p-6"><EvaniaConfigForm config={cfg} /></div>
      </Panel>
    </>
  );
}
