"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarConvidado, type GuestFormState } from "@/app/actions/guests";
import { PAPEIS } from "@/domain/convites/caixas";

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
      <div className="flex flex-col gap-1">
        <label htmlFor="papel" className="field-label">Papel</label>
        <select id="papel" name="papel" defaultValue="convidado" className="field-input">
          {PAPEIS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="faixa" className="field-label">Faixa</label>
        <select id="faixa" name="faixa_etaria" defaultValue="adulto" className="field-input">
          <option value="adulto">Adulto</option>
          <option value="jovem">Jovem</option>
          <option value="crianca">Criança</option>
        </select>
      </div>
      <Submit />
      {state.message && (
        <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
      )}
    </form>
  );
}
