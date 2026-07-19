"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarProposta, type QuoteFormState } from "@/app/actions/quotes";

const initial: QuoteFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Adicionar proposta"}
    </button>
  );
}

export function NovaProposta({
  expenseId,
  fornecedores,
}: {
  expenseId: string;
  fornecedores: { id: string; nome: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(criarProposta, initial);

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="text-xs text-olive underline">
        + adicionar proposta
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 grid gap-2 rounded-lg border border-line bg-ivory p-3 text-left">
      <input type="hidden" name="expense_id" value={expenseId} />
      <div className="grid gap-2 sm:grid-cols-2">
        <select name="supplier_id" defaultValue="" className="field-input py-1.5 text-sm">
          <option value="">Fornecedor cadastrado…</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>
        <input name="fornecedor_nome" placeholder="…ou nome avulso" className="field-input py-1.5 text-sm" />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <input name="valor" inputMode="decimal" placeholder="Valor total (R$)" required className="field-input py-1.5 text-sm" />
        <input name="entrada" inputMode="decimal" placeholder="Entrada (R$)" className="field-input py-1.5 text-sm" />
        <input name="parcelas" type="number" min={0} max={60} placeholder="Parcelas" className="field-input py-1.5 text-sm" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="prazo" placeholder="Prazo / validade" className="field-input py-1.5 text-sm" />
        <input name="inclui" placeholder="O que inclui" className="field-input py-1.5 text-sm" />
      </div>
      <input name="observacao" placeholder="Observações" className="field-input py-1.5 text-sm" />
      <div className="flex items-center gap-3">
        <Submit />
        <button type="button" onClick={() => setAberto(false)} className="text-xs text-muted underline">fechar</button>
        {state.message && (
          <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
