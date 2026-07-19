import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { classificarInbound, resolverInbound, criarTarefaDeInbound } from "@/app/actions/comm";
import { listInbound } from "@/lib/comm-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const CLASSES = ["confirmacao", "recusa", "duvida", "telefone", "hospedagem", "transporte", "traje", "medidas", "ensaio", "rota", "problema", "agradecimento", "outro"];
const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default async function CaixaEntradaPage() {
  const mensagens = await listInbound();
  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>Caixa de entrada</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para ver as respostas.</Notice>}
      <Notice>
        Respostas dos convidados chegam aqui quando o WhatsApp estiver ligado. A classificação da IA é apenas
        <strong> sugestão</strong> — nunca altera RSVP, padrinho, ingresso ou pagamento automaticamente.
      </Notice>

      <Panel title={`Mensagens recebidas (${mensagens.length})`}>
        {mensagens.length === 0 ? (
          <p className="p-6 text-sm text-muted">Nenhuma mensagem recebida ainda.</p>
        ) : (
          <ul className="divide-y divide-line">
            {mensagens.map((m) => (
              <li key={m.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted">{fmt(m.criado_em)} · {m.canal} · {m.tipo}{m.telefone ? ` · ${m.telefone}` : ""}</span>
                  {m.resolvido ? <span className="text-xs text-success">resolvida</span> : <span className="text-xs text-warn">aberta</span>}
                </div>
                <p className="mt-1 text-sm text-moss">{m.corpo || (m.tipo === "audio" ? "🎙️ áudio recebido" : "—")}</p>
                {m.transcricao && <p className="mt-1 text-xs text-muted">Transcrição{m.transcricao_auto ? " (automática — revisar)" : ""}: {m.transcricao}</p>}
                {m.classificacao_sugerida && !m.classificacao && (
                  <p className="mt-1 text-xs text-olive">Sugestão da IA: {m.classificacao_sugerida}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <form action={classificarInbound} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={m.id} />
                    <select name="classificacao" defaultValue={m.classificacao ?? ""} className="field-input py-1 text-xs">
                      <option value="">classificar…</option>
                      {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="submit" className="text-xs text-olive underline">salvar</button>
                  </form>
                  <form action={criarTarefaDeInbound}>
                    <input type="hidden" name="inbound_id" value={m.id} />
                    <button type="submit" className="text-xs text-olive underline">criar tarefa</button>
                  </form>
                  {!m.resolvido && (
                    <form action={resolverInbound}>
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="text-xs text-success underline">marcar resolvida</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
