"use client";

/** Abre o diálogo de impressão (o convidado escolhe imprimir ou salvar em PDF). */
export function ImprimirConvite() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-outline px-4 py-1.5 text-xs">
      Salvar / imprimir
    </button>
  );
}
