"use client";

import { useFormState, useFormStatus } from "react-dom";
import { atualizarFaseDetalhe, type ActionState } from "@/app/actions/comm";
import type { JourneyStage } from "@/lib/comm-data";

const initial: ActionState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-outline text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar fase"}
    </button>
  );
}

export function FaseEditForm({ fase, journeyId }: { fase: JourneyStage; journeyId: string }) {
  const [state, formAction] = useFormState(atualizarFaseDetalhe, initial);
  return (
    <form action={formAction} className="grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={fase.id} />
      <input type="hidden" name="journey_id" value={journeyId} />
      <div className="flex flex-col gap-1">
        <label className="field-label">Nome</label>
        <input name="nome" defaultValue={fase.nome} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Tipo de mensagem</label>
        <input name="tipo_mensagem" defaultValue={fase.tipo_mensagem ?? ""} className="field-input" />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="field-label">Objetivo</label>
        <input name="objetivo" defaultValue={fase.objetivo ?? ""} className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Canal</label>
        <select name="canal" defaultValue={fase.canal} className="field-input">
          <option value="whatsapp">WhatsApp</option>
          <option value="email">E-mail</option>
          <option value="audio">Áudio</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Aprovação</label>
        <select name="aprovacao" defaultValue={fase.aprovacao} className="field-input">
          <option value="nenhuma">Nenhuma</option>
          <option value="evania">Evania</option>
          <option value="um_noivo">Um dos noivos</option>
          <option value="dois_noivos">Os dois noivos</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="field-label">Intervalo mínimo (dias)</label>
        <input type="number" name="intervalo_min_dias" defaultValue={fase.intervalo_min_dias} min={0} className="field-input" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
