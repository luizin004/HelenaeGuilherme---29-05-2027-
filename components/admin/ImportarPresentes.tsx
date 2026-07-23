"use client";

import { useFormState, useFormStatus } from "react-dom";
import { importarPresentes, type GiftFormState } from "@/app/actions/gifts";

const initial: GiftFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark text-sm disabled:opacity-60">
      {pending ? "Importando…" : "Importar planilha"}
    </button>
  );
}

/** Exportar (baixar) e importar a lista de presentes via planilha CSV. */
export function ImportarExportarPresentes() {
  const [state, formAction] = useFormState(importarPresentes, initial);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-lg border border-line bg-ivory p-4">
        <p className="text-sm font-medium text-moss">Exportar</p>
        <p className="text-xs text-muted">
          Baixe a lista atual como planilha (abre no Excel/Google Sheets). Serve de modelo: edite valores,
          descrições e imagens e reimporte.
        </p>
        <a href="/admin/presentes/export" className="btn btn-outline w-fit text-sm">Baixar planilha (CSV)</a>
      </div>

      <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-line bg-ivory p-4">
        <p className="text-sm font-medium text-moss">Importar</p>
        <p className="text-xs text-muted">
          Colunas: <code>nome; descricao; valor; imagem_url; permite_cota</code>. Cada linha vira um novo
          presente. Valor aceita <code>1.234,50</code>.
        </p>
        <input type="file" name="arquivo" accept=".csv,text/csv" required className="field-input py-1.5 text-sm" />
        <div className="flex items-center gap-3">
          <Submit />
          {state.message && <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
        </div>
      </form>
    </div>
  );
}
