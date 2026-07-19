"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarReembolso, type ReembolsoState } from "@/app/actions/reembolsos";

const initial: ReembolsoState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Registrar reembolso"}
    </button>
  );
}

export function NovoReembolso({ responsaveis }: { responsaveis: { id: string; nome: string }[] }) {
  const [state, formAction] = useFormState(criarReembolso, initial);
  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className="field-label">Quem pagou</label>
        <select name="pagador_payer_id" defaultValue="" className="field-input">
          <option value="">Selecionar…</option>
          {responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Quem deve reembolsar</label>
        <select name="devedor_payer_id" defaultValue="" className="field-input">
          <option value="">Selecionar…</option>
          {responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Valor (R$)</label>
        <input name="valor" inputMode="decimal" required placeholder="1.000,00" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Data</label>
        <input name="data" type="date" required className="field-input" />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label className="field-label">Motivo (opcional)</label>
        <input name="motivo" placeholder="Ex.: Guilherme pagou a entrada do buffet no lugar do Toninho" className="field-input" />
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
