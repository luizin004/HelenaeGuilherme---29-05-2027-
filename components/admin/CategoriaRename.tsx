"use client";

import { useFormState, useFormStatus } from "react-dom";
import { renomearCategoria, type CategoriaState } from "@/app/actions/categorias";
import { CATEGORIAS } from "@/domain/orcamento/catalogo";

const initial: CategoriaState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="text-xs text-olive underline disabled:opacity-50">{pending ? "…" : "renomear"}</button>;
}

export function CategoriaRename({ de }: { de: string }) {
  const [state, formAction] = useFormState(renomearCategoria, initial);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="de" value={de} />
      <input name="para" list="cat-all" defaultValue={de} className="field-input w-44 py-1 text-sm" />
      <datalist id="cat-all">
        {CATEGORIAS.map((c) => <option key={c} value={c} />)}
      </datalist>
      <Submit />
      {state.message && <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
    </form>
  );
}
