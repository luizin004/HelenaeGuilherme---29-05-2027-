"use client";

import { useFormState, useFormStatus } from "react-dom";
import { confirmarPresenca, type RsvpState } from "@/app/actions/rsvp";

const initial: RsvpState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-dark disabled:opacity-60" disabled={pending}>
      {pending ? "Enviando…" : "Confirmar"}
    </button>
  );
}

export function RsvpConfirm({ token, nome }: { token: string; nome: string }) {
  const [state, formAction] = useFormState(confirmarPresenca, initial);

  if (state.message) {
    return (
      <p className={`text-center font-serif text-2xl ${state.ok ? "text-olive" : "text-danger"}`}>
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-5 text-left">
      <input type="hidden" name="token" value={token} />
      <p className="text-center text-muted">
        Olá, <span className="font-serif text-xl text-moss">{nome}</span>! Confirme sua presença:
      </p>
      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <label className="flex cursor-pointer items-center gap-2 text-base text-muted">
          <input type="radio" name="presenca" value="sim" required /> Sim, com alegria!
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-base text-muted">
          <input type="radio" name="presenca" value="nao" /> Infelizmente não poderei
        </label>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="mensagem" className="field-label">Mensagem para os noivos (opcional)</label>
        <textarea id="mensagem" name="mensagem" rows={3} placeholder="Deixe um recado carinhoso" className="field-input" />
      </div>
      <SubmitButton />
    </form>
  );
}
