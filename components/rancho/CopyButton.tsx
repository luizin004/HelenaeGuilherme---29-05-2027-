"use client";

import { useState } from "react";

export function CopyButton({ texto, label = "Copiar endereço" }: { texto: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 2000); }, () => {})}
      className="btn btn-outline"
    >
      {ok ? "Copiado ✓" : label}
    </button>
  );
}
