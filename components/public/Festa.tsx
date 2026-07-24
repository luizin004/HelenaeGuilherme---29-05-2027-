import { Reveal } from "./Reveal";
import { CARDAPIO, ATRACOES } from "@/lib/constants";

export function Festa() {
  return (
    <section id="festa" className="bg-moss-deep px-6 py-24 text-cream">
      <div className="mx-auto max-w-content">
        <Reveal>
          <p className="eyebrow text-gold">A celebração</p>
          <h2 className="section-title text-cream after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
            Uma noite para viver por inteiro
          </h2>

          <div className="grid gap-14 text-left md:grid-cols-2 md:gap-16">
            <div>
              <h3 className="text-center font-serif text-2xl text-gold md:text-left">Experiência gastronômica</h3>
              <p className="mt-3 text-center text-sm text-cream/60 md:text-left">
                Uma curadoria própria, do fogo de chão às estações doces — para cada fase da noite.
              </p>
              <ul className="mt-8 divide-y divide-cream/10 border-t border-cream/10">
                {CARDAPIO.map((c) => (
                  <li key={c.nome} className="flex items-start justify-between gap-6 py-4">
                    <div>
                      <p className="font-serif text-lg text-cream">{c.nome}</p>
                      <p className="mt-1 text-sm text-cream/55">{c.descricao}</p>
                    </div>
                    <span className="shrink-0 pt-1 text-[11px] uppercase tracking-[0.2em] text-gold">
                      {c.tag}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-center font-serif text-2xl text-gold md:text-left">Atrações musicais</h3>
              <p className="mt-3 text-center text-sm text-cream/60 md:text-left">
                Cinco atrações. Do rock ao samba, do pagode à pista de dança — uma celebração para
                reunir diferentes histórias, gerações e estilos.
              </p>
              <ul className="mt-8 divide-y divide-cream/10 border-t border-cream/10">
                {ATRACOES.map((a) => (
                  <li key={a.nome} className="flex items-baseline justify-between gap-6 py-4">
                    <span className="font-serif text-lg text-cream">{a.nome}</span>
                    <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-gold">{a.tipo}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
