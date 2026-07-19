"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarComunicado, type CommFormState } from "@/app/actions/communications";

const initial: CommFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar rascunho"}
    </button>
  );
}

export function NovoComunicado() {
  const [state, formAction] = useFormState(criarComunicado, initial);

  return (
    <form action={formAction} className="grid max-w-2xl gap-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="m-canal" className="field-label">Canal</label>
          <select id="m-canal" name="canal" className="field-input">
            <option value="email">E-mail</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="m-pub" className="field-label">Público</label>
          <select id="m-pub" name="publico" className="field-input">
            <option value="todos">Todos</option>
            <option value="confirmados">Confirmados</option>
            <option value="pendentes">Pendentes</option>
            <option value="recusados">Recusados</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="m-assunto" className="field-label">Assunto</label>
        <input id="m-assunto" name="assunto" placeholder="Ex.: Lembrete do RSVP" className="field-input" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="m-corpo" className="field-label">Mensagem</label>
        <textarea id="m-corpo" name="corpo" rows={5} placeholder="Escreva a mensagem…" className="field-input" />
      </div>
      <div className="flex items-center gap-3">
        <Submit />
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
