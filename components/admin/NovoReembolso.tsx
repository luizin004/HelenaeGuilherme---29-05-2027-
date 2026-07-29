"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarReembolso, type ReembolsoState } from "@/app/actions/reembolsos";
import { MoneyInput } from "@/components/admin/MoneyInput";

const initial: ReembolsoState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Registrar reembolso"}
    </button>
  );
}

export function NovoReembolso({ responsaveis }: { responsaveis: { id: string; nome: string }[] }) {
  const [state, formAction] = useFormState(criarReembolso, initial);
  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className="field-label">Quem pagou</label>
        <input
          name="pagador_nome"
          list="reembolso-pessoas"
          required
          autoComplete="off"
          placeholder="Qualquer pessoa — ex.: Tia Elen, Guilherme…"
          className="field-input"
        />
        <span className="text-xs text-muted">Campo livre: quem desembolsou (para receber de volta).</span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Quem deve reembolsar</label>
        <input
          name="devedor_nome"
          list="reembolso-pessoas"
          required
          autoComplete="off"
          placeholder="Qualquer pessoa — ex.: Toninho, Helena…"
          className="field-input"
        />
        <span className="text-xs text-muted">Campo livre: quem deve acertar com quem pagou.</span>
      </div>
      <datalist id="reembolso-pessoas">
        {responsaveis.map((r) => <option key={r.id} value={r.nome} />)}
      </datalist>
      <div className="flex flex-col gap-1">
        <label className="field-label">Valor (R$)</label>
        <MoneyInput name="valor" required placeholder="R$ 0,00" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Data</label>
        <input name="data" type="date" required className="field-input" />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label className="field-label">Motivo (opcional)</label>
        <input name="motivo" placeholder="Ex.: Guilherme pagou a entrada do buffet no lugar do Toninho" className="field-input" />
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
