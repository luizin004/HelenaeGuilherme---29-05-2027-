/* eslint-disable @next/next/no-img-element */
import { Reveal } from "./Reveal";
import type { GalleryPhoto } from "@/lib/database.types";

export function Gallery({ fotos }: { fotos: GalleryPhoto[] }) {
  const items = fotos.length
    ? fotos
    : Array.from({ length: 6 }, (_, i) => ({ id: String(i), url: "", legenda: `Foto ${i + 1}` }));

  return (
    <section id="galeria" className="mx-auto max-w-content px-6 py-24 text-center">
      <Reveal>
        <p className="eyebrow">Momentos</p>
        <h2 className="section-title after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
          Galeria
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((f) => (
            <figure key={f.id} className="aspect-[4/5] overflow-hidden rounded">
              {f.url ? (
                <img src={f.url} alt={f.legenda ?? ""} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gold to-olive font-serif text-xl text-white/80">
                  {f.legenda}
                </div>
              )}
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
