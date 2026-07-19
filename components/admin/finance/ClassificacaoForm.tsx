"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarClassificacao, atualizarClassificacao, type ClassFormState } from "@/app/actions/classificacoes";
import type { Classificacao } from "@/lib/finance-core";

const initial: ClassFormState = { ok: false, message: "" };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark text-xs disabled:opacity-60">
      {pending ? "Salvando…" : label}
    </button>
  );
}

export function ClassificacaoForm({
  principais,
  editar,
}: {
  principais: { id: string; nome: string }[];
  editar?: Classificacao;
}) {
  const [state, formAction] = useFormState(editar ? atualizarClassificacao : criarClassificacao, initial);
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {editar && <input type="hidden" name="id" value={editar.id} />}
      <div className="flex flex-col gap-1">
        <label className="field-label">Nome</label>
        <input name="nome" required defaultValue={editar?.nome ?? ""} className="field-input" placeholder="Ex.: Decoração" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Classificação principal (opcional)</label>
        <select name="parent_id" defaultValue={editar?.parent_id ?? ""} className="field-input">
          <option value="">— nenhuma (é principal) —</option>
          {principais
            .filter((p) => p.id !== editar?.id)
            .map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Descrição</label>
        <input name="descricao" defaultValue={editar?.descricao ?? ""} className="field-input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="field-label">Cor</label>
          <input type="color" name="cor" defaultValue={editar?.cor ?? "#6f7352"} className="field-input h-10 p-1" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Orçamento (opcional)</label>
          <input
            name="orcamento"
            defaultValue={editar?.orcamento_cents ? (editar.orcamento_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}
            placeholder="R$ 0,00"
            className="field-input"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Submit label={editar ? "Salvar" : "Adicionar classificação"} />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
