"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { atualizarComunicado, excluirComunicado, type CommFormState } from "@/app/actions/communications";

const initial: CommFormState = { ok: false, message: "" };

export interface ComunicadoEditavel {
  id: string;
  canal: string;
  assunto: string | null;
  corpo: string;
  publico: string;
  status: string;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

export function ComunicadoActions({ m }: { m: ComunicadoEditavel }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarComunicado, initial);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">
          {aberto ? "fechar" : "editar"}
        </button>
        <form
          action={excluirComunicado}
          onSubmit={(e) => {
            if (!confirm("Excluir esta mensagem?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={m.id} />
          <button type="submit" className="text-xs text-danger underline">excluir</button>
        </form>
      </div>

      {aberto && (
        <form action={formAction} className="mt-3 grid gap-2 rounded-lg border border-line bg-ivory p-3 text-left">
          <input type="hidden" name="id" value={m.id} />
          <div className="grid grid-cols-3 gap-2">
            <select name="canal" defaultValue={m.canal} className="field-input py-1.5 text-sm">
              <option value="email">E-mail</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
            <select name="publico" defaultValue={m.publico} className="field-input py-1.5 text-sm">
              <option value="todos">Todos</option>
              <option value="confirmados">Confirmados</option>
              <option value="pendentes">Pendentes</option>
              <option value="recusados">Recusados</option>
            </select>
            <select name="status" defaultValue={m.status === "enviado" ? "enviado" : m.status === "agendado" ? "agendado" : "rascunho"} className="field-input py-1.5 text-sm">
              <option value="rascunho">Rascunho</option>
              <option value="agendado">Agendado</option>
              <option value="enviado">Enviado (manual)</option>
            </select>
          </div>
          <input name="assunto" defaultValue={m.assunto ?? ""} placeholder="Assunto" className="field-input py-1.5 text-sm" />
          <textarea name="corpo" defaultValue={m.corpo} rows={3} required className="field-input py-1.5 text-sm" />
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
