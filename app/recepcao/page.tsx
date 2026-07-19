import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoBlock } from "@/components/public/InfoPage";
import { getVenues } from "@/lib/data";
import { VENUES_FALLBACK } from "@/lib/constants";
import type { Venue } from "@/lib/database.types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Recepção · Helena & Guilherme",
  description: "Sítio Rancho das Águas — Itabira-MG.",
};

function mapsHref(v: Venue | undefined): string {
  if (v?.maps_url) return v.maps_url;
  if (v?.latitude && v?.longitude) return `https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v?.endereco || v?.nome || "Sítio Rancho das Águas Itabira MG")}`;
}

export default async function RecepcaoPage() {
  const venues = (await getVenues()) ?? [];
  const lista = venues.length ? venues : VENUES_FALLBACK;
  const v = lista.find((x) => x.tipo === "recepcao");

  return (
    <InfoPage
      eyebrow="A celebração continua em casa"
      titulo="Recepção"
      intro="Depois da cerimônia, queremos receber vocês em um lugar que faz parte da nossa família."
    >
      <InfoBlock titulo={v?.nome ?? "Sítio Rancho das Águas"}>
        <p>{v?.endereco ?? "Itabira — MG (sentido João Monlevade)"}</p>
        <p>
          O Rancho das Águas não foi escolhido apenas por sua beleza. Ele guarda histórias, encontros,
          trabalho, natureza e muitos momentos importantes. Foi nesse cenário que decidimos reunir as
          pessoas que amamos para celebrar o início da nossa nova família.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a href={mapsHref(v)} target="_blank" rel="noopener" className="btn btn-outline">Ver no mapa</a>
          <Link href="/como-chegar" className="btn btn-dark">Como chegar</Link>
        </div>
      </InfoBlock>

      <InfoBlock titulo="Estacionamento">
        <p>
          O estacionamento é <strong>limitado</strong>. Sempre que possível, combinem caronas e reduzam
          a quantidade de veículos — assim todos aproveitam a festa com mais tranquilidade.
        </p>
      </InfoBlock>

      <InfoBlock titulo="Preparados para o que der e vier">
        <p>Seja com sol ou com chuva, a estrutura estará organizada para receber todos com conforto.</p>
      </InfoBlock>
    </InfoPage>
  );
}
