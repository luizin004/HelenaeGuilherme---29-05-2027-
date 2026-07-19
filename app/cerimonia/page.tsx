import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoBlock } from "@/components/public/InfoPage";
import { getVenues } from "@/lib/data";
import { VENUES_FALLBACK, WEDDING } from "@/lib/constants";
import type { Venue } from "@/lib/database.types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Cerimônia · Helena & Guilherme",
  description: "Igreja Nossa Senhora da Piedade — Campestre, Itabira-MG.",
};

function mapsHref(v: Venue | undefined): string {
  if (v?.maps_url) return v.maps_url;
  if (v?.latitude && v?.longitude) return `https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v?.endereco || v?.nome || "Igreja Nossa Senhora da Piedade Campestre Itabira MG")}`;
}

export default async function CerimoniaPage() {
  const venues = (await getVenues()) ?? [];
  const lista = venues.length ? venues : VENUES_FALLBACK;
  const v = lista.find((x) => x.tipo === "cerimonia");

  return (
    <InfoPage
      eyebrow="O sim"
      titulo="Cerimônia"
      intro={`${WEDDING.dataExtenso} · ${v?.horario ?? "15h00"}`}
    >
      <InfoBlock titulo={v?.nome ?? "Igreja Nossa Senhora da Piedade"}>
        <p>{v?.endereco ?? "Campestre, Itabira — MG"}</p>
        <p>
          Nossa cerimônia será celebrada com quem amamos. Recomendamos chegar com antecedência para
          acompanhar esse momento com tranquilidade.
        </p>
        <div className="pt-2">
          <a href={mapsHref(v)} target="_blank" rel="noopener" className="btn btn-outline">Ver no mapa</a>
        </div>
      </InfoBlock>

      <InfoBlock titulo="Traje">
        <p>
          {WEDDING.traje}. Como a recepção acontece em ambiente campestre, recomendamos atenção à
          escolha do calçado.
        </p>
      </InfoBlock>

      <p className="text-center text-sm text-muted">
        Depois da cerimônia, seguimos para a <Link href="/recepcao" className="text-olive underline">recepção no Rancho das Águas</Link>.{" "}
        Veja também <Link href="/como-chegar" className="text-olive underline">como chegar</Link>.
      </p>
    </InfoPage>
  );
}
