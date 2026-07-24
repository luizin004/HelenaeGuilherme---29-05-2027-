import Link from "next/link";
import { Logo } from "./Logo";

export function Footer({ noiva, noivo, dataExtenso }: { noiva: string; noivo: string; dataExtenso: string }) {
  return (
    <footer className="bg-moss-deep px-6 py-16 text-center text-cream">
      <Logo className="mx-auto mb-5 h-16 w-auto opacity-85" white />
      <p className="font-serif text-4xl font-medium">
        {noiva} <span className="italic text-gold">&amp;</span> {noivo}
      </p>
      <p className="my-2 text-sm uppercase tracking-[0.3em] opacity-80">{dataExtenso}</p>
      <p className="text-sm opacity-70">Feito com carinho · Nos vemos lá 🤍</p>

      <nav className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.15em] opacity-80">
        <Link href="/historia" className="transition hover:text-gold">Nossa história</Link>
        <Link href="/cerimonia" className="transition hover:text-gold">Cerimônia</Link>
        <Link href="/recepcao" className="transition hover:text-gold">Recepção</Link>
        <Link href="/como-chegar" className="transition hover:text-gold">Como chegar</Link>
        <Link href="/hospedagem" className="transition hover:text-gold">Hospedagem</Link>
        <Link href="/programacao" className="transition hover:text-gold">Programação</Link>
        <Link href="/duvidas" className="transition hover:text-gold">Dúvidas</Link>
        <Link href="/presentes" className="transition hover:text-gold">Presentes</Link>
        <Link href="/privacidade" className="transition hover:text-gold">Privacidade</Link>
        <Link href="/termos" className="transition hover:text-gold">Termos</Link>
        <Link href="/rancho" className="transition hover:text-gold">O espaço (Rancho)</Link>
      </nav>

      <Link
        href="/admin"
        className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-gold opacity-60 transition hover:opacity-100"
      >
        Painel dos noivos
      </Link>
    </footer>
  );
}
