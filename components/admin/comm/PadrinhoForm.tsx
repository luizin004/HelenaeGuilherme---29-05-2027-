"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarPadrinho, type ActionState } from "@/app/actions/padrinhos";

const initial: ActionState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Adicionar"}
    </button>
  );
}

export function PadrinhoForm() {
  const [state, formAction] = useFormState(criarPadrinho, initial);
  return (
    <form action={formAction} className="grid gap-4 p-6 sm:grid-cols-2">
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="p-nome" className="field-label">Nome</label>
        <input id="p-nome" name="nome" required className="field-input" placeholder="Nome completo" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="p-papel" className="field-label">Papel</label>
        <select id="p-papel" name="papel" className="field-input">
          <option value="padrinho">Padrinho</option>
          <option value="madrinha">Madrinha</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="p-lado" className="field-label">Lado</label>
        <select id="p-lado" name="lado" className="field-input">
          <option value="">—</option>
          <option value="helena">Helena</option>
          <option value="guilherme">Guilherme</option>
          <option value="ambos">Ambos</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="p-tel" className="field-label">Telefone (WhatsApp)</label>
        <input id="p-tel" name="telefone" className="field-input" placeholder="+55 31 9…" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="p-insta" className="field-label">Instagram</label>
        <input id="p-insta" name="instagram" className="field-input" placeholder="@usuario" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="p-cidade" className="field-label">Cidade</label>
        <input id="p-cidade" name="cidade" className="field-input" placeholder="Cidade de partida" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="p-rel" className="field-label">Relação com o casal</label>
        <input id="p-rel" name="relacao" className="field-input" placeholder="Ex.: amigo de infância do Guilherme" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
