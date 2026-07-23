import Link from "next/link";
import { Kpi, KpiGrid, Notice, PageTitle } from "@/components/admin/ui";
import { getGiftTotals, getGuestStats } from "@/lib/admin-data";
import { listPadrinhos, listParesPadrinhos } from "@/lib/comm-data";
import { resumoCaixas } from "@/domain/convites/caixas";
import { getSettings, resolveCouple } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { WEDDING } from "@/lib/constants";

export const dynamic = "force-dynamic";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MODULES = [
  { ico: "📋", titulo: "Convidados", texto: "Lista, mesas, RSVP e QR Codes individuais.", href: "/admin/convidados" },
  { ico: "🧸", titulo: "Espaço infantil", texto: "Crianças, alergias e responsáveis.", href: "/admin/infantil" },
  { ico: "💞", titulo: "Padrinhos & caixas", texto: "Papéis, casais e produção de caixas.", href: "/admin/padrinhos" },
  { ico: "📷", titulo: "Check-in", texto: "Recepção no dia via QR (câmera + offline).", href: "/admin/checkin" },
  { ico: "✉️", titulo: "Comunicação", texto: "Modelos e rascunhos de mensagens.", href: "/admin/comunicacao" },
  { ico: "🎁", titulo: "Presentes", texto: "Lista de presentes e cotas.", href: "/admin/presentes" },
  { ico: "🧮", titulo: "Montar orçamento", texto: "Catálogo de itens → vira lista de custos.", href: "/admin/orcamento" },
  { ico: "📝", titulo: "Cotações", texto: "Propostas por item, comparar e contratar.", href: "/admin/cotacoes" },
  { ico: "💰", titulo: "Financeiro", texto: "Despesas em centavos e classificação.", href: "/admin/financeiro" },
  { ico: "📆", titulo: "Contas & parcelas", texto: "Contas, cronogramas e pagamentos.", href: "/admin/contas" },
  { ico: "🧾", titulo: "Comprovantes", texto: "Recibos e notas por despesa/parcela.", href: "/admin/comprovantes" },
  { ico: "🤝", titulo: "Fornecedores", texto: "Contatos e status de negociação.", href: "/admin/fornecedores" },
  { ico: "📄", titulo: "Contratos", texto: "Contratos ligados a fornecedores.", href: "/admin/contratos" },
  { ico: "🗂️", titulo: "Documentos", texto: "Arquivos privados (links assinados).", href: "/admin/documentos" },
  { ico: "📝", titulo: "Conteúdo", texto: "História, hashtag e prazo do RSVP.", href: "/admin/conteudo" },
  { ico: "🔎", titulo: "Auditoria", texto: "Trilha de ações críticas do painel.", href: "/admin/auditoria" },
];

export default async function DashboardPage() {
  const [stats, gifts, settings, membros, pares] = await Promise.all([
    getGuestStats(),
    getGiftTotals(),
    getSettings(),
    listPadrinhos(),
    listParesPadrinhos(),
  ]);
  const couple = resolveCouple(settings);
  const dias = Math.max(0, Math.ceil((new Date(couple.dataISO).getTime() - Date.now()) / 86_400_000));
  const caixas = resumoCaixas(
    membros.map((m) => ({ id: m.id, papel: m.papel, caixa_individual: m.caixa_individual })),
    pares.map((p) => ({ member_a: p.member_a, member_b: p.member_b })),
  );

  return (
    <>
      <PageTitle>Dashboard</PageTitle>

      {!isSupabaseConfigured && (
        <Notice>
          👋 Painel em <strong>modo demonstração</strong>. Configure as variáveis do Supabase em{" "}
          <code>.env.local</code> para carregar os dados reais.
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Dias para o grande dia" value={dias} hint={WEDDING.dataExtenso} />
        <Kpi
          label="Convidados"
          value={stats.total}
          hint={`${stats.confirmados} confirmados · ${stats.pendentes} pendentes`}
        />
        <Kpi label="Presentes recebidos" value={brl(gifts.recebido)} hint={`${gifts.contribuicoes} contribuições`} />
        <Kpi label="Crianças" value={stats.criancas} hint={`${stats.adultos} adultos · ${stats.jovens} jovens`} />
      </KpiGrid>

      <h2 className="mb-3 mt-8 font-serif text-2xl text-moss">Padrinhos & caixas</h2>
      <KpiGrid>
        <Kpi label="Padrinhos e madrinhas" value={caixas.totalPadrinhos} hint={`${caixas.totalPadrinhosHomens} padrinhos · ${caixas.totalMadrinhas} madrinhas`} />
        <Kpi label="Casais vinculados" value={caixas.casaisVinculados} hint={`${caixas.semPar} a vincular`} />
        <Kpi label="Caixas confirmadas" value={caixas.caixasConfirmadas} hint={`${caixas.caixasIndividuais} individuais`} />
        <Kpi label="Caixas pendentes" value={caixas.caixasPendentes} hint={`previsão máx. ${caixas.previsaoMaxCaixas}`} />
      </KpiGrid>

      <h2 className="mb-4 mt-8 font-serif text-2xl text-moss">Módulos</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Link
            key={m.titulo}
            href={m.href}
            className="block rounded-lg bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
          >
            <div className="text-2xl">{m.ico}</div>
            <h3 className="my-1 font-serif text-2xl text-moss">{m.titulo}</h3>
            <p className="text-sm text-muted">{m.texto}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
