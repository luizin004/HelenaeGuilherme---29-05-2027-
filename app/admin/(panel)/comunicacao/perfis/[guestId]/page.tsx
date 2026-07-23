import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle, Panel } from "@/components/admin/ui";
import { PerfilComunicacaoForm } from "@/components/admin/comm/PerfilComunicacaoForm";
import { getGuestCommProfile, listGuestsBasic, getGuestVinculoContexto } from "@/lib/comm-data";
import { WEDDING } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PerfilConvidadoPage({ params }: { params: { guestId: string } }) {
  const [perfil, guests, contexto] = await Promise.all([
    getGuestCommProfile(params.guestId),
    listGuestsBasic(),
    getGuestVinculoContexto(params.guestId),
  ]);
  const guest = guests.find((g) => g.id === params.guestId);
  if (!guest || !contexto) notFound();

  // "Perto do prazo" = últimos 15 dias antes do encerramento do RSVP.
  const prazo = new Date(WEDDING.rsvpDeadlineISO).getTime();
  const diasParaPrazo = Math.ceil((prazo - Date.now()) / 86_400_000);
  const prazoRsvpProximo = diasParaPrazo >= 0 && diasParaPrazo <= 15;

  return (
    <>
      <div className="mb-4"><Link href="/admin/comunicacao/perfis" className="text-sm text-olive underline">← Perfis de comunicação</Link></div>
      <PageTitle>{guest.nome}</PageTitle>
      <Panel title="Perfil de comunicação">
        <PerfilComunicacaoForm guestId={params.guestId} perfil={perfil} contexto={contexto} prazoRsvpProximo={prazoRsvpProximo} />
      </Panel>
    </>
  );
}
