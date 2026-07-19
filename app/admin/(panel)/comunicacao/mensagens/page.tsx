import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovoComunicado } from "@/components/admin/NovoComunicado";
import { ComunicadoActions } from "@/components/admin/ComunicadoActions";
import { listCommunications } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default async function MensagensPage() {
  const mensagens = await listCommunications();

  return (
    <>
      <PageTitle>Mensagens e modelos</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase para criar mensagens.</Notice>}

      <Notice>
        O <strong>envio automático</strong> (e-mail/WhatsApp) depende do canal validado. Aqui você monta e guarda
        os modelos/rascunhos que as campanhas e a Evania podem reutilizar.
      </Notice>

      <Panel title="Nova mensagem">
        <div className="p-6">
          <NovoComunicado />
        </div>
      </Panel>

      <Panel title="Mensagens">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Quando", "Canal", "Público", "Assunto", "Status", "Ações"].map((h) => (
                  <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mensagens.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Nenhuma mensagem ainda.</td></tr>
              )}
              {mensagens.map((m) => (
                <tr key={m.id} className="border-t border-line align-top hover:bg-ivory">
                  <td className="whitespace-nowrap px-6 py-3 text-muted">{fmt(m.criado_em)}</td>
                  <td className="px-6 py-3 capitalize">{m.canal}</td>
                  <td className="px-6 py-3 capitalize text-muted">{m.publico}</td>
                  <td className="px-6 py-3">{m.assunto || "—"}</td>
                  <td className="px-6 py-3">
                    <span className="inline-block rounded-full bg-cream px-3 py-0.5 text-xs uppercase tracking-wide text-muted">{m.status}</span>
                  </td>
                  <td className="px-6 py-3">
                    <ComunicadoActions m={{ id: m.id, canal: m.canal, assunto: m.assunto, corpo: m.corpo, publico: m.publico, status: m.status }} />
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
