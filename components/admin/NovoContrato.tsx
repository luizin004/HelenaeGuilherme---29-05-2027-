"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarContrato, type ContractFormState } from "@/app/actions/contracts";
import type { SupplierRow } from "@/lib/admin-data";

const initial: ContractFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Cadastrar"}
    </button>
  );
}

export function NovoContrato({ fornecedores }: { fornecedores: SupplierRow[] }) {
  const [state, formAction] = useFormState(criarContrato, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="c-tit" className="field-label">Título</label>
        <input id="c-tit" name="titulo" required placeholder="Contrato do buffet" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="c-forn" className="field-label">Fornecedor</label>
        <select id="c-forn" name="supplier_id" className="field-input">
          <option value="">—</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="c-val" className="field-label">Valor (R$)</label>
        <input id="c-val" name="valor" placeholder="0,00" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="c-data" className="field-label">Data do evento</label>
        <input id="c-data" name="data_evento" type="date" className="field-input" />
      </div>
      <Submit />
      {state.message && (
        <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
      )}
    </form>
  );
}
