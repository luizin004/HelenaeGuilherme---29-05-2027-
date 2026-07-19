"use client";

import { useFormState, useFormStatus } from "react-dom";
import { salvarLocal, type VenueState } from "@/app/actions/venues";
import type { Venue } from "@/lib/database.types";

const initial: VenueState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">{pending ? "Salvando…" : "Salvar local"}</button>;
}

export function LocalForm({ v }: { v: Venue }) {
  const [state, formAction] = useFormState(salvarLocal, initial);
  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="id" value={v.id} />
      <div className="grid gap-3 md:grid-cols-2">
        <input name="endereco" defaultValue={v.endereco ?? ""} placeholder="Endereço" className="field-input" />
        <input name="cidade" defaultValue={v.cidade ?? ""} placeholder="Cidade" className="field-input" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <input name="horario" defaultValue={v.horario ?? ""} placeholder="Horário (ex.: 15h00)" className="field-input" />
        <input name="latitude" defaultValue={v.latitude ?? ""} placeholder="Latitude (ex.: -19.6188)" className="field-input" />
        <input name="longitude" defaultValue={v.longitude ?? ""} placeholder="Longitude (ex.: -43.2266)" className="field-input" />
      </div>
      <input name="maps_url" defaultValue={v.maps_url ?? ""} placeholder="Link do Google Maps (opcional)" className="field-input" />
      <div className="flex items-center gap-3">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
