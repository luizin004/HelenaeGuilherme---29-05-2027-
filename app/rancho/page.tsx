import type { Metadata } from "next";
import Link from "next/link";
import { RanchoLeadForm } from "@/components/rancho/RanchoLeadForm";
import { WhatsAppButton } from "@/components/rancho/WhatsAppButton";
import { CopyButton } from "@/components/rancho/CopyButton";
import { Foto } from "@/components/rancho/Foto";
import { RanchoGallery } from "@/components/rancho/RanchoGallery";
import { VideoEmbed } from "@/components/rancho/VideoEmbed";
import { getVenues } from "@/lib/data";
import { VENUES_FALLBACK } from "@/lib/constants";
import { RANCHO, waLink, WA_MSG, ESTRUTURA, EVENTOS, FAQ_RANCHO, FOTOS, VIDEO_ID } from "@/lib/rancho";
import type { Venue } from "@/lib/database.types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Rancho das Águas | Espaço para Eventos em Itabira–MG",
  description:
    "Conheça o Rancho das Águas, espaço para casamentos, aniversários, confraternizações e celebrações em Itabira–MG. Veja a estrutura, agende uma visita e solicite um orçamento.",
  openGraph: {
    title: "Rancho das Águas | Espaço para Eventos em Itabira–MG",
    description: "Casamentos, aniversários e celebrações em meio à natureza. Agende uma visita e solicite um orçamento.",
    type: "website",
  },
};

function mapsHref(v: Venue | undefined): string {
  if (v?.maps_url) return v.maps_url;
  if (v?.latitude && v?.longitude) return `https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v?.endereco || "Sítio Rancho das Águas Itabira MG")}`;
}
function wazeHref(v: Venue | undefined): string {
  if (v?.latitude && v?.longitude) return `https://waze.com/ul?ll=${v.latitude},${v.longitude}&navigate=yes`;
  return `https://waze.com/ul?q=${encodeURIComponent(v?.endereco || "Sítio Rancho das Águas Itabira MG")}&navigate=yes`;
}

