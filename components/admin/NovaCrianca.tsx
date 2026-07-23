"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarCrianca, type ChildFormState } from "@/app/actions/children";
import type { Guest } from "@/lib/database.types";

const initial: ChildFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Cadastrar"}
    </button>
  );
}

export function NovaCrianca({ responsaveis }: { responsaveis: Guest[] }) {
  const [state, formAction] = useFormState(criarCrianca, initial);

  return (
    <form action={formAction} className="grid gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="k-nome" className="field-label">Nome</label>
          <input id="k-nome" name="nome" required placeholder="Nome da criança" className="field-input" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="k-idade" className="field-label">Idade</label>
          <input id="k-idade" name="idade" type="number" min={0} max={17} className="field-input w-24" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="k-resp" className="field-label">Convidado vinculado</label>
          <select id="k-resp" name="responsavel_id" className="field-input">
            <option value="">—</option>
            {responsaveis.map((g) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>
        </div>
        <Submit />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="k-respfesta" className="field-label">Responsável pela criança na festa</label>
        <input id="k-respfesta" name="responsavel_festa" placeholder="Nome de quem acompanha a criança" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="k-obs" className="field-label">Alergias / cuidados especiais</label>
        <input id="k-obs" name="observacoes" placeholder="Ex.: alergia a amendoim" className="field-input" />
      </div>
      {state.message && (
        <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
      )}
    </form>
  );
}
