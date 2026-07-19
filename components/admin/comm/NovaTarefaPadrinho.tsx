"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarTarefaPadrinho, type ActionState } from "@/app/actions/padrinhos";

const initial: ActionState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Criando…" : "Criar tarefa"}
    </button>
  );
}

export function NovaTarefaPadrinho({ membros }: { membros: { id: string; nome: string }[] }) {
  const [state, formAction] = useFormState(criarTarefaPadrinho, initial);
  return (
    <form action={formAction} className="grid gap-4 p-6 sm:grid-cols-2">
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="field-label">Tarefa</label>
        <input name="titulo" required className="field-input" placeholder="Ex.: Cobrar medidas do terno" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Padrinho (opcional)</label>
        <select name="member_id" className="field-input">
          <option value="">— geral —</option>
          {membros.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Prioridade</label>
        <select name="prioridade" defaultValue="normal" className="field-input">
          {["baixa", "normal", "alta", "urgente"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Prazo (opcional)</label>
        <input type="date" name="prazo" className="field-input" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
