"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { atualizarContrato, excluirContrato, type ContractFormState } from "@/app/actions/contracts";

const initial: ContractFormState = { ok: false, message: "" };

export interface ContratoEditavel {
  id: string;
  titulo: string;
  supplier_id: string | null;
  valor: number;
  data_evento: string | null;
  status: string;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

export function ContratoActions({
  c,
  fornecedores,
}: {
  c: ContratoEditavel;
  fornecedores: { id: string; nome: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarContrato, initial);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">
          {aberto ? "fechar" : "editar"}
        </button>
        <form
          action={excluirContrato}
          onSubmit={(e) => {
            if (!confirm(`Excluir o contrato "${c.titulo}"?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={c.id} />
          <button type="submit" className="text-xs text-danger underline">excluir</button>
        </form>
      </div>

      {aberto && (
        <form action={formAction} className="mt-3 grid gap-2 rounded-lg border border-line bg-ivory p-3 text-left">
          <input type="hidden" name="id" value={c.id} />
          <input name="titulo" defaultValue={c.titulo} placeholder="Título" required className="field-input py-1.5 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input name="valor" defaultValue={c.valor ? c.valor.toFixed(2).replace(".", ",") : ""} inputMode="decimal" placeholder="Valor (R$)" className="field-input py-1.5 text-sm" />
            <input name="data_evento" type="date" defaultValue={c.data_evento ?? ""} className="field-input py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select name="supplier_id" defaultValue={c.supplier_id ?? ""} className="field-input py-1.5 text-sm">
              <option value="">Sem fornecedor</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
            <select name="status" defaultValue={c.status} className="field-input py-1.5 text-sm">
              <option value="rascunho">Rascunho</option>
              <option value="pendente_assinatura">Pendente assinatura</option>
              <option value="assinado">Assinado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
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
