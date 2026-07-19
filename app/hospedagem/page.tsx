import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/public/Logo";
import { Footer } from "@/components/public/Footer";
import { HOTEIS, hotelContato, type Hotel } from "@/lib/hoteis";
import { WEDDING } from "@/lib/constants";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Hospedagem · Helena & Guilherme",
  description: "Onde se hospedar em Itabira — sugestões de hotéis para os convidados do casamento.",
};

function HotelCard({ h }: { h: Hotel }) {
  const contato = hotelContato(h);
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition-transform hover:-translate-y-1">
      <div
        role="img"
        aria-label={`Fachada do ${h.nome}`}
        className="aspect-[16/10] w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url('${h.imagem}'), linear-gradient(135deg, #8f9470, #4b5540)` }}
      />
      <div className="flex flex-1 flex-col p-6">
        <h2 className="font-serif text-2xl text-moss">{h.nome}</h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted">{h.descricao}</p>

        <div className="mt-4 space-y-2 border-t border-dashed border-line pt-4 text-sm text-muted">
          <p className="flex items-start gap-2"><span aria-hidden>📍</span>{h.endereco}</p>
          <p className="flex items-center gap-2">
            <span aria-hidden>☎️</span>
            <a href={`tel:${h.telefone.replace(/\D/g, "")}`} className="transition hover:text-moss">{h.telefone}</a>
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a href={h.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Ver no Google Maps</a>
          <a href={contato.href} target={contato.externo ? "_blank" : undefined} rel={contato.externo ? "noopener noreferrer" : undefined} className="btn btn-dark">
            {contato.label}
          </a>
        </div>
      </div>
    </article>
  );
}

export default function HospedagemPage() {
  return (
    <main className="min-h-screen bg-ivory">
      <header className="bg-moss-deep px-6 py-5">
        <div className="mx-auto flex max-w-content items-center justify-between">
          <Link href="/"><Logo className="h-10 w-auto" white /></Link>
          <Link href="/" className="text-xs uppercase tracking-[0.1em] text-gold">← Voltar ao site</Link>
        </div>
      </header>

      <section className="mx-auto max-w-content px-6 py-16 text-center">
        <p className="eyebrow">Hospedagem dos convidados</p>
        <h1 className="section-title">Onde se hospedar em Itabira</h1>
        <p className="mx-auto max-w-2xl text-[1.05rem] text-muted">
          Selecionamos algumas opções para facilitar a estadia. Para reservas, valores e
          disponibilidade, fale diretamente com cada hotel.
        </p>

        <div className="mt-12 grid gap-6 text-left lg:grid-cols-2">
          {HOTEIS.map((h) => <HotelCard key={h.id} h={h} />)}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-lg bg-cream px-6 py-8">
          <p className="font-serif text-xl text-moss">Uma estadia tranquila também faz parte da celebração.</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            As hospedagens acima são <strong>sugestões</strong>. Reservas, preços, disponibilidade,
            cancelamentos e condições devem ser confirmados diretamente com cada hotel.
          </p>
        </div>
      </section>

      <Footer noiva={WEDDING.noiva} noivo={WEDDING.noivo} dataExtenso={WEDDING.dataExtenso} />
    </main>
  );
}
