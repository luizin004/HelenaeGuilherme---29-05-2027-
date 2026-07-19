"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { atualizarCrianca, excluirCrianca, type ChildFormState } from "@/app/actions/children";

const initial: ChildFormState = { ok: false, message: "" };

export interface CriancaEditavel {
  id: string;
  nome: string;
  idade: number | null;
  responsavel_id: string | null;
  observacoes: string | null;
  usara_espaco: boolean;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

export function CriancaActions({
  c,
  responsaveis,
}: {
  c: CriancaEditavel;
  responsaveis: { id: string; nome: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarCrianca, initial);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">
          {aberto ? "fechar" : "editar"}
        </button>
        <form
          action={excluirCrianca}
          onSubmit={(e) => {
            if (!confirm(`Excluir ${c.nome} do espaço infantil?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={c.id} />
          <button type="submit" className="text-xs text-danger underline">excluir</button>
        </form>
      </div>

      {aberto && (
        <form action={formAction} className="mt-3 grid gap-2 rounded-lg border border-line bg-ivory p-3 text-left">
          <input type="hidden" name="id" value={c.id} />
          <div className="grid grid-cols-2 gap-2">
            <input name="nome" defaultValue={c.nome} placeholder="Nome" required className="field-input py-1.5 text-sm" />
            <input name="idade" type="number" min={0} max={17} defaultValue={c.idade ?? ""} placeholder="Idade" className="field-input py-1.5 text-sm" />
          </div>
          <select name="responsavel_id" defaultValue={c.responsavel_id ?? ""} className="field-input py-1.5 text-sm">
            <option value="">Responsável (opcional)</option>
            {responsaveis.map((r) => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
          <input name="observacoes" defaultValue={c.observacoes ?? ""} placeholder="Alergias / cuidados" className="field-input py-1.5 text-sm" />
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" name="usara_espaco" defaultChecked={c.usara_espaco} /> Usará o espaço infantil
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
