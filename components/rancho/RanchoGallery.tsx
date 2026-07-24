"use client";

import { useCallback, useEffect, useState } from "react";

interface Foto {
  src: string;
  label: string;
}

const grad = "linear-gradient(135deg, #6f7352, #4b5540)";

export function RanchoGallery({ fotos }: { fotos: readonly Foto[] }) {
  const [aberta, setAberta] = useState<number | null>(null);

  const fechar = useCallback(() => setAberta(null), []);
  const nav = useCallback(
    (d: number) => setAberta((i) => (i === null ? null : (i + d + fotos.length) % fotos.length)),
    [fotos.length],
  );

  useEffect(() => {
    if (aberta === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberta, fechar, nav]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {fotos.map((f, i) => (
          <button
            key={f.src}
            type="button"
            onClick={() => setAberta(i)}
            aria-label={`Ampliar: ${f.label}`}
            className="group relative aspect-square overflow-hidden rounded-lg"
            style={{ background: `url('${f.src}') center / cover no-repeat, ${grad}` }}
          >
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-moss-deep/70 to-transparent px-3 py-2 text-left text-xs text-cream opacity-0 transition-opacity group-hover:opacity-100">
              {f.label}
            </span>
          </button>
        ))}
      </div>

      {aberta !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-moss-deep/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={fotos[aberta].label}
          onClick={fechar}
        >
          <button type="button" onClick={fechar} aria-label="Fechar" className="absolute right-3 top-3 p-3 text-2xl text-cream">✕</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); nav(-1); }} aria-label="Anterior" className="absolute left-1 p-3 text-3xl text-cream/80 hover:text-cream md:left-6">‹</button>
          <figure className="max-h-[85vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div
              className="aspect-[3/2] w-[85vw] max-w-4xl rounded-lg"
              style={{ background: `url('${fotos[aberta].src}') center / contain no-repeat, ${grad}` }}
            />
            <figcaption className="mt-3 text-center text-sm text-cream/85">{fotos[aberta].label}</figcaption>
          </figure>
          <button type="button" onClick={(e) => { e.stopPropagation(); nav(1); }} aria-label="Próxima" className="absolute right-1 p-3 text-3xl text-cream/80 hover:text-cream md:right-6">›</button>
        </div>
      )}
    </>
  );
}
