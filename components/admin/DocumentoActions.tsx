"use client";

import { useState } from "react";

/**
 * Ações do documento: imprimir/salvar em PDF (usa o diálogo do navegador) e
 * copiar a versão em texto, pronta para colar no WhatsApp ou no e-mail.
 */
export function DocumentoActions({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <button type="button" onClick={() => window.print()} className="btn btn-dark px-4 py-1.5 text-xs">
        Imprimir / salvar PDF
      </button>
      <button type="button" onClick={copiar} className="text-xs text-olive underline">
        {copiado ? "texto copiado ✓" : "copiar texto (WhatsApp/e-mail)"}
      </button>
    </div>
  );
}
