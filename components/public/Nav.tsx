"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { NAV_LINKS, type NavItem } from "@/lib/constants";

function isGroup(item: NavItem): item is Extract<NavItem, { children: unknown }> {
  return "children" in item;
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trava o scroll do fundo enquanto o menu do celular está aberto.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const linkCls = scrolled ? "text-ink hover:text-olive" : "text-white/90 hover:text-gold";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all ${
        scrolled ? "bg-ivory/95 shadow-[0_2px_20px_rgba(69,55,42,0.06)] backdrop-blur" : ""
      }`}
    >
      <div className="mx-auto max-w-content px-6">
        {/* Fileira 1 — logo + chamada para ação */}
        <div className="flex items-center justify-between py-3">
          <Link href="/#top" aria-label="Início">
            <Logo className="h-10 w-auto" white={!scrolled} />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/#rsvp"
              className={`hidden rounded border px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors md:inline-block ${
                scrolled ? "border-olive text-olive hover:bg-olive hover:text-white" : "border-white text-white hover:bg-white/10"
              }`}
            >
              Confirmar presença
            </Link>

            <button
              className="-m-2.5 flex flex-col gap-1.5 p-2.5 md:hidden"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} className={`h-0.5 w-6 transition-colors ${scrolled ? "bg-moss" : "bg-white"}`} />
              ))}
            </button>
          </div>
        </div>

        {/* Fileira 2 — TODAS as telas (desktop), centralizadas, com quebra elegante */}
        <nav className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-t border-current/10 pb-3 pt-2 md:flex">
          {NAV_LINKS.map((item) =>
            isGroup(item) ? (
              <div key={item.label} className="group relative">
                <span
                  className={`flex cursor-default items-center gap-1 whitespace-nowrap text-[0.68rem] uppercase tracking-[0.14em] transition-colors ${linkCls}`}
                >
                  {item.label}
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden className="mt-px">
                    <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="invisible absolute left-1/2 top-full z-10 -translate-x-1/2 pt-3 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="flex min-w-[180px] flex-col gap-1 rounded-lg border border-line bg-ivory p-2 shadow-soft">
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="whitespace-nowrap rounded px-3 py-2 text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:bg-cream hover:text-olive"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap text-[0.68rem] uppercase tracking-[0.14em] transition-colors ${linkCls}`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>

      {/* Menu do celular — lista completa */}
      {open && (
        <nav className="flex max-h-[75vh] flex-col gap-3.5 overflow-y-auto bg-ivory px-6 pb-6 pt-2 shadow-soft md:hidden">
          {NAV_LINKS.map((item) =>
            isGroup(item) ? (
              <div key={item.label} className="flex flex-col gap-3.5">
                <span className="text-xs uppercase tracking-[0.15em] text-muted">{item.label}</span>
                {item.children.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="pl-3 text-sm uppercase tracking-[0.1em] text-ink transition-colors hover:text-olive"
                    onClick={() => setOpen(false)}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm uppercase tracking-[0.1em] text-ink transition-colors hover:text-olive"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
          <Link href="/#rsvp" className="btn btn-dark mt-1" onClick={() => setOpen(false)}>
            Confirmar presença
          </Link>
        </nav>
      )}
    </header>
  );
}
