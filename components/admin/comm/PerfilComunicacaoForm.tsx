"use client";

import { useFormState, useFormStatus } from "react-dom";
import { salvarPerfilComunicacao, type ActionState } from "@/app/actions/comm";
import type { GuestCommProfile } from "@/lib/comm-data";

const initial: ActionState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar perfil"}
    </button>
  );
}

function Txt({ name, label, def, ph }: { name: string; label: string; def?: string | null; ph?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="field-label">{label}</label>
      <input name={name} defaultValue={def ?? ""} placeholder={ph} className="field-input" />
    </div>
  );
}

function Chk({ name, label, def }: { name: string; label: string; def?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <input type="checkbox" name={name} defaultChecked={def ?? false} /> {label}
    </label>
  );
}

export function PerfilComunicacaoForm({ guestId, perfil }: { guestId: string; perfil: GuestCommProfile | null }) {
  const [state, formAction] = useFormState(salvarPerfilComunicacao, initial);
  return (
    <form action={formAction} className="grid gap-6 p-6">
      <input type="hidden" name="guest_id" value={guestId} />

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-xs uppercase tracking-wide text-muted">Identificação e relação</legend>
        <Txt name="nome_preferido" label="Nome preferido" def={perfil?.nome_preferido} />
        <Txt name="apelido_autorizado" label="Apelido autorizado" def={perfil?.apelido_autorizado} ph="só se for autorizado" />
        <Txt name="parentesco" label="Parentesco" def={perfil?.parentesco} />
        <Txt name="proximidade" label="Proximidade" def={perfil?.proximidade} ph="muito próximo, próximo…" />
        <Txt name="relacao_helena" label="Relação com Helena" def={perfil?.relacao_helena} />
        <Txt name="relacao_guilherme" label="Relação com Guilherme" def={perfil?.relacao_guilherme} />
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="field-label">História autorizada</label>
          <textarea name="historia_autorizada" defaultValue={perfil?.historia_autorizada ?? ""} rows={2} className="field-input" placeholder="Só o que a pessoa autorizou mencionar" />
        </div>
        <Txt name="assuntos_permitidos" label="Assuntos permitidos" def={perfil?.assuntos_permitidos} />
        <Txt name="assuntos_proibidos" label="Assuntos proibidos" def={perfil?.assuntos_proibidos} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-1 text-xs uppercase tracking-wide text-muted">Comunicação</legend>
        <Txt name="tom" label="Tom" def={perfil?.tom} ph="afetuoso, elegante…" />
        <Txt name="formalidade" label="Formalidade" def={perfil?.formalidade} ph="você, senhor…" />
        <Txt name="tratamento" label="Tratamento" def={perfil?.tratamento} />
        <Txt name="canal_preferido" label="Canal preferido" def={perfil?.canal_preferido} ph="whatsapp, email, áudio" />
        <Txt name="cidade_partida" label="Cidade de partida" def={perfil?.cidade_partida} />
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-1 text-xs uppercase tracking-wide text-muted">Consentimento</legend>
        <Chk name="aceita_whatsapp" label="Aceita WhatsApp" def={perfil ? perfil.aceita_whatsapp : true} />
        <Chk name="aceita_email" label="Aceita e-mail" def={perfil ? perfil.aceita_email : true} />
        <Chk name="aceita_audio" label="Aceita áudio" def={perfil ? perfil.aceita_audio : true} />
        <Chk name="aceita_lembretes" label="Aceita lembretes opcionais" def={perfil ? perfil.aceita_lembretes : true} />
        <Chk name="precisa_hospedagem" label="Precisa de hospedagem" def={perfil?.precisa_hospedagem ?? false} />
        <Chk name="herdar_familia" label="Herdar contexto da família" def={perfil ? perfil.herdar_familia : true} />
        <Chk name="opt_out" label="Não enviar (opt-out)" def={perfil?.opt_out ?? false} />
      </fieldset>

      <div className="flex flex-col gap-1">
        <label className="field-label">Observação</label>
        <textarea name="observacao" defaultValue={perfil?.observacao ?? ""} rows={2} className="field-input" />
      </div>

      <div className="flex items-center gap-3">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
