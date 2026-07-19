"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/public/Logo";
import { ADMIN_MENU, isSection } from "./menu";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="fixed left-4 top-3.5 z-[60] text-2xl text-moss md:hidden"
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col overflow-y-auto bg-moss-deep py-6 text-gold-soft transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/" className="mb-4 flex items-center gap-2.5 border-b border-white/10 px-6 pb-5">
          <Logo className="h-9 w-auto" white />
          <span className="font-serif text-xl text-white">Helena &amp; Guilherme</span>
        </Link>

        {ADMIN_MENU.map((e, i) =>
          isSection(e) ? (
            <div key={i} className="px-6 pb-1.5 pt-4 text-[0.66rem] uppercase tracking-[0.2em] text-white/40">
              {e.section}
            </div>
          ) : (
            <Link
              key={i}
              href={e.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors hover:bg-white/5 hover:text-white ${
                pathname === e.href ? "bg-olive text-white" : "text-gold-soft"
              }`}
            >
              <span className="w-5 text-center">{e.ico}</span>
              {e.label}
              {e.soon && (
                <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[0.58rem] uppercase tracking-wide">
                  em breve
                </span>
              )}
            </Link>
          ),
        )}
      </aside>
    </>
  );
}
