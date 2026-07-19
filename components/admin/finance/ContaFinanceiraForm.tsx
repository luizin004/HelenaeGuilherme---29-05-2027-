"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarContaFinanceira, type ConfigFormState } from "@/app/actions/finance-config";

const initial: ConfigFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Adicionar conta"}
    </button>
  );
}

export function ContaFinanceiraForm() {
  const [state, formAction] = useFormState(criarContaFinanceira, initial);
  const [tipo, setTipo] = useState("conta");

  return (
    <form action={formAction} className="grid gap-3 p-6 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className="field-label">Nome</label>
        <input name="nome" required className="field-input" placeholder="Ex.: Conta conjunta" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Tipo</label>
        <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="field-input">
          <option value="conta">Conta bancária</option>
          <option value="carteira">Carteira / dinheiro</option>
          <option value="cartao_credito">Cartão de crédito</option>
          <option value="poupanca">Poupança</option>
          <option value="outro">Outro</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Saldo inicial</label>
        <input name="saldo_inicial" placeholder="R$ 0,00" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Titular (opcional)</label>
        <input name="titular" className="field-input" />
      </div>
      {tipo === "cartao_credito" && (
        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
          <div className="flex flex-col gap-1">
            <label className="field-label">Dia de fechamento</label>
            <input type="number" name="dia_fechamento" min={1} max={31} className="field-input" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="field-label">Dia de vencimento</label>
            <input type="number" name="dia_vencimento" min={1} max={31} className="field-input" />
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 sm:col-span-2">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
