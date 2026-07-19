"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Erro não tratado na interface", { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="mb-2 text-sm uppercase tracking-[0.3em] text-olive">Ops…</p>
      <h1 className="mb-3 font-serif text-4xl text-moss">Algo não saiu como esperado</h1>
      <p className="mb-8 max-w-md text-muted">
        Tivemos um imprevisto ao carregar esta página. Você pode tentar novamente.
      </p>
      <button onClick={reset} className="btn btn-dark">
        Tentar novamente
      </button>
    </div>
  );
}
