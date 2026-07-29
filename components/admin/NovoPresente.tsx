"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarPresente, type GiftFormState } from "@/app/actions/gifts";
import { MoneyInput } from "@/components/admin/MoneyInput";

const initial: GiftFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Adicionar presente"}
    </button>
  );
}

export function NovoPresente() {
  const [state, formAction] = useFormState(criarPresente, initial);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="g-nome" className="field-label">Nome</label>
        <input id="g-nome" name="nome" required placeholder="Cota da lua de mel" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="g-preco" className="field-label">Valor (R$)</label>
        <MoneyInput id="g-preco" name="preco" placeholder="R$ 0,00" className="field-input" />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="g-desc" className="field-label">Descrição (opcional)</label>
        <input id="g-desc" name="descricao" placeholder="Ajude a realizar a viagem dos sonhos." className="field-input" />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="g-img" className="field-label">URL da imagem (opcional)</label>
        <input id="g-img" name="imagem_url" placeholder="https://…" className="field-input" />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
        <input type="checkbox" name="permite_cota" defaultChecked /> Permite contribuição em cotas (vários convidados)
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <Submit />
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
