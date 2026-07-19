"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarCentroCusto, atualizarCentroCusto, alternarCentroCusto, type CentroState } from "@/app/actions/centros";

const initial: CentroState = { ok: false, message: "" };

function Btn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : label}
    </button>
  );
}

export function NovoCentroCusto() {
  const [state, formAction] = useFormState(criarCentroCusto, initial);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="field-label">Nome</label>
        <input name="nome" required placeholder="Ex.: Alimentação" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Orçamento (R$, opcional)</label>
        <input name="orcamento" inputMode="decimal" placeholder="45.000,00" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Cor</label>
        <input name="cor" type="color" defaultValue="#6f7352" className="h-10 w-14 rounded border border-line" />
      </div>
      <Btn label="Criar centro" />
      {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
    </form>
  );
}

export interface CentroEditavel {
  id: string;
  nome: string;
  cor: string | null;
  orcamento_cents: number | null;
  ativo: boolean;
}

export function CentroCustoEdit({ c }: { c: CentroEditavel }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarCentroCusto, initial);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">
          {aberto ? "fechar" : "editar"}
        </button>
        <form action={alternarCentroCusto}>
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="ativo" value={(!c.ativo).toString()} />
          <button type="submit" className="text-xs text-muted underline">{c.ativo ? "inativar" : "reativar"}</button>
        </form>
      </div>
      {aberto && (
        <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-ivory p-3">
          <input type="hidden" name="id" value={c.id} />
          <input name="nome" defaultValue={c.nome} required placeholder="Nome" className="field-input py-1.5 text-sm" />
          <input name="orcamento" defaultValue={c.orcamento_cents !== null ? (c.orcamento_cents / 100).toFixed(2).replace(".", ",") : ""} inputMode="decimal" placeholder="Orçamento (R$)" className="field-input py-1.5 text-sm" />
          <input name="cor" type="color" defaultValue={c.cor ?? "#6f7352"} className="h-9 w-12 rounded border border-line" />
          <Btn label="Salvar" />
          {state.message && <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
        </form>
      )}
    </div>
  );
}
