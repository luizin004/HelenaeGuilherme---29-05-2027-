import Link from "next/link";
import { Logo } from "./Logo";
import { Footer } from "./Footer";
import { WEDDING } from "@/lib/constants";

/** Casca reutilizável para páginas informativas públicas (dúvidas, LGPD, termos, programação). */
export function InfoPage({
  eyebrow,
  titulo,
  intro,
  children,
}: {
  eyebrow: string;
  titulo: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-ivory">
      <header className="bg-moss-deep px-6 py-5">
        <div className="mx-auto flex max-w-content items-center justify-between">
          <Link href="/"><Logo className="h-10 w-auto" white /></Link>
          <Link href="/" className="text-xs uppercase tracking-[0.1em] text-gold">← Voltar ao site</Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="eyebrow text-center">{eyebrow}</p>
        <h1 className="section-title text-center">{titulo}</h1>
        {intro && <p className="mx-auto mb-10 max-w-xl text-center text-[1.05rem] text-muted">{intro}</p>}
        <div className="prose-hg space-y-6">{children}</div>
      </section>

      <Footer noiva={WEDDING.noiva} noivo={WEDDING.noivo} dataExtenso={WEDDING.dataExtenso} />
    </main>
  );
}

/** Bloco pergunta/resposta ou seção com título. */
export function InfoBlock({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <article className="rounded-lg bg-white p-6 shadow-card">
      <h2 className="mb-2 font-serif text-xl text-moss">{titulo}</h2>
      <div className="space-y-2 text-[0.98rem] leading-relaxed text-muted">{children}</div>
    </article>
  );
}
