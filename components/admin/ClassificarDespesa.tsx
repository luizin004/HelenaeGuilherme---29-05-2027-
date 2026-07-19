"use client";

import { useFormState, useFormStatus } from "react-dom";
import { classificarDespesa, type ClassifyState } from "@/app/actions/expenses";
import type { Option } from "@/lib/admin-data";

const initial: ClassifyState = { ok: false, message: "" };

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded border border-line px-2 py-1 text-xs uppercase tracking-wide text-moss hover:bg-cream disabled:opacity-60">
      {pending ? "…" : "Salvar"}
    </button>
  );
}

/** Campo ÚNICO de classificação financeira (§5) + responsável pelo desembolso. */
export function ClassificarDespesa({
  expenseId,
  classificacoes,
  responsaveis,
  classificacaoAtual,
  responsavelAtual,
}: {
  expenseId: string;
  classificacoes: Option[];
  responsaveis: Option[];
  classificacaoAtual: string | null;
  responsavelAtual: string | null;
}) {
  const [state, formAction] = useFormState(classificarDespesa, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="expense_id" value={expenseId} />
      <select name="classification_id" defaultValue={classificacaoAtual ?? ""} className="rounded border border-line px-1.5 py-1 text-xs" aria-label="Classificação financeira">
        <option value="">Classificação…</option>
        {classificacoes.map((c) => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>
      <select name="payer_id" defaultValue={responsavelAtual ?? ""} className="rounded border border-line px-1.5 py-1 text-xs" aria-label="Responsável">
        <option value="">Responsável…</option>
        {responsaveis.map((r) => (
          <option key={r.id} value={r.id}>{r.nome}</option>
        ))}
      </select>
      <Save />
      {state.message && <span className="text-xs text-olive">{state.ok ? "✓" : state.message}</span>}
    </form>
  );
}
