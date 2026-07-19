"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { NAV_LINKS } from "@/lib/constants";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all ${
        scrolled ? "bg-ivory/95 shadow-[0_2px_20px_rgba(69,55,42,0.06)] backdrop-blur" : ""
      }`}
    >
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-3.5">
        <Link href="#top" aria-label="Início">
          <Logo className="h-10 w-auto" white={!scrolled} />
        </Link>

        <button
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-0.5 w-6 transition-colors ${scrolled ? "bg-bronze-dark" : "bg-white"}`}
            />
          ))}
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-xs uppercase tracking-[0.1em] transition-colors hover:text-champagne ${
                scrolled ? "text-ink hover:text-bronze" : "text-white/90"
              }`}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#rsvp"
            className={`rounded border px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
              scrolled ? "border-bronze text-bronze" : "border-white text-white"
            }`}
          >
            Confirmar presença
          </a>
        </nav>
      </div>

      {open && (
        <nav className="flex flex-col gap-4 bg-ivory px-6 pb-6 shadow-soft md:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm uppercase tracking-[0.1em] text-ink"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a href="#rsvp" className="btn btn-dark" onClick={() => setOpen(false)}>
            Confirmar presença
          </a>
        </nav>
      )}
    </header>
  );
}
