import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle, Panel, Notice } from "@/components/admin/ui";
import { PadrinhoEditForm } from "@/components/admin/comm/PadrinhoEditForm";
import { getPadrinho } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

export default async function PadrinhoPage({ params }: { params: { id: string } }) {
  const m = await getPadrinho(params.id);
  if (!m) notFound();

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/padrinhos" className="text-sm text-olive underline">← Padrinhos</Link>
      </div>
      <PageTitle>{m.nome}</PageTitle>

      <Notice>
        {m.papel === "madrinha" ? "Madrinha" : "Padrinho"}
        {m.lado ? ` · lado ${m.lado}` : ""}
        {m.cidade ? ` · ${m.cidade}` : ""}
        {m.instagram ? ` · ${m.instagram}` : ""}
        {m.telefone ? ` · ${m.telefone}` : " · sem telefone"}
      </Notice>

      <Panel title="Acompanhamento">
        <PadrinhoEditForm m={m} />
      </Panel>
    </>
  );
}
