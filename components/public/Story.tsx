import { Reveal } from "./Reveal";
import type { StoryEvent } from "@/lib/database.types";

export function Story({ historia, eventos }: { historia: string | null; eventos: StoryEvent[] }) {
  return (
    <section id="historia" className="mx-auto max-w-content scroll-mt-20 px-6 py-24 text-center md:scroll-mt-28">
      <Reveal>
        <p className="eyebrow">O começo de tudo</p>
        <h2 className="section-title after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
          Nossa história
        </h2>
        <div className="grid items-center gap-14 text-left md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-5 text-[1.05rem] text-muted">
            {historia ? (
              historia.split("\n").map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <>
                <p>
                  Aqui vai o texto de vocês — como se conheceram, o pedido, os momentos que
                  transformaram dois em um só. <em>(Texto de exemplo, é só substituir.)</em>
                </p>
                <p>
                  Cada foto, cada data e cada palavra deste site pode ser personalizada. Deixamos
                  tudo pronto para receber a história de Helena e Guilherme.
                </p>
              </>
            )}
          </div>
          <ul className="list-none border-l-2 border-gold pl-7">
            {eventos.map((e) => (
              <li key={e.id} className="relative pb-7 last:pb-0">
                <span className="absolute -left-[2.3rem] top-1.5 h-3 w-3 rounded-full border-[3px] border-ivory bg-olive" />
                <span className="block font-serif text-2xl text-olive">{e.ano}</span>
                <span className="text-sm text-muted">{e.titulo}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
