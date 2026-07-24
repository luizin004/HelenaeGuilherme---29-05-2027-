"use client";

import { useFormState, useFormStatus } from "react-dom";
import { enviarLead, type LeadState } from "@/app/actions/leads";
import { waLink, EVENTO_OPCOES } from "@/lib/rancho";

const initial: LeadState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Enviando…" : "Enviar contato"}
    </button>
  );
}

/** Monta a mensagem de WhatsApp com o que já foi preenchido no formulário. */
function montarWa(form: HTMLFormElement): string {
  const g = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value?.trim() ?? "";
  const linhas = [
    "Olá! Conheci o Rancho das Águas pelo site e gostaria de solicitar um orçamento.",
    "",
    `Nome: ${g("nome")}`,
    `Tipo de evento: ${g("tipo_evento")}`,
    `Data prevista: ${g("data_prevista")}`,
    `Convidados (aprox.): ${g("convidados_aprox")}`,
    g("mensagem") ? `Mensagem: ${g("mensagem")}` : "",
  ].filter(Boolean);
  return linhas.join("\n");
}

export function RanchoLeadForm() {
  const [state, formAction] = useFormState(enviarLead, initial);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="l-nome" className="field-label">Nome</label>
        <input id="l-nome" name="nome" required placeholder="Seu nome" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="l-tel" className="field-label">Telefone / WhatsApp</label>
        <input id="l-tel" name="telefone" type="tel" inputMode="tel" placeholder="(00) 90000-0000" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="l-email" className="field-label">E-mail (opcional)</label>
        <input id="l-email" name="email" type="email" placeholder="voce@email.com" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="l-tipo" className="field-label">Tipo de evento</label>
        <select id="l-tipo" name="tipo_evento" defaultValue="" className="field-input">
          <option value="">Selecione…</option>
          {EVENTO_OPCOES.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="l-data" className="field-label">Data prevista</label>
        <input id="l-data" name="data_prevista" placeholder="Ex.: outubro/2026" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="l-conv" className="field-label">Convidados (aprox.)</label>
        <input id="l-conv" name="convidados_aprox" inputMode="numeric" placeholder="Ex.: 120" className="field-input" />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
        <input type="checkbox" name="deseja_visita" /> Quero agendar uma visita ao espaço
      </label>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="l-msg" className="field-label">Mensagem (opcional)</label>
        <textarea id="l-msg" name="mensagem" rows={3} placeholder="Conte um pouco sobre o seu evento" className="field-input" />
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Submit />
        <button
          type="button"
          onClick={(e) => {
            const form = e.currentTarget.closest("form") as HTMLFormElement;
            window.open(waLink(montarWa(form)), "_blank", "noopener,noreferrer");
          }}
          className="btn btn-outline"
        >
          Enviar pelo WhatsApp
        </button>
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
