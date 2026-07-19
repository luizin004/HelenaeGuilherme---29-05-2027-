"use client";

import { useFormState, useFormStatus } from "react-dom";
import { atualizarPadrinho, type ActionState } from "@/app/actions/padrinhos";
import type { PartyMember } from "@/lib/comm-data";

const initial: ActionState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar acompanhamento"}
    </button>
  );
}

const SEL = [
  { name: "status", label: "Confirmação", opts: [["convidado", "Convidado"], ["confirmado", "Confirmado"], ["pendente", "Pendente"], ["recusado", "Recusou"]] },
  { name: "traje_status", label: "Traje / medidas", opts: [["pendente", "Pendente"], ["medidas_solicitadas", "Medidas solicitadas"], ["medidas_recebidas", "Medidas recebidas"], ["confirmado", "Confirmado"]] },
  { name: "ensaio_status", label: "Ensaio", opts: [["pendente", "Pendente"], ["convidado", "Convidado"], ["confirmado", "Confirmado"], ["ausente", "Ausente"]] },
  { name: "hospedagem_status", label: "Hospedagem", opts: [["nao_precisa", "Não precisa"], ["pendente", "Pendente"], ["resolvida", "Resolvida"]] },
  { name: "transporte_status", label: "Transporte", opts: [["nao_precisa", "Não precisa"], ["pendente", "Pendente"], ["resolvido", "Resolvido"]] },
] as const;

export function PadrinhoEditForm({ m }: { m: PartyMember }) {
  const [state, formAction] = useFormState(atualizarPadrinho, initial);
  return (
    <form action={formAction} className="grid gap-4 p-6 sm:grid-cols-2">
      <input type="hidden" name="id" value={m.id} />
      <div className="flex flex-col gap-1">
        <label className="field-label">Telefone</label>
        <input name="telefone" defaultValue={m.telefone ?? ""} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Instagram</label>
        <input name="instagram" defaultValue={m.instagram ?? ""} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Cidade</label>
        <input name="cidade" defaultValue={m.cidade ?? ""} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Relação com o casal</label>
        <input name="relacao" defaultValue={m.relacao ?? ""} className="field-input" />
      </div>
      {SEL.map((s) => (
        <div key={s.name} className="flex flex-col gap-1">
          <label className="field-label">{s.label}</label>
          <select name={s.name} defaultValue={(m as unknown as Record<string, string>)[s.name]} className="field-input">
            {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      ))}
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="field-label">Observação</label>
        <textarea name="observacao" defaultValue={m.observacao ?? ""} rows={2} className="field-input" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
