"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarAporte, type AporteState } from "@/app/actions/aportes";

const initial: AporteState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Registrar aporte"}
    </button>
  );
}

export function NovoAporte({ responsaveis }: { responsaveis: { id: string; nome: string }[] }) {
  const [state, formAction] = useFormState(criarAporte, initial);
  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className="field-label">Responsável</label>
        <select name="payer_id" defaultValue="" className="field-input">
          <option value="">Selecionar…</option>
          {responsaveis.map((r) => (
            <option key={r.id} value={r.id}>{r.nome}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">…ou terceiro (nome)</label>
        <input name="responsavel_nome" placeholder="Ex.: Tia Elen" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Valor (R$)</label>
        <input name="valor" inputMode="decimal" required placeholder="5.000,00" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Data</label>
        <input name="data" type="date" required className="field-input" />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label className="field-label">Finalidade (opcional)</label>
        <input name="finalidade" placeholder="Ex.: entrada do buffet" className="field-input" />
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
