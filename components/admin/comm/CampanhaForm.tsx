"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarCampanha, type ActionState } from "@/app/actions/comm";

const initial: ActionState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Criando…" : "Criar campanha e ver audiência"}
    </button>
  );
}

export function CampanhaForm({ jornadas }: { jornadas: { id: string; nome: string }[] }) {
  const [state, formAction] = useFormState(criarCampanha, initial);
  return (
    <form action={formAction} className="grid gap-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="field-label">Nome da campanha</label>
          <input name="nome" required className="field-input" placeholder="Ex.: Lembrete do RSVP — abril" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Jornada (opcional)</label>
          <select name="journey_id" className="field-input">
            <option value="">—</option>
            {jornadas.map((j) => <option key={j.id} value={j.id}>{j.nome}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Canal</label>
          <select name="canal" className="field-input">
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
            <option value="audio">Áudio</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Aprovação necessária</label>
          <select name="aprovacao_tipo" defaultValue="evania" className="field-input">
            <option value="nenhuma">Nenhuma</option>
            <option value="evania">Evania</option>
            <option value="um_noivo">Um dos noivos</option>
            <option value="dois_noivos">Os dois noivos</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>

      <fieldset className="grid gap-4 rounded-lg border border-line p-4 sm:grid-cols-3">
        <legend className="px-2 text-xs uppercase tracking-wide text-muted">Público</legend>
        <div className="flex flex-col gap-1">
          <label className="field-label">Lado</label>
          <select name="lado" className="field-input">
            <option value="">Todos</option>
            <option value="helena">Helena</option>
            <option value="guilherme">Guilherme</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">RSVP</label>
          <select name="status" className="field-input">
            <option value="">Qualquer</option>
            <option value="confirmado">Confirmados</option>
            <option value="pendente">Pendentes</option>
            <option value="recusado">Recusaram</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Telefone</label>
          <select name="telefone" className="field-input">
            <option value="">Qualquer</option>
            <option value="com">Com telefone</option>
            <option value="sem">Sem telefone</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="incluir_criancas" /> Incluir crianças</label>
        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="apenas_padrinhos" /> Apenas padrinhos</label>
        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="apenas_outra_cidade" /> Apenas de outra cidade</label>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label className="field-label">Mensagem modelo (opcional)</label>
        <textarea name="corpo_modelo" rows={3} className="field-input" placeholder="Use {{primeiro_nome}} para personalizar." />
      </div>

      <div className="flex items-center gap-3">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
