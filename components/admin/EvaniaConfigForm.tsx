"use client";

import { useFormState, useFormStatus } from "react-dom";
import { salvarEvania, type EvaniaState } from "@/app/actions/evania";
import type { EvaniaConfig } from "@/lib/admin-data";

const initial: EvaniaState = { ok: false, message: "" };
const DIAS: [string, string][] = [["seg", "Seg"], ["ter", "Ter"], ["qua", "Qua"], ["qui", "Qui"], ["sex", "Sex"], ["sab", "Sáb"], ["dom", "Dom"]];
const LEMBRETES: [string, string][] = [["lembrete_30d", "30 dias"], ["lembrete_15d", "15 dias"], ["lembrete_7d", "7 dias"], ["lembrete_3d", "3 dias"], ["lembrete_1d", "1 dia"], ["lembrete_dia", "No dia"], ["lembrete_apos", "Após vencer"]];

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">{pending ? "Salvando…" : "Salvar configuração"}</button>;
}

export function EvaniaConfigForm({ config }: { config: EvaniaConfig }) {
  const [state, formAction] = useFormState(salvarEvania, initial);
  const dias = new Set(config.dias.split(","));
  const canais = new Set(config.canais.split(","));

  return (
    <form action={formAction} className="grid gap-5">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="ativa" defaultChecked={config.ativa} /> Evania ativa
      </label>

      <fieldset className="grid gap-3 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm font-medium text-moss">Grupo Financeiro Oficial</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="grupo_nome" defaultValue={config.grupo_nome ?? ""} placeholder="Nome (ex.: Financeiro Helena & Guilherme)" className="field-input" />
          <input name="grupo_numero" defaultValue={config.grupo_numero ?? ""} placeholder="Número oficial (opcional)" className="field-input" />
        </div>
        <input name="grupo_link" defaultValue={config.grupo_link ?? ""} placeholder="Link do grupo do WhatsApp" className="field-input" />
        <input name="responsaveis" defaultValue={config.responsaveis ?? ""} placeholder="Responsáveis que recebem (ex.: Helena, Guilherme, Toninho)" className="field-input" />
      </fieldset>

      <fieldset className="grid gap-3 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm font-medium text-moss">Agenda automática</legend>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="field-label">Horário</label>
            <input name="horario" type="time" defaultValue={config.horario?.slice(0, 5) ?? "08:00"} className="field-input" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="field-label">Dias</span>
            <div className="flex flex-wrap gap-2">
              {DIAS.map(([k, l]) => (
                <label key={k} className="flex items-center gap-1 text-xs text-muted"><input type="checkbox" name={`dia_${k}`} defaultChecked={dias.has(k)} /> {l}</label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="field-label">Canais</span>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1 text-xs text-muted"><input type="checkbox" name="canal_painel" defaultChecked={canais.has("painel")} /> Painel</label>
              <label className="flex items-center gap-1 text-xs text-muted"><input type="checkbox" name="canal_whatsapp" defaultChecked={canais.has("whatsapp")} /> WhatsApp</label>
              <label className="flex items-center gap-1 text-xs text-muted"><input type="checkbox" name="canal_email" defaultChecked={canais.has("email")} /> E-mail</label>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-2 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm font-medium text-moss">Lembretes de vencimento</legend>
        <div className="flex flex-wrap gap-3">
          {LEMBRETES.map(([k, l]) => (
            <label key={k} className="flex items-center gap-1 text-xs text-muted">
              <input type="checkbox" name={k} defaultChecked={config[k as keyof EvaniaConfig] as boolean} /> {l}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
      <p className="text-xs text-muted">
        O <strong>envio automático</strong> por WhatsApp/e-mail e a leitura de comprovantes por IA
        dependem de um provedor externo ainda não conectado. Enquanto isso, a Evania monta a agenda e
        a mensagem pronta aqui no painel para você copiar e enviar.
      </p>
    </form>
  );
}
