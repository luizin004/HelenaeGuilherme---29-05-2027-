import Link from "next/link";
import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { getCommDashboard } from "@/lib/comm-data";
import { getPadrinhosPendencias } from "@/lib/comm-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const ATALHOS: { href: string; ico: string; titulo: string; desc: string }[] = [
  { href: "/admin/comunicacao/evania", ico: "💌", titulo: "Operação da Evania", desc: "O dia a dia: pendências, respostas e tarefas." },
  { href: "/admin/comunicacao/jornadas", ico: "🧭", titulo: "Jornadas", desc: "Fases de aquecimento por público." },
  { href: "/admin/comunicacao/campanhas", ico: "📢", titulo: "Campanhas", desc: "Envios manuais, programados e condicionais." },
  { href: "/admin/comunicacao/audios", ico: "🎙️", titulo: "Áudios", desc: "Gravar, aprovar e reutilizar áudios." },
  { href: "/admin/comunicacao/caixa-de-entrada", ico: "📥", titulo: "Caixa de entrada", desc: "Respostas dos convidados." },
  { href: "/admin/comunicacao/prompts", ico: "🪄", titulo: "Estúdio de prompts", desc: "Mensagens da IA, versionadas." },
  { href: "/admin/padrinhos", ico: "👰", titulo: "Padrinhos & madrinhas", desc: "Cadastro, pendências e jornada." },
  { href: "/admin/configuracoes/comunicacao/whatsapp", ico: "🟢", titulo: "WhatsApp oficial", desc: "Configurar o canal de envio." },
];

export default async function ComunicacaoVisaoGeral() {
  const [d, pend] = await Promise.all([getCommDashboard(), getPadrinhosPendencias()]);

  return (
    <>
      <PageTitle>Central de comunicação</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver os dados.</Notice>}

      {d.whatsappPendente && (
        <Notice>
          <strong>WhatsApp oficial pendente de configuração.</strong> É possível montar jornadas, campanhas e
          mensagens, mas o envio só é liberado após validar o canal em{" "}
          <Link href="/admin/configuracoes/comunicacao/whatsapp" className="underline">WhatsApp oficial</Link>.
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Campanhas ativas" value={d.campanhasAtivas} />
        <Kpi label="Programadas" value={d.mensagensProgramadas} />
        <Kpi label="Respostas pendentes" value={d.respostasPendentes} />
        <Kpi label="Falhas de envio" value={d.falhas} />
        <Kpi label="Tarefas abertas" value={d.tarefasAbertas} hint={`${d.tarefasUrgentes} urgentes`} />
        <Kpi label="Áudios p/ aprovar" value={d.audiosAguardandoAprovacao} />
        <Kpi label="Padrinhos" value={pend.total} hint={`${pend.semConfirmacao} sem confirmar`} />
        <Kpi label="Padrinhos sem telefone" value={pend.semTelefone} />
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

      <Notice>
        Toda mensagem crítica passa por <strong>revisão humana</strong> e aprovação. A IA cria apenas rascunhos e
        nunca envia sozinha. Nada de dados inventados: parentesco, histórias e apelidos vêm só do cadastro autorizado.
      </Notice>
    </>
  );
}
