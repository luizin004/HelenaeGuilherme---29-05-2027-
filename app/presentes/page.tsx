/* eslint-disable @next/next/no-img-element */
import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { Footer } from "@/components/public/Footer";
import { Logo } from "@/components/public/Logo";
import { PresentearModal } from "@/components/public/PresentearModal";
import { getGifts, getSettings, resolveCouple } from "@/lib/data";
import { WEDDING } from "@/lib/constants";
import { giftVisual } from "@/domain/gifts/visual";
import { giftSlug } from "@/domain/gifts/slug";
import type { Gift } from "@/lib/database.types";

export const revalidate = 60;
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Foto convencional em /public/images/presentes/<slug>.jpg — só se o arquivo existir. */
function fotoLocalDoPresente(nome: string): string | null {
  const slug = giftSlug(nome);
  const rel = `/images/presentes/${slug}.jpg`;
  return existsSync(join(process.cwd(), "public", rel)) ? rel : null;
}

const DEMO: Gift[] = [
  gift("Cota da lua de mel", "Ajude a realizar a viagem dos sonhos.", 250),
  gift("Jantar romântico", "Um brinde ao nosso primeiro ano.", 180),
  gift("Jogo de panelas", "Para os banquetes do novo lar.", 600),
  gift("Cota livre", "Contribua com o valor que desejar.", 100),
];

function gift(nome: string, descricao: string, preco: number): Gift {
  return {
    id: nome, category_id: null, nome, descricao, imagem_url: null, preco,
    permite_cota: true, quantidade: 1, status: "disponivel", ordem: 0, criado_em: "",
  };
}

export default async function PresentesPage() {
  const [gifts, settings] = await Promise.all([getGifts(), getSettings()]);
  const couple = resolveCouple(settings);
  const rows = gifts.length ? gifts : DEMO;

  return (
    <main className="min-h-screen bg-ivory">
      <header className="bg-moss-deep px-6 py-5">
        <div className="mx-auto flex max-w-content items-center justify-between">
          <Link href="/"><Logo className="h-10 w-auto" white /></Link>
          <Link href="/" className="text-xs uppercase tracking-[0.1em] text-gold">← Voltar ao site</Link>
        </div>
      </header>

      <section className="mx-auto max-w-content px-6 py-16 text-center">
        <p className="eyebrow">Com carinho</p>
        <h1 className="section-title">Lista de presentes</h1>
        <p className="mx-auto mb-12 max-w-xl text-[1.05rem] text-muted">
          Sua presença é o nosso maior presente. Se quiser nos ajudar a começar essa nova fase,
          escolha uma opção abaixo — pagamento seguro via Pix ou cartão.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((g) => {
            const v = giftVisual(g.nome);
            // Foto automática: se /public/images/presentes/<slug>.jpg existir, ela
            // substitui a capa temática — sem nenhum cadastro manual.
            const foto = g.imagem_url ?? fotoLocalDoPresente(g.nome);
            return (
            <article key={g.id} className="flex flex-col overflow-hidden rounded-lg bg-white text-left shadow-card">
              <div
                className="relative aspect-[4/5]"
                style={{ background: `linear-gradient(135deg, ${v.from}, ${v.to})` }}
              >
                {foto ? (
                  <img
                    src={foto}
                    alt={g.nome}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-6xl opacity-90 drop-shadow-sm">
                    {v.emoji}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-serif text-2xl text-moss">{g.nome}</h3>
                {g.descricao && <p className="mt-1 flex-1 text-sm text-muted">{g.descricao}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-serif text-xl text-olive">{brl(Number(g.preco))}</span>
                  <PresentearModal gift={{ id: g.id, nome: g.nome, preco: Number(g.preco), permite_cota: g.permite_cota }} />
                </div>
              </div>
            </article>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-muted">
          O checkout via Asaas (Pix/cartão) é ativado ao configurar as chaves em <code>.env.local</code>.
        </p>
      </section>

      <Footer noiva={couple.noiva} noivo={couple.noivo} dataExtenso={WEDDING.dataExtenso} />
    </main>
  );
}
