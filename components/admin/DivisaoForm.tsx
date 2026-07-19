"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { definirDivisao, type SplitState } from "@/app/actions/splits";
import { formatCents } from "@/domain/money";

const initial: SplitState = { ok: false, message: "" };

function centsToInput(c: number | undefined): string {
  if (!c) return "";
  return (c / 100).toFixed(2).replace(".", ",");
}
function inputToCents(v: string): number {
  const n = v.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const f = Number(n);
  return Number.isFinite(f) ? Math.round(f * 100) : 0;
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar divisão"}
    </button>
  );
}

export function DivisaoForm({
  expenseId,
  totalCents,
  responsaveis,
  splits,
}: {
  expenseId: string;
  totalCents: number;
  responsaveis: { id: string; nome: string }[];
  splits: Record<string, number>;
}) {
  const [state, formAction] = useFormState(definirDivisao, initial);
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(responsaveis.map((r) => [r.id, centsToInput(splits[r.id])])),
  );

  const soma = responsaveis.reduce((n, r) => n + inputToCents(valores[r.id] ?? ""), 0);
  const fecha = soma === totalCents;
  const preencher = (id: string, v: string) => setValores((p) => ({ ...p, [id]: v }));

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="expense_id" value={expenseId} />
      <div className="flex flex-wrap items-end gap-3">
        {responsaveis.map((r) => (
          <div key={r.id} className="flex flex-col gap-1">
            <label className="field-label">{r.nome}</label>
            <input
              name={`valor_${r.id}`}
              inputMode="decimal"
              value={valores[r.id] ?? ""}
              onChange={(e) => preencher(r.id, e.target.value)}
              placeholder="0,00"
              className="field-input w-28 py-1.5 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            // Divide igualmente entre os responsáveis (resto no primeiro).
            const n = responsaveis.length;
            const base = Math.floor(totalCents / n);
            const resto = totalCents - base * n;
            const novo: Record<string, string> = {};
            responsaveis.forEach((r, i) => (novo[r.id] = centsToInput(base + (i === 0 ? resto : 0))));
            setValores(novo);
          }}
          className="text-xs text-olive underline"
        >
          dividir igual
        </button>
        <Submit />
      </div>
      <p className={`text-xs ${fecha ? "text-olive" : "text-danger"}`}>
        Soma: {formatCents(soma)} / total {formatCents(totalCents)} — {fecha ? "fecha exato ✓" : "não fecha"}
      </p>
      {state.message && <p className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}
