import Link from "next/link";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { WhatsappForm } from "@/components/admin/comm/WhatsappForm";
import { getWhatsappChannel } from "@/lib/comm-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const STATUS_TXT: Record<string, string> = {
  pendente: "Pendente de configuração",
  validando: "Em validação",
  ativo: "Ativo",
  erro: "Com erro",
};

export default async function WhatsappConfigPage() {
  const canal = await getWhatsappChannel();
  const ativo = canal?.status === "ativo";

  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao" className="text-sm text-olive underline">← Comunicação</Link></div>
      <PageTitle>WhatsApp oficial</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase e faça login para configurar o canal.</Notice>}

      <Notice>
        Status atual: <strong>{STATUS_TXT[canal?.status ?? "pendente"]}</strong>.{" "}
        {!ativo && "Enquanto o canal não estiver validado pelo provedor, as campanhas podem ser preparadas, mas o envio fica bloqueado."}
      </Notice>

      <Notice>
        🔒 As <strong>credenciais</strong> (tokens do provedor) ficam em <strong>variáveis de ambiente</strong> — nunca
        são salvas aqui nem aparecem no navegador. Esta tela guarda apenas número, responsável, horários e limites.
      </Notice>

      <Panel title="Configuração do canal">
        <WhatsappForm canal={canal} />
      </Panel>
    </>
  );
}
