"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitRsvp, type RsvpState } from "@/app/actions/rsvp";
import { Reveal } from "./Reveal";

const initial: RsvpState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-dark disabled:opacity-60" disabled={pending}>
      {pending ? "Enviando…" : "Enviar confirmação"}
    </button>
  );
}

export function Rsvp() {
  const [state, formAction] = useFormState(submitRsvp, initial);

  return (
    <section id="rsvp" className="bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <Reveal>
          <p className="eyebrow">Contamos com você</p>
          <h2 className="section-title after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
            Confirme sua presença
          </h2>

          <form action={formAction} className="grid gap-5 text-left">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nome" className="field-label">Nome completo</label>
              <input id="nome" name="nome" required placeholder="Seu nome" className="field-input" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="field-label">E-mail</label>
              <input id="email" name="email" type="email" placeholder="voce@email.com" className="field-input" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="telefone" className="field-label">Telefone / WhatsApp</label>
              <input id="telefone" name="telefone" placeholder="(00) 90000-0000" className="field-input" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="acompanhantes" className="field-label">Nº de acompanhantes</label>
              <input id="acompanhantes" name="acompanhantes" type="number" min={0} defaultValue={0} className="field-input" />
            </div>
            <fieldset className="flex flex-col gap-1.5 border-0 p-0">
              <legend className="field-label">Você vai comparecer?</legend>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-base text-muted">
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

            {state.message && (
              <p
                role="status"
                aria-live="polite"
                className={`text-[0.95rem] ${state.ok ? "text-olive" : "text-danger"}`}
              >
                {state.message}
              </p>
            )}
          </form>
        </Reveal>
      </div>
    </section>
  );
}
