"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarConvidado, type GuestFormState } from "@/app/actions/guests";

const initial: GuestFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Adicionar"}
    </button>
  );
}

export function NovoConvidado() {
  const [state, formAction] = useFormState(criarConvidado, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="field-label">Nome</label>
        <input id="nome" name="nome" required placeholder="Nome do convidado" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="telefone" className="field-label">Telefone</label>
        <input id="telefone" name="telefone" placeholder="(00) 90000-0000" className="field-input" />
      </div>
      <label className="flex items-center gap-2 py-3 text-sm text-muted">
        <input type="checkbox" name="eh_crianca" /> Criança
      </label>
      <Submit />
      {state.message && (
        <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
      )}
    </form>
  );
}
