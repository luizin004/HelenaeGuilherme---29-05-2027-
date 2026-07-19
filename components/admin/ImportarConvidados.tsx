"use client";

import { useFormState, useFormStatus } from "react-dom";
import { importarConvidados, type ImportState } from "@/app/actions/import-guests";

const initial: ImportState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Importando…" : "Importar"}
    </button>
  );
}

export function ImportarConvidados() {
  const [state, formAction] = useFormState(importarConvidados, initial);

  return (
    <form action={formAction} className="grid gap-3">
      <p className="text-sm text-muted">
        Cole do Excel/Sheets com <strong>cabeçalho</strong>. Colunas reconhecidas:{" "}
        <code>nome</code>, <code>email</code>, <code>telefone</code>, <code>grupo</code>, <code>criança</code>.
      </p>
      <textarea
        name="texto"
        rows={6}
        placeholder={"nome;telefone;grupo;criança\nMaria Souza;(31) 90000-0000;Família Souza;não\nLucas Souza;;Família Souza;sim"}
        className="field-input font-mono text-xs"
      />
      <div className="flex items-center gap-3">
        <Submit />
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
        )}
      </div>
      {state.detalhes && state.detalhes.length > 0 && (
        <ul className="list-inside list-disc text-xs text-muted">
          {state.detalhes.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
