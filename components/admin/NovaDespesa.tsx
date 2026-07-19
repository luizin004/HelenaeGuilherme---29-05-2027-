"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarDespesa, type ExpenseFormState } from "@/app/actions/expenses";
import { CATEGORIAS } from "@/domain/orcamento/catalogo";

const initial: ExpenseFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Cadastrar despesa"}
    </button>
  );
}

export function NovaDespesa() {
  const [state, formAction] = useFormState(criarDespesa, initial);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="d-desc" className="field-label">Descrição</label>
        <input id="d-desc" name="descricao" required placeholder="Ex.: Buffet, Decoração…" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="d-valor" className="field-label">Valor total (R$) — deixe vazio se ainda a definir</label>
        <input id="d-valor" name="valor" inputMode="decimal" placeholder="1.500,00" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="d-estado" className="field-label">Estado</label>
        <select id="d-estado" name="estado" defaultValue="previsto" className="field-input">
          <option value="previsto">Previsto</option>
          <option value="orcado">Orçado</option>
          <option value="contratado">Contratado</option>
          <option value="pago">Pago</option>
        </select>
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="d-cat" className="field-label">Categoria (opcional)</label>
        <input id="d-cat" name="categoria" list="cat-list" placeholder="Buffet, Música…" className="field-input" />
        <datalist id="cat-list">
          {CATEGORIAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="d-obs" className="field-label">Observação (opcional)</label>
        <input id="d-obs" name="observacao" placeholder="Condições de pagamento, detalhes…" className="field-input" />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
        <input type="checkbox" name="gratuito" /> É gratuito / cortesia (não gera valor nem parcela)
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <Submit />
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
