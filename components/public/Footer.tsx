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
      <Link
        href="/admin"
        className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-gold opacity-60 transition hover:opacity-100"
      >
        Painel dos noivos
      </Link>
    </footer>
  );
}
