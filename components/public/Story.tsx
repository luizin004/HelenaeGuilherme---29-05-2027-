/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Reveal } from "./Reveal";

const MARCOS = ["2017", "2020", "2023", "2026", "2027"];

export function Story() {
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
            <p className="eyebrow text-gold">Não foi acaso. Foi construção.</p>
            <h3 className="font-serif text-2xl font-medium leading-snug text-cream sm:text-3xl">
              Antes do altar, existiram dez anos de escolhas.
            </h3>
            <p className="mt-4 leading-relaxed text-cream/85">
              Começamos com sonhos individuais. Com o tempo, eles deixaram de caminhar separados
              e passaram a apontar para o mesmo futuro.
            </p>
            <p className="mt-3 leading-relaxed text-cream/85">
              Vieram empresas, riscos, decisões, noites longas, conquistas e muitos momentos em
              que a única certeza era ter um ao outro. Foi assim que entendemos: quando duas
              pessoas unem amor, preparo e propósito, aquilo que parece sorte começa a acontecer.
            </p>
            <p className="mt-3 font-serif italic text-cream/70">
              Esta não é apenas a história de como nos encontramos. É a história de tudo o que
              fomos capazes de construir depois daquele encontro.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.15em] text-cream/60">
              {MARCOS.map((m, i) => (
                <span key={m} className="flex items-center gap-3">
                  {i > 0 && <span className="text-gold/60">·</span>}
                  {m}
                </span>
              ))}
            </div>

            <span className="btn btn-light mt-8 w-fit">
              Descobrir como chegamos até o nosso “sim”
            </span>
          </div>
        </Link>
      </Reveal>
    </section>
  );
}
