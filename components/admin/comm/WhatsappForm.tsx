"use client";

import { useFormState, useFormStatus } from "react-dom";
import { salvarCanalWhatsapp, type ActionState } from "@/app/actions/comm";
import type { WhatsappChannel } from "@/lib/comm-data";

const initial: ActionState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar canal"}
    </button>
  );
}

export function WhatsappForm({ canal }: { canal: WhatsappChannel | null }) {
  const [state, formAction] = useFormState(salvarCanalWhatsapp, initial);
  return (
    <form action={formAction} className="grid gap-4 p-6 sm:grid-cols-2">
      {canal && <input type="hidden" name="id" value={canal.id} />}
      <div className="flex flex-col gap-1">
        <label className="field-label">Nome do canal</label>
        <input name="nome" defaultValue={canal?.nome ?? "WhatsApp oficial"} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Responsável operacional</label>
        <input name="responsavel" defaultValue={canal?.responsavel ?? "Evania"} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">DDD</label>
        <input name="ddd" defaultValue={canal?.ddd ?? ""} className="field-input" placeholder="31" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Número</label>
        <input name="numero" defaultValue={canal?.numero ?? ""} className="field-input" placeholder="9 9xxx-xxxx" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Nome de exibição</label>
        <input name="display_name" defaultValue={canal?.display_name ?? ""} className="field-input" placeholder="Helena & Guilherme" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Provedor</label>
        <input name="provedor" defaultValue={canal?.provedor ?? ""} className="field-input" placeholder="Ex.: WhatsApp Cloud API" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Ambiente</label>
        <select name="ambiente" defaultValue={canal?.ambiente ?? "producao"} className="field-input">
          <option value="sandbox">Sandbox (teste)</option>
          <option value="producao">Produção</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Assinatura</label>
        <input name="assinatura" defaultValue={canal?.assinatura ?? ""} className="field-input" placeholder="— Helena & Guilherme" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Horário permitido — início</label>
        <input type="time" name="horario_inicio" defaultValue={canal?.horario_inicio?.slice(0, 5) ?? "08:00"} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Horário permitido — fim</label>
        <input type="time" name="horario_fim" defaultValue={canal?.horario_fim?.slice(0, 5) ?? "20:00"} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Limite diário</label>
        <input type="number" name="limite_diario" defaultValue={canal?.limite_diario ?? 500} min={1} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Limite por pessoa</label>
        <input type="number" name="limite_por_pessoa" defaultValue={canal?.limite_por_pessoa ?? 3} min={1} className="field-input" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
