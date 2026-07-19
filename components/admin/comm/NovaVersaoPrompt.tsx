"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarVersaoPrompt, type ActionState } from "@/app/actions/comm";
import type { PromptVersion } from "@/lib/comm-data";

const initial: ActionState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Criando…" : "Criar nova versão (rascunho)"}
    </button>
  );
}

/** Cria uma nova versão a partir da última (não sobrescreve a publicada — §27). */
export function NovaVersaoPrompt({ promptId, base }: { promptId: string; base: PromptVersion | null }) {
  const [state, formAction] = useFormState(criarVersaoPrompt, initial);
  return (
    <form action={formAction} className="grid gap-4 p-6">
      <input type="hidden" name="prompt_id" value={promptId} />
      <div className="flex flex-col gap-1">
        <label className="field-label">Identidade da IA</label>
        <textarea name="identidade" rows={2} defaultValue={base?.identidade ?? ""} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Objetivo</label>
        <textarea name="objetivo" rows={2} defaultValue={base?.objetivo ?? ""} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Regras</label>
        <textarea name="regras" rows={4} defaultValue={base?.regras ?? ""} className="field-input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="field-label">Formato</label>
          <input name="formato" defaultValue={base?.formato ?? ""} className="field-input" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Tom</label>
          <input name="tom" defaultValue={base?.tom ?? ""} className="field-input" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Chamada para ação</label>
          <input name="call_to_action" defaultValue={base?.call_to_action ?? ""} className="field-input" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
