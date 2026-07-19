import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle, Panel } from "@/components/admin/ui";
import { PerfilComunicacaoForm } from "@/components/admin/comm/PerfilComunicacaoForm";
import { getGuestCommProfile, listGuestsBasic } from "@/lib/comm-data";

export const dynamic = "force-dynamic";

export default async function PerfilConvidadoPage({ params }: { params: { guestId: string } }) {
  const [perfil, guests] = await Promise.all([getGuestCommProfile(params.guestId), listGuestsBasic()]);
  const guest = guests.find((g) => g.id === params.guestId);
  if (!guest) notFound();

  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao/perfis" className="text-sm text-olive underline">← Perfis de comunicação</Link></div>
      <PageTitle>{guest.nome}</PageTitle>
      <Panel title="Perfil de comunicação">
        <PerfilComunicacaoForm guestId={params.guestId} perfil={perfil} />
      </Panel>
    </>
  );
}
