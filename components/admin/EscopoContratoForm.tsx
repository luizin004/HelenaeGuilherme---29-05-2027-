"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { salvarEscopoContrato, type ContratacaoState } from "@/app/actions/contratacao";

const initial: ContratacaoState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

/** Escopo e observações que entram no corpo da autorização. */
export function EscopoContratoForm({
  id,
  escopo,
  observacoes,
  sugestao,
}: {
  id: string;
  escopo: string | null;
  observacoes: string | null;
  sugestao: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(salvarEscopoContrato, initial);

  return (
    <div className="print:hidden">
      <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">
        {aberto ? "fechar" : "editar escopo e observações"}
      </button>

      {aberto && (
        <form action={formAction} className="mt-3 grid gap-2 rounded-lg border border-line bg-ivory p-3">
          <input type="hidden" name="id" value={id} />
          <label htmlFor="esc-escopo" className="field-label">O que está incluso (escopo)</label>
          <textarea
            id="esc-escopo"
            name="escopo"
            defaultValue={escopo ?? sugestao ?? ""}
            rows={4}
            placeholder="Descreva o que o fornecedor entrega — uma linha por item."
            className="field-input text-sm"
          />
          {sugestao && !escopo && (
            <span className="text-[11px] text-muted">Sugerido a partir da proposta escolhida em Cotações.</span>
          )}
          <label htmlFor="esc-obs" className="field-label">Observações deste contrato</label>
          <input
            id="esc-obs"
            name="observacoes"
            defaultValue={observacoes ?? ""}
            placeholder="Ex.: montagem no dia anterior, a partir das 14h."
            className="field-input py-1.5 text-sm"
          />
          <div className="flex items-center gap-3">
            <Submit />
            {state.message && (
              <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
