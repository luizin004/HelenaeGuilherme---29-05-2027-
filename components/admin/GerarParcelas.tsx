"use client";

import { useFormState, useFormStatus } from "react-dom";
import { gerarParcelas, type InstallmentState } from "@/app/actions/installments";

const initial: InstallmentState = { ok: false, message: "" };

function Submit({ temParcelas }: { temParcelas: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-2 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : temParcelas ? "Renegociar" : "Gerar"}
    </button>
  );
}

/**
 * Gera/renegocia o cronograma de uma despesa. Quando já há parcelas,
 * exige um motivo (a renegociação versiona o cronograma anterior).
 */
export function GerarParcelas({ expenseId, temParcelas }: { expenseId: string; temParcelas: boolean }) {
  const [state, formAction] = useFormState(gerarParcelas, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="expense_id" value={expenseId} />
      <div className="flex flex-col gap-1">
        <label className="field-label">Parcelas</label>
        <input name="n" type="number" min={1} max={60} defaultValue={temParcelas ? undefined : 1} required className="field-input w-20 py-1" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">1º vencimento</label>
        <input name="primeiro_vencimento" type="date" className="field-input py-1" />
      </div>
      {temParcelas && (
        <div className="flex flex-col gap-1">
          <label className="field-label">Motivo</label>
          <input name="motivo" placeholder="Motivo da renegociação" className="field-input py-1" required />
        </div>
      )}
      <Submit temParcelas={temParcelas} />
      {state.message && (
        <span className={`w-full text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
      )}
    </form>
  );
}
