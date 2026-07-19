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

          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="mb-5 text-center font-serif text-2xl text-gold md:text-left">Experiência gastronômica</h3>
              <ul className="grid gap-3">
                {CARDAPIO.map((c) => (
                  <li key={c.nome} className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
                    <span className="text-2xl">{c.icone}</span>
                    <div>
                      <p className="font-medium">{c.nome}</p>
                      <p className="text-sm text-cream/70">{c.descricao}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-center font-serif text-2xl text-gold md:text-left">Atrações musicais</h3>
              <p className="mb-4 text-sm text-cream/80">
                Cinco atrações. Do rock ao samba, do pagode à pista de dança — uma celebração para
                reunir diferentes histórias, gerações e estilos.
              </p>
              <ul className="grid gap-3">
                {ATRACOES.map((a) => (
                  <li key={a.nome} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                    <span className="font-serif text-lg">{a.nome}</span>
                    <span className="text-xs uppercase tracking-wide text-gold">{a.tipo}</span>
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
