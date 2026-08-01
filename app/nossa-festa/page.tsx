/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/public/Footer";
import { FestaUpload } from "@/components/public/FestaUpload";
import { Logo } from "@/components/public/Logo";
import { WEDDING } from "@/lib/constants";
import { getFestaPublico } from "@/lib/festa-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { linkWhatsapp } from "@/domain/festa/album";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nossa Festa | Helena & Guilherme",
  description:
    "O álbum colaborativo do nosso casamento: mande as fotos que você tirou e veja a festa pelos olhos de quem estava lá.",
};

const PASSOS = [
  { n: "1", titulo: "Escolha as fotos", texto: "Pode mandar várias de uma vez, direto da galeria do celular." },
  { n: "2", titulo: "Assine com seu nome", texto: "Cada foto entra no site com o crédito de quem clicou." },
  { n: "3", titulo: "A gente publica", texto: "Damos uma olhadinha com carinho e sua foto aparece na galeria." },
];

export default async function NossaFestaPage() {
  const { fotos, links, aberto, whatsapp_numero, whatsapp_mensagem, chamada, agradecimento } =
    await getFestaPublico();
  const whatsapp = linkWhatsapp(whatsapp_numero, whatsapp_mensagem);

  return (
    <main className="min-h-screen bg-ivory">
      <header className="bg-moss-deep px-6 py-5">
        <div className="mx-auto flex max-w-content items-center justify-between">
          <Link href="/">
            <Logo className="h-10 w-auto" white />
          </Link>
          <Link href="/" className="text-xs uppercase tracking-[0.1em] text-gold">
            ← Voltar ao site
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-10 pt-16 text-center">
        <p className="eyebrow">Álbum colaborativo</p>
        <h1 className="section-title after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
          Nossa Festa pelos seus olhos
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed text-muted">
          {chamada?.trim() ||
            "A festa foi de vocês também. Mandem as fotos que vocês tiraram — aquelas que o fotógrafo não pegou."}
        </p>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-content px-6 pb-12">
        <ol className="grid gap-4 sm:grid-cols-3">
          {PASSOS.map((p) => (
            <li key={p.n} className="rounded-xl bg-white p-6 text-center shadow-card">
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft font-serif text-lg text-moss">
                {p.n}
              </span>
              <h2 className="mb-1 font-serif text-lg text-moss">{p.titulo}</h2>
              <p className="text-sm leading-relaxed text-muted">{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Envio */}
      <section id="enviar" className="mx-auto max-w-2xl scroll-mt-20 px-6 pb-12">
        {!isSupabaseConfigured ? (
          <p className="rounded-xl bg-white p-8 text-center text-muted shadow-card">
            O envio de fotos abre assim que o site estiver conectado. Volte em breve. 💛
          </p>
        ) : !aberto ? (
          <p className="rounded-xl bg-white p-8 text-center text-muted shadow-card">
            Encerramos o recebimento de fotos por aqui — mas obrigado a todo mundo que mandou as suas. 💛
          </p>
        ) : (
          <FestaUpload agradecimento={agradecimento} />
        )}

        {whatsapp && (
          <div className="mt-6 rounded-xl border border-olive/30 bg-white/70 p-5 text-center">
            <p className="mb-3 text-sm text-muted">
              Prefere mandar pelo WhatsApp? Também vale — a gente sobe as fotos para o site com o seu nome.
            </p>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline inline-flex items-center gap-2"
            >
              <span aria-hidden="true">💬</span> Enviar pelo WhatsApp
            </a>
          </div>
        )}
      </section>

      {/* Galeria colaborativa */}
      <section id="momentos" className="mx-auto max-w-content scroll-mt-20 px-6 pb-24">
        <p className="eyebrow text-center">Vocês registraram</p>
        <h2 className="section-title text-center after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
          Momentos registrados por vocês
        </h2>

        {fotos.length === 0 ? (
          <p className="mx-auto mt-6 max-w-xl text-center text-[1.05rem] leading-relaxed text-muted">
            Ainda não temos fotos por aqui. Seja o primeiro a compartilhar um momento da nossa festa 💛
          </p>
        ) : (
          <>
            <p className="mx-auto mb-8 mt-4 max-w-xl text-center text-sm text-muted">
              {fotos.length} {fotos.length === 1 ? "lembrança" : "lembranças"} enviadas por quem estava lá.
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {fotos.map((f) => {
                const url = links.get(f.arquivo_path);
                if (!url) return null;
                return (
                  <figure key={f.id} className="overflow-hidden rounded-lg bg-white shadow-card">
                    <div className="aspect-[4/5] overflow-hidden">
                      <img
                        src={url}
                        alt={f.legenda ?? `Foto de ${f.autor}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <figcaption className="px-3 py-2.5 text-left">
                      {f.legenda && <p className="mb-1 text-sm leading-snug text-ink">{f.legenda}</p>}
                      <p className="text-xs uppercase tracking-wide text-olive">foto de {f.autor}</p>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </>
        )}
      </section>

      <Footer noiva={WEDDING.noiva} noivo={WEDDING.noivo} dataExtenso={WEDDING.dataExtenso} />
    </main>
  );
}
