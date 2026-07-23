"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { vincularPar, type ActionState } from "@/app/actions/padrinhos";

const initial: ActionState = { ok: false, message: "" };

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className="btn btn-dark px-4 py-2 text-xs disabled:opacity-50">
      {pending ? "Vinculando…" : "Criar casal"}
    </button>
  );
}

/** Seleciona duas pessoas de "A vincular" e cria um casal/par (1 caixa). */
export function VincularCasal({ pessoas }: { pessoas: { id: string; nome: string; papel: string }[] }) {
  const [state, formAction] = useFormState(vincularPar, initial);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const opcoes = (excluir: string) => pessoas.filter((p) => p.id !== excluir);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
      <div className="flex flex-col gap-1">
        <label className="field-label">Pessoa 1</label>
        <select name="member_a" value={a} onChange={(e) => setA(e.target.value)} required className="field-input py-1.5 text-sm">
          <option value="">Selecionar…</option>
          {opcoes(b).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Pessoa 2</label>
        <select name="member_b" value={b} onChange={(e) => setB(e.target.value)} required className="field-input py-1.5 text-sm">
          <option value="">Selecionar…</option>
          {opcoes(a).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Tipo</label>
        <select name="tipo" defaultValue="casal" className="field-input py-1.5 text-sm">
          <option value="casal">Casal</option>
          <option value="dupla">Dupla</option>
        </select>
      </div>
      <Submit disabled={!a || !b || a === b} />
      {state.message && <span className={`text-xs sm:col-span-4 ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
    </form>
  );
}
