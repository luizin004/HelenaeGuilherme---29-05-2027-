import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { PromptTester } from "@/components/admin/comm/PromptTester";
import { getPrompt, listPromptVersions, listGuestsBasic } from "@/lib/comm-data";
import { firstName } from "@/domain/comm/personalize";

export const dynamic = "force-dynamic";

export default async function TestarPromptPage({ params }: { params: { id: string } }) {
  const prompt = await getPrompt(params.id);
  if (!prompt) notFound();
  const [versoes, guests] = await Promise.all([listPromptVersions(params.id), listGuestsBasic()]);
  const publicada = versoes.find((v) => v.id === prompt.versao_publicada_id) ?? versoes[0] ?? null;
  const permitido = Array.isArray(publicada?.variaveis_permitidas)
    ? (publicada!.variaveis_permitidas as string[])
    : ["primeiro_nome", "nome", "papel", "cidade", "fase_jornada"];

  // Máscara: só primeiro nome + inicial do sobrenome (privacidade em teste).
  const convidados = guests.slice(0, 40).map((g) => {
    const partes = g.nome.trim().split(/\s+/);
    const inicial = partes[1]?.[0] ? ` ${partes[1][0]}.` : "";
    return { id: g.id, nomeMascarado: `${firstName(g.nome)}${inicial}` };
  });

  return (
    <>
      <div className="mb-4"><Link href={`/admin/comunicacao/prompts/${prompt.id}`} className="text-sm text-olive underline">← {prompt.nome}</Link></div>
      <PageTitle>Testar prompt</PageTitle>
      <Notice>
        Ambiente de teste seguro: os dados de convidados reais aparecem <strong>mascarados</strong> e os campos
        privados são removidos antes de qualquer geração. Avalie e salve boas saídas como exemplo.
      </Notice>
      <Panel title={`Teste · versão ${publicada?.versao ?? "—"}`}>
        <PromptTester
          promptId={prompt.id}
          versionId={publicada?.id ?? null}
          contextoPermitido={permitido}
          cta={publicada?.call_to_action}
          convidados={convidados}
        />
      </Panel>
    </>
  );
}
