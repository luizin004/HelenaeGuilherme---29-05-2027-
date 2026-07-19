"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarGrupo, atualizarGrupo, excluirGrupo, type GrupoState } from "@/app/actions/grupos";

const initial: GrupoState = { ok: false, message: "" };

function Btn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">{pending ? "Salvando…" : label}</button>;
}

const LADOS: [string, string][] = [["", "—"], ["noiva", "Noiva"], ["noivo", "Noivo"], ["ambos", "Ambos"]];

export function NovoGrupo() {
  const [state, formAction] = useFormState(criarGrupo, initial);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="field-label">Nome do grupo</label>
        <input name="nome" required placeholder="Ex.: Família Silva" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Lado</label>
        <select name="lado" defaultValue="" className="field-input">
          {LADOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Máx. convidados</label>
        <input name="max_convidados" type="number" min={1} className="field-input w-28" />
      </div>
      <Btn label="Criar grupo" />
      {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
    </form>
  );
}

export interface GrupoEditavel {
  id: string;
  nome: string;
  lado: string | null;
  max_convidados: number | null;
  observacao: string | null;
}

export function GrupoActions({ g }: { g: GrupoEditavel }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarGrupo, initial);
  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">{aberto ? "fechar" : "editar"}</button>
        <form action={excluirGrupo} onSubmit={(e) => { if (!confirm(`Excluir o grupo "${g.nome}"? Os convidados ficam sem grupo.`)) e.preventDefault(); }}>
          <input type="hidden" name="id" value={g.id} />
          <button type="submit" className="text-xs text-danger underline">excluir</button>
        </form>
      </div>
      {aberto && (
        <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-ivory p-3">
          <input type="hidden" name="id" value={g.id} />
          <input name="nome" defaultValue={g.nome} required placeholder="Nome" className="field-input py-1.5 text-sm" />
          <select name="lado" defaultValue={g.lado ?? ""} className="field-input py-1.5 text-sm">
            {LADOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input name="max_convidados" type="number" min={1} defaultValue={g.max_convidados ?? ""} placeholder="Máx." className="field-input w-24 py-1.5 text-sm" />
          <input name="observacao" defaultValue={g.observacao ?? ""} placeholder="Observação" className="field-input py-1.5 text-sm" />
          <Btn label="Salvar" />
          {state.message && <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
        </form>
      )}
    </div>
  );
}
