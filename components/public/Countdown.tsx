"use client";

import { useEffect, useState } from "react";

const UNITS = [
  { key: "d", label: "dias" },
  { key: "h", label: "horas" },
  { key: "m", label: "minutos" },
  { key: "s", label: "segundos" },
] as const;

function diffParts(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
    done: diff <= 0,
  };
}

export function Countdown({ dataISO }: { dataISO: string }) {
  const target = new Date(dataISO).getTime();
  const [t, setT] = useState<ReturnType<typeof diffParts> | null>(null);

  useEffect(() => {
    setT(diffParts(target));
    const id = setInterval(() => setT(diffParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const value = (key: string) => {
    if (!t) return "–";
    const n = t[key as "d" | "h" | "m" | "s"];
    return key === "d" ? String(n) : pad(n);
  };

  return (
    <section className="bg-cream px-6 py-16 text-center">
      <h2 className="mb-8 text-3xl font-medium text-moss">
        {t?.done ? "É hoje! 🤍" : "Faltam"}
      </h2>
      <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-x-10 gap-y-6">
        {UNITS.map((u) => (
          <div key={u.key} className="min-w-20">
            <span className="block font-serif text-5xl font-medium leading-none text-olive md:text-6xl">
              {value(u.key)}
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted">{u.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
