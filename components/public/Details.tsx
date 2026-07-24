import { Reveal } from "./Reveal";
import { WEDDING } from "@/lib/constants";
import type { Venue } from "@/lib/database.types";

function mapsHref(v: Venue) {
  if (v.maps_url) return v.maps_url;
  const q = encodeURIComponent(v.endereco || v.nome);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function Details({ venues }: { venues: Venue[] }) {
  const cerimonia = venues.find((v) => v.tipo === "cerimonia");
  const recepcao = venues.find((v) => v.tipo === "recepcao");

  return (
    <section id="detalhes" className="scroll-mt-20 bg-cream md:scroll-mt-28">
      <div className="mx-auto max-w-content px-6 py-24 text-center">
        <Reveal>
          <p className="eyebrow">Guarde a data</p>
          <h2 className="section-title after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
            O grande dia
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card
              icon="⛪"
              titulo="Cerimônia"
              tempo={cerimonia?.horario ?? "15h00"}
              linha1={cerimonia?.nome ?? "Local a confirmar"}
              linha2={cerimonia?.endereco ?? ""}
              href={cerimonia ? mapsHref(cerimonia) : undefined}
            />
            <Card
              icon="🥂"
              titulo="Recepção"
              tempo={recepcao?.horario ?? "Logo após a cerimônia"}
              linha1={recepcao?.nome ?? "Espaço a confirmar"}
              linha2={recepcao?.endereco ?? ""}
              href={recepcao ? mapsHref(recepcao) : undefined}
            />
            <Card
              icon="🌿"
              titulo="Traje"
              tempo={WEDDING.traje}
              linha1="Vista-se para celebrar"
              linha2="esse novo capítulo com a gente"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Card({
  icon, titulo, tempo, linha1, linha2, href,
}: {
  icon: string; titulo: string; tempo: string; linha1: string; linha2: string; href?: string;
}) {
  return (
    <article className="rounded bg-white p-7 shadow-soft transition-transform hover:-translate-y-1.5 sm:p-9">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-1 font-serif text-2xl font-semibold text-moss">{titulo}</h3>
      <p className="mb-3 text-sm uppercase tracking-[0.1em] text-olive">{tempo}</p>
      <p className="text-sm text-muted">
        {linha1}
        <br />
        {linha2}
      </p>
      {href && (
        <a href={href} target="_blank" rel="noopener" className="btn btn-outline mt-5">
          Ver rota
        </a>
      )}
    </article>
  );
}
