"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarFornecedor, type SupplierFormState } from "@/app/actions/suppliers";

const initial: SupplierFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Cadastrar"}
    </button>
  );
}

export function NovoFornecedor() {
  const [state, formAction] = useFormState(criarFornecedor, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="f-nome" className="field-label">Nome</label>
        <input id="f-nome" name="nome" required placeholder="Fornecedor" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="f-cat" className="field-label">Categoria</label>
        <input id="f-cat" name="categoria" placeholder="Buffet, foto…" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="f-tel" className="field-label">Telefone</label>
        <input id="f-tel" name="telefone" placeholder="(00) 90000-0000" className="field-input" />
      </div>
      <Submit />
      {state.message && (
        <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
      )}
    </form>
  );
}
