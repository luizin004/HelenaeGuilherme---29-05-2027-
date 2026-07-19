"use client";

import { useState } from "react";

export function CopyMensagem({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="space-y-2">
      <textarea readOnly value={texto} rows={Math.min(16, texto.split("\n").length + 1)} className="field-input w-full font-mono text-xs" />
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(texto).then(
            () => {
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            },
            () => setCopiado(false),
          );
        }}
        className="btn btn-dark px-4 py-2 text-xs"
      >
        {copiado ? "Copiado ✓" : "Copiar mensagem"}
      </button>
    </div>
  );
}
