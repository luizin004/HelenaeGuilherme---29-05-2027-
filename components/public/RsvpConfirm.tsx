"use client";

import { useFormState, useFormStatus } from "react-dom";
import { confirmarPresencaGrupo, type RsvpState } from "@/app/actions/rsvp";

const initial: RsvpState = { ok: false, message: "" };

export interface GrupoIntegrante {
  id: string;
  nome: string;
  status: string;
  eh_crianca: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-dark disabled:opacity-60" disabled={pending}>
      {pending ? "Enviando…" : "Confirmar"}
    </button>
  );
}

/**
 * Formulário de RSVP para o GRUPO do convite (regra 35).
 * Mostra cada integrante (adultos e crianças) e coleta a resposta individual.
 * Integrantes já respondidos aparecem como somente-leitura, mas o grupo
 * inteiro pode ser reconfirmado até o prazo.
 */
export function RsvpConfirm({
  token,
  integrantes,
}: {
  token: string;
  integrantes: GrupoIntegrante[];
}) {
  const [state, formAction] = useFormState(confirmarPresencaGrupo, initial);

  if (state.message) {
    return (
      <p className={`text-center font-serif text-2xl ${state.ok ? "text-olive" : "text-danger"}`}>
        {state.message}
      </p>
    );
  }

  const grupo = integrantes.length > 1;

  return (
    <form action={formAction} className="grid gap-5 text-left">
      <input type="hidden" name="token" value={token} />
      <p className="text-center text-muted">
        {grupo
          ? "Este convite inclui os convidados abaixo. Confirme a presença de cada um:"
          : "Confirme sua presença:"}
      </p>

      <div className="grid gap-4">
        {integrantes.map((g) => {
          const defaultSim = g.status === "confirmado";
          const defaultNao = g.status === "recusado";
          return (
            <fieldset key={g.id} className="rounded-lg border border-sand/70 p-3">
              <legend className="px-1 font-serif text-lg text-moss">
                {g.nome}
                {g.eh_crianca ? <span className="ml-2 text-xs uppercase tracking-wide text-olive">criança</span> : null}
              </legend>
              <div className="mt-1 flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-base text-muted">
                  <input
                    type="radio"
                    name={`presenca_${g.id}`}
                    value="sim"
                    defaultChecked={defaultSim}
                    required
                  />{" "}
                  Presente
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-base text-muted">
                  <input
                    type="radio"
                    name={`presenca_${g.id}`}
                    value="nao"
                    defaultChecked={defaultNao}
                  />{" "}
                  Não poderá
                </label>
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="transporte" className="field-label">Como vão ao casamento? (opcional)</label>
        <select id="transporte" name="transporte" className="field-input" defaultValue="">
          <option value="">Prefiro não informar</option>
          <option value="carro">Iremos de carro</option>
          <option value="com_outra_pessoa">Iremos com outra pessoa</option>
          <option value="oferece_vagas">Podemos oferecer carona</option>
          <option value="precisa_carona">Precisamos de carona</option>
          <option value="contratado">Usaremos transporte contratado</option>
          <option value="nao_definiu">Ainda não definimos</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="mensagem" className="field-label">Mensagem para os noivos (opcional)</label>
        <textarea id="mensagem" name="mensagem" rows={3} placeholder="Deixe um recado carinhoso" className="field-input" />
      </div>
      <SubmitButton />
    </form>
  );
}
