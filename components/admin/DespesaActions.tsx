"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { atualizarDespesa, excluirDespesa, type ExpenseFormState } from "@/app/actions/expenses";
import { CATEGORIAS } from "@/domain/orcamento/catalogo";

const initial: ExpenseFormState = { ok: false, message: "" };

export interface DespesaEditavel {
  id: string;
  descricao: string;
  estado: string;
  gratuito: boolean;
  valor_total_cents: number | null;
  observacao: string | null;
  categoria: string | null;
}

function centsToInput(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

export function DespesaActions({ d }: { d: DespesaEditavel }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarDespesa, initial);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">
          {aberto ? "fechar" : "editar"}
        </button>
        <form
          action={excluirDespesa}
          onSubmit={(e) => {
            if (!confirm(`Excluir a despesa "${d.descricao}"? (exclusão lógica)`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={d.id} />
          <button type="submit" className="text-xs text-danger underline">excluir</button>
        </form>
      </div>

      {aberto && (
        <form action={formAction} className="mt-3 grid gap-2 rounded-lg border border-line bg-ivory p-3 text-left">
          <input type="hidden" name="id" value={d.id} />
          <input name="descricao" defaultValue={d.descricao} placeholder="Descrição" required className="field-input py-1.5 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="valor"
              defaultValue={centsToInput(d.valor_total_cents)}
              inputMode="decimal"
              placeholder="Valor (R$)"
              className="field-input py-1.5 text-sm"
            />
            <select name="estado" defaultValue={d.gratuito ? "gratuito" : d.estado} className="field-input py-1.5 text-sm">
              <option value="previsto">Previsto</option>
              <option value="orcado">Orçado</option>
              <option value="contratado">Contratado</option>
              <option value="pago">Pago</option>
            </select>
          </div>
          <input name="categoria" defaultValue={d.categoria ?? ""} list="cat-list-edit" placeholder="Categoria" className="field-input py-1.5 text-sm" />
          <datalist id="cat-list-edit">
            {CATEGORIAS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <input name="observacao" defaultValue={d.observacao ?? ""} placeholder="Observação" className="field-input py-1.5 text-sm" />
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" name="gratuito" defaultChecked={d.gratuito} /> É gratuito / cortesia
          </label>
          <div className="flex items-center gap-3">
            <SaveButton />
            {state.message && (
              <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
