"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { atualizarFornecedor, excluirFornecedor, type SupplierFormState } from "@/app/actions/suppliers";

const initial: SupplierFormState = { ok: false, message: "" };

export interface FornecedorEditavel {
  id: string;
  nome: string;
  categoria: string | null;
  contato_nome: string | null;
  telefone: string | null;
  email: string | null;
  status: string;
  observacoes: string | null;
  documento: string | null;
  endereco: string | null;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

export function FornecedorActions({ f }: { f: FornecedorEditavel }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarFornecedor, initial);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">
          {aberto ? "fechar" : "editar"}
        </button>
        <form
          action={excluirFornecedor}
          onSubmit={(e) => {
            if (!confirm(`Excluir o fornecedor "${f.nome}"?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={f.id} />
          <button type="submit" className="text-xs text-danger underline">excluir</button>
        </form>
      </div>

      {aberto && (
        <form action={formAction} className="mt-3 grid gap-2 rounded-lg border border-line bg-ivory p-3 text-left">
          <input type="hidden" name="id" value={f.id} />
          <div className="grid grid-cols-2 gap-2">
            <input name="nome" defaultValue={f.nome} placeholder="Nome" required className="field-input py-1.5 text-sm" />
            <input name="categoria" defaultValue={f.categoria ?? ""} placeholder="Categoria" className="field-input py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="contato_nome" defaultValue={f.contato_nome ?? ""} placeholder="Contato" className="field-input py-1.5 text-sm" />
            <input name="telefone" defaultValue={f.telefone ?? ""} placeholder="Telefone" className="field-input py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="email" defaultValue={f.email ?? ""} placeholder="E-mail" className="field-input py-1.5 text-sm" />
            <select name="status" defaultValue={f.status} className="field-input py-1.5 text-sm">
              <option value="prospeccao">Prospecção</option>
              <option value="negociando">Negociando</option>
              <option value="contratado">Contratado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="documento" defaultValue={f.documento ?? ""} placeholder="CNPJ / CPF" className="field-input py-1.5 text-sm" />
            <input name="endereco" defaultValue={f.endereco ?? ""} placeholder="Endereço" className="field-input py-1.5 text-sm" />
          </div>
          <span className="text-[11px] text-muted">CNPJ e endereço qualificam o contratado na autorização de contratação.</span>
          <input name="observacoes" defaultValue={f.observacoes ?? ""} placeholder="Observações" className="field-input py-1.5 text-sm" />
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
