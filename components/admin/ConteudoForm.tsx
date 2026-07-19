"use client";

import { useFormState, useFormStatus } from "react-dom";
import { salvarConteudo, type ContentState } from "@/app/actions/content";

const initial: ContentState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar conteúdo"}
    </button>
  );
}

export function ConteudoForm({ historia, hashtag }: { historia: string; hashtag: string }) {
  const [state, formAction] = useFormState(salvarConteudo, initial);

  return (
    <form action={formAction} className="grid max-w-2xl gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="historia" className="field-label">Nossa história (aparece no site)</label>
        <textarea
          id="historia"
          name="historia"
          rows={7}
          defaultValue={historia}
          placeholder="Contem como se conheceram, o pedido, os momentos que os trouxeram até aqui…"
          className="field-input"
        />
        <span className="text-xs text-muted">Cada parágrafo em uma linha. Deixe em branco para usar o texto de exemplo.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="hashtag" className="field-label">Hashtag</label>
        <input id="hashtag" name="hashtag" defaultValue={hashtag} placeholder="#HelenaEGuilherme2027" className="field-input" />
      </div>
      <div className="flex items-center gap-3">
        <Submit />
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
