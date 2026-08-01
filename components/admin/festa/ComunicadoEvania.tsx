"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarComunicadoNossaFesta, type FestaState } from "@/app/actions/festa";

const initial: FestaState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Criando…" : "Criar comunicado na Evania"}
    </button>
  );
}

/**
 * Disparo da Evania que leva os convidados até a aba. Cria uma campanha em
 * RASCUNHO — o envio continua passando pela aprovação normal da Comunicação.
 */
export function ComunicadoEvania({ texto, link }: { texto: string; link: string }) {
  const [state, formAction] = useFormState(criarComunicadoNossaFesta, initial);
  const [copiado, setCopiado] = useState(false);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <form action={formAction} className="grid gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-ivory px-3 py-2.5 text-sm">
        <span className="text-muted">Link direto da aba:</span>
        <code className="break-all font-mono text-xs text-moss">{link}</code>
        <button type="button" onClick={copiarLink} className="text-xs text-olive underline">
          {copiado ? "copiado ✓" : "copiar"}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ce-corpo" className="field-label">
          Texto do comunicado
        </label>
        <textarea id="ce-corpo" name="corpo_modelo" rows={10} defaultValue={texto} className="field-input font-mono text-xs" />
        <span className="text-xs text-muted">
          <code>{"{{nome}}"}</code> é substituído pelo nome de cada convidado no momento do envio.
        </span>
      </div>

      {state.message && <p className={`text-sm ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <Submit />
        <a href="/admin/comunicacao/campanhas" className="text-sm text-olive underline">
          ver campanhas
        </a>
      </div>
    </form>
  );
}
