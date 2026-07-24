/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/public/Nav";
import { Reveal } from "@/components/public/Reveal";
import { Footer } from "@/components/public/Footer";
import { getSettings, getStory, resolveCouple } from "@/lib/data";
import { WEDDING } from "@/lib/constants";
import type { StoryEvent } from "@/lib/database.types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Nossa história · Helena & Guilherme",
  description: "Antes do nosso “sim”, existiram dez anos de escolhas — a história de Helena e Guilherme.",
};

const HISTORIA_FALLBACK =
  "Aqui vai a história de vocês — como se conheceram, os desafios, os projetos construídos juntos e o que os trouxe até aqui. (Texto de exemplo, é só substituir em Configurações.)";

/** Fotos da galeria que ilustram cada capítulo da trajetória. */
const FOTOS_CAPITULO = [
  "/images/galeria/galeria-9-centro-historico.jpg",
  "/images/galeria/galeria-3-piquenique.jpg",
  "/images/galeria/galeria-6-blazer.jpg",
  "/images/galeria/galeria-8-campo-abraco.jpg",
  "/images/galeria/galeria-5-campo-dourado.jpg",
];

function Capitulo({ evento, foto, invertido }: { evento: StoryEvent; foto: string; invertido: boolean }) {
  const partes = (evento.descricao ?? "").split("\n").filter(Boolean);
  const citacao = partes.length > 1 ? partes[partes.length - 1] : null;
  const corpo = citacao ? partes.slice(0, -1) : partes;

  return (
    <Reveal>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className={`overflow-hidden rounded-xl shadow-card ${invertido ? "md:order-2" : ""}`}>
          <img src={foto} alt={evento.titulo} className="aspect-[4/3] w-full object-cover" />
        </div>
        <div className={invertido ? "md:order-1" : ""}>
          <p className="eyebrow">{evento.ano}</p>
          <h3 className="mb-4 font-serif text-2xl text-moss sm:text-3xl">{evento.titulo}</h3>
          <div className="space-y-3 text-[1.02rem] leading-relaxed text-muted">
            {corpo.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {citacao && (
            <p className="mt-4 font-serif text-lg italic text-olive">{citacao}</p>
          )}
        </div>
      </div>
    </Reveal>
  );
}

export default async function HistoriaPage() {
  const [settings, story] = await Promise.all([getSettings(), getStory()]);
  const couple = resolveCouple(settings);
  const paragrafos = (couple.historia ?? HISTORIA_FALLBACK).split("\n").filter(Boolean);

  return (
    <main className="min-h-screen bg-ivory">
      <Nav />

      {/* Hero */}
      <section className="relative flex min-h-[65vh] items-end overflow-hidden text-cream">
        <img
          src="/images/galeria/galeria-2-retrato.jpg"
          alt="Helena e Guilherme"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-moss-deep via-moss-deep/40 to-moss-deep/10" />
        <div className="relative z-10 mx-auto max-w-content px-6 pb-16 pt-40 text-center">
          <p className="eyebrow text-gold">Do zero, juntos</p>
          <h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl md:text-6xl">
            Nossa história
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-cream/85">
            Tudo começou com um encontro. O que veio depois, construímos juntos.
          </p>
        </div>
      </section>

      {/* Abertura */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <Reveal>
          <p className="eyebrow">Do zero, juntos</p>
          <h2 className="mb-8 font-serif text-3xl leading-tight text-moss sm:text-4xl">
            Antes do nosso “sim”, existiram dez anos de escolhas
          </h2>
          <div className="space-y-5 text-left text-[1.08rem] leading-[1.85] text-muted">
            {paragrafos.map((p, i) =>
              i === 2 ? (
                <p key={i} className="py-2 text-center font-serif text-xl italic text-olive sm:text-2xl">
                  {p}
                </p>
              ) : (
                <p key={i}>{p}</p>
              ),
            )}
          </div>
        </Reveal>
      </section>

      {/* Nossa trajetória */}
      {story.length > 0 && (
        <section className="bg-cream px-6 py-20">
          <div className="mx-auto max-w-content">
            <Reveal>
              <div className="mb-16 text-center">
                <p className="eyebrow">Passo a passo</p>
                <h2 className="section-title after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
                  Nossa trajetória
                </h2>
              </div>
            </Reveal>
            <div className="space-y-16">
              {story.map((evento, i) => (
                <Capitulo
                  key={evento.id}
                  evento={evento}
                  foto={FOTOS_CAPITULO[i % FOTOS_CAPITULO.length]}
                  invertido={i % 2 === 1}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="mx-auto max-w-content px-6 py-20 text-center">
        <Reveal>
          <p className="mx-auto max-w-xl font-serif text-2xl leading-snug text-moss sm:text-3xl">
            Foram dez anos transformando sonhos em conquistas. Agora, diante de Deus, começamos o
            nosso maior e mais bonito projeto: a nossa família.
          </p>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            Esperamos você para celebrar o início desse novo capítulo conosco, em {WEDDING.dataExtenso}.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/#rsvp" className="btn btn-dark">Confirmar minha presença</Link>
            <Link href="/" className="btn btn-outline">Voltar ao início</Link>
          </div>
        </Reveal>
      </section>

      <Footer noiva={couple.noiva} noivo={couple.noivo} dataExtenso={WEDDING.dataExtenso} />
    </main>
  );
}