export default async function RanchoPage() {
  const venues = (await getVenues()) ?? [];
  const lista = venues.length ? venues : VENUES_FALLBACK;
  const v = lista.find((x) => x.tipo === "recepcao");
  const endereco = v?.endereco || "Itabira — MG (sentido João Monlevade)";

  return (
    <main className="min-h-screen overflow-x-hidden bg-ivory">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-3">
          <span className="font-serif text-xl text-moss">Rancho das Águas</span>
          <div className="flex items-center gap-4 text-sm">
            <a href={RANCHO.telefoneTel} className="hidden text-olive sm:inline">{RANCHO.telefoneDisplay}</a>
            <a href={waLink(WA_MSG.visita)} target="_blank" rel="noopener noreferrer" className="btn btn-dark px-4 py-2 text-xs">Agende uma visita</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <Foto src={FOTOS.hero} label="Vista aérea do Rancho das Águas" className="h-[70vh] min-h-[420px] rounded-none" />
        <div className="absolute inset-0 flex items-center justify-center bg-moss-deep/45 px-6">
          <div className="max-w-2xl text-center text-cream">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gold">{RANCHO.tagline}</p>
            <h1 className="font-serif text-4xl leading-tight md:text-5xl">Celebrações especiais merecem um lugar cheio de significado</h1>
            <p className="mx-auto mt-4 max-w-xl text-cream/85">
              Natureza, tranquilidade e uma estrutura acolhedora para celebrar momentos que permanecem na memória.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href="#conhecer" className="btn btn-dark">Conheça o espaço</a>
              <a href={waLink(WA_MSG.visita)} target="_blank" rel="noopener noreferrer" className="btn btn-outline border-cream text-cream">Agende uma visita</a>
              <Link href="/" className="rounded border border-gold px-5 py-2.5 text-sm text-gold">Informações do casamento</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Escolha de jornada */}
      <section className="mx-auto max-w-content px-6 py-14">
        <div className="grid gap-5 md:grid-cols-2">
          <Link href="/" className="group rounded-xl border border-line bg-white p-8 text-center shadow-card transition-transform hover:-translate-y-1">
            <div className="text-3xl">💍</div>
            <h2 className="mt-2 font-serif text-2xl text-moss">Sou convidado do casamento</h2>
            <p className="mt-1 text-sm text-muted">Data, horário, traje, localização e orientações de chegada.</p>
            <span className="mt-3 inline-block text-sm text-olive underline">Ver informações do casamento →</span>
          </Link>
          <a href="#conhecer" className="group rounded-xl border border-line bg-white p-8 text-center shadow-card transition-transform hover:-translate-y-1">
            <div className="text-3xl">🌿</div>
            <h2 className="mt-2 font-serif text-2xl text-moss">Quero conhecer o espaço</h2>
            <p className="mt-1 text-sm text-muted">Estrutura, fotos, tipos de evento, visita e orçamento.</p>
            <span className="mt-3 inline-block text-sm text-olive underline">Conhecer o Rancho →</span>
          </a>
        </div>
      </section>

      {/* Conheça o Rancho */}
      <section id="conhecer" className="bg-cream px-6 py-20">
        <div className="mx-auto grid max-w-content items-center gap-10 md:grid-cols-2">
          <Foto src={FOTOS.sobre} label="Vista geral do espaço" className="aspect-[4/3]" />
          <div>
            <p className="eyebrow">O espaço</p>
            <h2 className="section-title text-left">Conheça o Rancho das Águas</h2>
            <p className="text-[1.05rem] leading-relaxed text-muted">
              O Rancho das Águas é um espaço cercado pela natureza, preparado para receber celebrações,
              encontros e momentos especiais. Cada área do local contribui para uma experiência
              acolhedora, permitindo que anfitriões e convidados aproveitem cada momento com tranquilidade.
            </p>
            <a href={waLink(WA_MSG.visita)} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-6">Quero visitar o espaço</a>
          </div>
        </div>
      </section>

      {/* Nosso casamento (teaser, sem dados privados) */}
      <section className="mx-auto max-w-content px-6 py-16 text-center">
        <p className="eyebrow">Um lugar com história</p>
        <h2 className="section-title">Nosso casamento no Rancho das Águas</h2>
        <p className="mx-auto max-w-2xl text-[1.05rem] leading-relaxed text-muted">
          Escolhemos celebrar este momento em um lugar que já faz parte da história da nossa família.
          Mais do que o cenário da festa, o Rancho das Águas representa afeto, natureza, lembranças e
          encontros.
        </p>
        <Link href="/" className="btn btn-outline mt-6">Sou convidado — ver o casamento</Link>
      </section>

      {/* Estrutura */}
      <section className="bg-moss-deep px-6 py-20 text-cream">
        <div className="mx-auto max-w-content">
          <p className="eyebrow text-gold">O que o espaço oferece</p>
          <h2 className="section-title text-cream">Estrutura</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ESTRUTURA.map((e) => (
              <div key={e.titulo} className="rounded-lg bg-white/5 p-5">
                <div className="text-3xl">{e.icone}</div>
                <h3 className="mt-2 font-serif text-xl text-gold">{e.titulo}</h3>
                <p className="mt-1 text-sm text-cream/75">{e.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section className="mx-auto max-w-content px-6 py-20">
        <p className="eyebrow text-center">Um passeio pelo espaço</p>
        <h2 className="section-title text-center">Galeria</h2>
        <RanchoGallery fotos={FOTOS.galeria} />
      </section>

      {/* Vídeo */}
      <section className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-content text-center">
          <p className="eyebrow">Assista</p>
          <h2 className="section-title">Faça um passeio pelo Rancho das Águas</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted">Conheça um pouco dos ambientes, da paisagem e da atmosfera do local.</p>
          <VideoEmbed id={VIDEO_ID} titulo="Passeio pelo Rancho das Águas" />
        </div>
      </section>

      {/* Clima da noite */}
      <section className="relative">
        <Foto src={FOTOS.noite} label="O Rancho das Águas à noite" className="h-[55vh] min-h-[360px] rounded-none" />
        <div className="absolute inset-0 flex items-center justify-center bg-moss-deep/45 px-6">
          <div className="max-w-xl text-center text-cream">
            <p className="eyebrow text-gold">Quando a noite chega</p>
            <h2 className="section-title text-cream">O clima da celebração</h2>
            <p className="text-cream/85">
              Com a luz do fim do dia, o deck e a área às margens do lago ganham uma atmosfera
              aconchegante — perfeita para receber e celebrar.
            </p>
          </div>
        </div>
      </section>

      {/* Tipos de evento */}
      <section className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-content text-center">
          <p className="eyebrow">Possibilidades</p>
          <h2 className="section-title">Momentos que podem acontecer aqui</h2>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
            {EVENTOS.map((e) => (
              <span key={e} className="rounded-full border border-olive/40 bg-white px-4 py-2 text-sm text-moss">{e}</span>
            ))}
          </div>
          <a href={waLink(WA_MSG.disponibilidade)} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-8">Consultar disponibilidade</a>
        </div>
      </section>

      {/* Visita */}
      <section className="mx-auto grid max-w-content items-center gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <p className="eyebrow">Venha conhecer</p>
          <h2 className="section-title text-left">Venha conhecer o espaço</h2>
          <p className="text-[1.05rem] leading-relaxed text-muted">
            As fotografias mostram parte da experiência, mas uma visita permite conhecer melhor cada
            ambiente, visualizar a organização do evento e conversar sobre as possibilidades para a sua
            celebração.
          </p>
          <p className="mt-4 text-sm text-muted">Atendimento e visitas combinados previamente.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={waLink(WA_MSG.visita)} target="_blank" rel="noopener noreferrer" className="btn btn-dark">Agendar visita pelo WhatsApp</a>
            <a href={RANCHO.telefoneTel} className="font-serif text-lg text-olive">{RANCHO.telefoneDisplay}</a>
          </div>
        </div>
        <Foto src={FOTOS.visita} label="Vista do local" className="aspect-[4/3]" />
      </section>

      {/* Planeje seu evento (sem preços) */}
      <section className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-content text-center">
          <p className="eyebrow">Sem surpresas</p>
          <h2 className="section-title">Planeje seu evento</h2>
          <p className="mx-auto max-w-2xl text-[1.05rem] text-muted">
            Cada evento possui características próprias. Entre em contato para consultar disponibilidade,
            condições e solicitar uma proposta personalizada.
          </p>
          <ul className="mx-auto mt-6 grid max-w-xl gap-2 text-left text-sm text-muted">
            {["Tipo de evento desejado", "Data estimada", "Número aproximado de convidados", "Estruturas necessárias", "Necessidade de visita", "Solicitação de orçamento personalizado"].map((i) => (
              <li key={i} className="flex items-center gap-2"><span className="text-olive">•</span>{i}</li>
            ))}
          </ul>
          <a href={waLink(WA_MSG.orcamento)} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-8">Solicitar orçamento pelo WhatsApp</a>
        </div>
      </section>

      {/* Localização */}
      <section className="mx-auto max-w-content px-6 py-20">
        <p className="eyebrow text-center">Onde estamos</p>
        <h2 className="section-title text-center">Localização</h2>
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 text-center shadow-card">
          <p className="font-serif text-xl text-moss">{RANCHO.nome}</p>
          <p className="mt-1 text-muted">{endereco}</p>
          {(!v?.latitude || !v?.longitude) && (
            <p className="mt-2 text-xs text-muted">Rota detalhada e ponto exato enviados no contato.</p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href={mapsHref(v)} target="_blank" rel="noopener noreferrer" className="btn btn-dark">Abrir no Google Maps</a>
            <a href={wazeHref(v)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Abrir no Waze</a>
            <CopyButton texto={endereco} />
            <a href={waLink(WA_MSG.informacoes)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Falar com o espaço</a>
          </div>
        </div>
      </section>

      {/* Formulário */}
      <section className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow text-center">Fale com a gente</p>
          <h2 className="section-title text-center">Solicite um orçamento ou visita</h2>
          <div className="rounded-lg bg-white p-6 shadow-card">
            <RanchoLeadForm />
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            Seus dados são usados apenas para retornar o contato sobre o seu evento.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="eyebrow text-center">Dúvidas</p>
        <h2 className="section-title text-center">Perguntas frequentes</h2>
        <div className="space-y-3">
          {FAQ_RANCHO.map((f) => (
            <details key={f.p} className="rounded-lg bg-white p-5 shadow-card">
              <summary className="cursor-pointer font-serif text-lg text-moss">{f.p}</summary>
              <p className="mt-2 text-sm text-muted">{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-moss-deep px-6 py-14 text-center text-cream">
        <p className="font-serif text-3xl">Rancho das Águas</p>
        <p className="mt-1 text-sm opacity-80">Espaço para eventos · Itabira — MG</p>
        <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm">
          <a href={RANCHO.telefoneTel} className="text-gold">{RANCHO.telefoneDisplay}</a>
          <a href={waLink(WA_MSG.informacoes)} target="_blank" rel="noopener noreferrer" className="text-gold">WhatsApp</a>
          <Link href="/" className="text-gold">Casamento Helena &amp; Guilherme</Link>
        </div>
      </footer>

      <WhatsAppButton />
    </main>
  );
}
