/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Reveal } from "./Reveal";
import type { StoryEvent } from "@/lib/database.types";

export function Story({ eventos }: { eventos: StoryEvent[] }) {
  return (
    <section id="historia" className="mx-auto max-w-content scroll-mt-20 px-6 py-24 md:scroll-mt-28">
      <Reveal>
        <div className="text-center">
          <p className="eyebrow">O começo de tudo</p>
          <h2 className="section-title after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
            Nossa história
          </h2>
        </div>

        <Link
          href="/historia"
          className="group mt-12 grid overflow-hidden rounded-xl shadow-soft transition-shadow hover:shadow-[0_20px_60px_rgba(51,59,43,0.18)] md:grid-cols-2"
        >
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto">
            <img
              src="/images/galeria/galeria-2-retrato.jpg"
              alt="Helena e Guilherme"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          <div className="flex flex-col justify-center bg-moss-deep px-8 py-10 text-cream sm:px-12 sm:py-14">
            <p className="eyebrow text-gold">Do zero, juntos</p>
            <p className="font-serif text-xl italic leading-relaxed text-cream/90 sm:text-2xl">
              Dois jovens de Itabira, sonhos que pareciam andar sozinhos — até se encontrarem. Dez
              anos de recomeços, negócios construídos com as próprias mãos e a certeza de que nada
              valeria a pena sem o outro ao lado.
            </p>
            <p className="mt-4 text-sm text-cream/70">Nada foi fácil. Mas foi tudo por amor.</p>

            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.15em] text-cream/60">
              {eventos.map((e, i) => (
                <span key={e.id} className="flex items-center gap-3">
                  {i > 0 && <span className="text-gold/60">·</span>}
                  {e.ano}
                </span>
              ))}
            </div>

            <span className="btn btn-light mt-8 w-fit">
              Conhecer nossa história completa
            </span>
          </div>
        </Link>
      </Reveal>
    </section>
  );
}
