"use client";

import { useState } from "react";

/**
 * Player de YouTube com "facade": mostra uma capa leve e só carrega o iframe
 * ao clicar (não pesa o carregamento inicial, não toca sozinho).
 */
export function VideoEmbed({ id, titulo }: { id: string; titulo: string }) {
  const [ativo, setAtivo] = useState(false);
  const capa = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const grad = "linear-gradient(135deg, #6f7352, #4b5540)";

  return (
    <div className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-lg shadow-card">
      {ativo ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setAtivo(true)}
          aria-label={`Reproduzir vídeo: ${titulo}`}
          className="group absolute inset-0 flex items-center justify-center"
          style={{ background: `url('${capa}') center / cover no-repeat, ${grad}` }}
        >
          <span className="absolute inset-0 bg-moss-deep/30 transition-colors group-hover:bg-moss-deep/20" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-2xl text-moss shadow-lg transition-transform group-hover:scale-105">
            ▶
          </span>
        </button>
      )}
    </div>
  );
}
