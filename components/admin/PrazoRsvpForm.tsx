"use client";

import { useFormState, useFormStatus } from "react-dom";
import { salvarPrazoRsvp, type ContentState } from "@/app/actions/content";

const initial: ContentState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar prazo"}
    </button>
  );
}

/**
 * Converte um ISO com fuso (ex.: "2027-03-30T23:59:59-03:00") para o formato
 * aceito por <input type="datetime-local"> ("2027-03-30T23:59"), preservando
 * o horário de Brasília independentemente do fuso do navegador do admin.
 */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` : "";
}

export function PrazoRsvpForm({ prazo }: { prazo: string | null }) {
  const [state, formAction] = useFormState(salvarPrazoRsvp, initial);

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rsvp_prazo" className="field-label">Prazo para confirmação (horário de Brasília)</label>
        <input
          id="rsvp_prazo"
          name="rsvp_prazo"
          type="datetime-local"
          defaultValue={toLocalInput(prazo)}
          className="field-input"
          required
        />
        <span className="text-xs text-muted">
          Após esta data o formulário público é bloqueado. Para reabrir, informe uma nova data futura.
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="justificativa" className="field-label">Justificativa (registrada na auditoria)</label>
        <input
          id="justificativa"
          name="justificativa"
          placeholder="Ex.: reabertura para convidados que perderam o prazo"
          className="field-input"
        />
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
