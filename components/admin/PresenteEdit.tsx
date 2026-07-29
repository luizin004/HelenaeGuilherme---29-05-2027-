"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { atualizarPresente, type GiftFormState } from "@/app/actions/gifts";
import { MoneyInput } from "@/components/admin/MoneyInput";

const initial: GiftFormState = { ok: false, message: "" };

export interface PresenteEditavel {
  id: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  preco: number;
  permite_cota: boolean;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

export function PresenteEdit({ g }: { g: PresenteEditavel }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarPresente, initial);

  return (
    <div>
      <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">
        {aberto ? "fechar" : "editar"}
      </button>

      {aberto && (
        <form action={formAction} className="mt-3 grid gap-2 rounded-lg border border-line bg-ivory p-3 text-left">
          <input type="hidden" name="id" value={g.id} />
          <div className="grid grid-cols-2 gap-2">
            <input name="nome" defaultValue={g.nome} placeholder="Nome" required className="field-input py-1.5 text-sm" />
            <MoneyInput name="preco" defaultValueCents={g.preco ? Math.round(Number(g.preco) * 100) : null} placeholder="Valor (R$)" className="field-input py-1.5 text-sm" />
          </div>
          <input name="descricao" defaultValue={g.descricao ?? ""} placeholder="Descrição" className="field-input py-1.5 text-sm" />
          <input name="imagem_url" defaultValue={g.imagem_url ?? ""} placeholder="URL da imagem" className="field-input py-1.5 text-sm" />
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" name="permite_cota" defaultChecked={g.permite_cota} /> Permite cota
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
