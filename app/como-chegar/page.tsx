import type { Metadata } from "next";
import { InfoPage, InfoBlock } from "@/components/public/InfoPage";
import { getVenues } from "@/lib/data";
import { VENUES_FALLBACK, ROTA_ETAPAS } from "@/lib/constants";
import type { Venue } from "@/lib/database.types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Como chegar · Helena & Guilherme",
  description: "Rota detalhada até o Sítio Rancho das Águas.",
};

function mapsHref(v: Venue | undefined): string {
  if (v?.maps_url) return v.maps_url;
  if (v?.latitude && v?.longitude) return `https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`;
  const q = encodeURIComponent(v?.endereco || v?.nome || "Sítio Rancho das Águas, Itabira MG");
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
function wazeHref(v: Venue | undefined): string {
  if (v?.latitude && v?.longitude) return `https://waze.com/ul?ll=${v.latitude},${v.longitude}&navigate=yes`;
  const q = encodeURIComponent(v?.endereco || v?.nome || "Sítio Rancho das Águas, Itabira MG");
  return `https://waze.com/ul?q=${q}&navigate=yes`;
}

export default async function ComoChegarPage() {
  const venues = (await getVenues()) ?? [];
  const lista = venues.length ? venues : VENUES_FALLBACK;
  const recepcao = lista.find((v) => v.tipo === "recepcao");
  const semCoordenada = !recepcao?.latitude || !recepcao?.longitude;

  return (
    <InfoPage
      eyebrow="Chegue com tranquilidade"
      titulo="Como chegar"
      intro="Preparamos uma rota detalhada até o Rancho das Águas. Recomendamos abrir a localização antes de sair e manter o mapa carregado — alguns trechos podem ter sinal instável."
    >
      <div className="flex flex-wrap justify-center gap-3">
        <a href={mapsHref(recepcao)} target="_blank" rel="noopener" className="btn btn-dark">Abrir no Google Maps</a>
        <a href={wazeHref(recepcao)} target="_blank" rel="noopener" className="btn btn-outline">Abrir no Waze</a>
      </div>

      {semCoordenada && (
        <p className="rounded-lg bg-gold-soft/50 px-4 py-3 text-center text-sm text-moss">
          A localização digital exata do portão está sendo finalizada. Por ora, os botões usam busca
          pelo endereço — siga também as etapas abaixo.
        </p>
      )}

      <ol className="relative space-y-5 border-l border-gold/50 pl-6">
        {ROTA_ETAPAS.map((e, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-gold bg-ivory text-xs font-medium text-olive">
              {i + 1}
            </span>
            <div className="rounded-lg bg-white p-4 shadow-card">
              <h2 className="font-serif text-lg text-moss">{e.titulo}</h2>
              <p className="text-sm text-muted">{e.detalhe}</p>
            </div>
          </li>
        ))}
      </ol>

      <InfoBlock titulo="Dica de deslocamento">
        <p>
          O estacionamento do sítio é <strong>limitado</strong>. Sempre que possível, combine caronas
          com família e amigos e reduza a quantidade de carros — assim todos aproveitam com mais
          conforto.
        </p>
      </InfoBlock>
    </InfoPage>
  );
}
