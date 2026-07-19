"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/public/Logo";
import { Icon } from "./Icon";
import { ADMIN_MENU, isSection } from "./menu";

/**
 * Sidebar do painel: recolhível no desktop (persistida) e drawer no celular
 * com backdrop (§3/§32). Ícones profissionais em vez de emojis.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // drawer mobile
  const [collapsed, setCollapsed] = useState(false); // desktop

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("hg-sidebar") === "min");
    } catch {
      /* sem storage */
    }
  }, []);

  // O conteúdo (layout) usa margin-left: var(--sb) — acompanha o colapso.
  useEffect(() => {
    document.documentElement.style.setProperty("--sb", collapsed ? "68px" : "250px");
  }, [collapsed]);

  function toggleCollapse() {
    setCollapsed((v) => {
      try {
        localStorage.setItem("hg-sidebar", v ? "max" : "min");
      } catch {
        /* sem storage */
      }
      return !v;
    });
  }

  const ativo = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <button
        className="fixed left-4 top-3.5 z-[60] rounded-md p-1 text-moss md:hidden"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-6 w-6">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <button
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        data-collapsed={collapsed}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-y-auto bg-moss-deep py-5 text-gold-soft transition-all md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-[250px] md:w-[68px]" : "w-[250px]"}`}
      >
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 px-4 pb-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Logo className="h-8 w-auto shrink-0" white />
            {!collapsed && <span className="truncate font-serif text-lg text-white">Helena &amp; Guilherme</span>}
          </Link>
          <button
            onClick={toggleCollapse}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="hidden shrink-0 rounded p-1 text-white/50 transition hover:bg-white/10 hover:text-white md:block"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              {collapsed ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
            </svg>
          </button>
        </div>

        <nav aria-label="Menu do painel" className="flex-1">
          {ADMIN_MENU.map((e, i) =>
            isSection(e) ? (
              collapsed ? (
                <div key={i} className="mx-4 my-2 hidden border-t border-white/10 md:block" />
              ) : (
                <div key={i} className="px-5 pb-1 pt-4 text-[0.64rem] uppercase tracking-[0.18em] text-white/40">
                  {e.section}
                </div>
              )
            ) : (
              <Link
                key={i}
                href={e.href}
                onClick={() => setOpen(false)}
                title={e.label}
                aria-current={ativo(e.href) ? "page" : undefined}
                className={`flex items-center gap-3 px-5 py-2 text-[0.83rem] transition-colors hover:bg-white/5 hover:text-white ${
                  ativo(e.href) ? "border-l-2 border-gold bg-olive/60 text-white" : "border-l-2 border-transparent text-gold-soft"
                } ${collapsed ? "md:justify-center md:px-0" : ""}`}
              >
                <Icon name={e.ico} className="h-[17px] w-[17px] shrink-0 opacity-85" />
                <span className={collapsed ? "md:hidden" : ""}>{e.label}</span>
                {e.soon && !collapsed && (
                  <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[0.56rem] uppercase tracking-wide">
                    em breve
                  </span>
                )}
              </Link>
            ),
          )}
        </nav>
      </aside>
    </>
  );
}
