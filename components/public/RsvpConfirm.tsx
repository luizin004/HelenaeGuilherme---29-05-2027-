"use client";

import { useState } from "react";
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

  // Espaço infantil: o próprio convidado declara quem vai usar e quem é o
  // responsável pela criança na festa. Pré-preenche com as crianças do convite.
  const criancasDoConvite = integrantes.filter((i) => i.eh_crianca).map((i) => i.nome);
  const [usaEspaco, setUsaEspaco] = useState(false);
  const [linhas, setLinhas] = useState<string[]>(() =>
    criancasDoConvite.length > 0 ? criancasDoConvite : [""],
  );

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
              <input
                name={`restricao_${g.id}`}
                placeholder="Restrição alimentar / alergia (opcional)"
                className="field-input mt-2 py-1.5 text-sm"
              />
            </fieldset>
          );
        })}
      </div>

      <fieldset className="rounded-lg border border-sand/70 p-3">
        <legend className="px-1 font-serif text-lg text-moss">Espaço infantil</legend>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="espaco_infantil"
            className="mt-1"
            checked={usaEspaco}
            onChange={(e) => setUsaEspaco(e.target.checked)}
          />
          <span>
            Vamos usar o <strong className="text-moss">espaço infantil</strong> (acompanhado por monitores).
            Informe abaixo cada criança e o responsável por ela na festa.
          </span>
        </label>

        {usaEspaco && (
          <div className="mt-3 grid gap-3">
            {linhas.map((nomeInicial, i) => (
              <div key={i} className="grid gap-2 rounded-md bg-ivory p-2.5 sm:grid-cols-2">
                <input
                  name="crianca_nome"
                  defaultValue={nomeInicial}
                  required
                  placeholder="Nome da criança"
                  className="field-input py-1.5 text-sm"
                  aria-label={`Nome da criança ${i + 1}`}
                />
                <input
                  name="crianca_idade"
                  type="number"
                  min={0}
                  max={17}
                  placeholder="Idade (opcional)"
                  className="field-input py-1.5 text-sm"
                  aria-label={`Idade da criança ${i + 1}`}
                />
                <input
                  name="crianca_responsavel"
                  required
                  placeholder="Responsável pela criança na festa"
                  className="field-input py-1.5 text-sm"
                  aria-label={`Responsável pela criança ${i + 1}`}
                />
                <input
                  name="crianca_obs"
                  placeholder="Alergias / cuidados (opcional)"
                  className="field-input py-1.5 text-sm"
                  aria-label={`Cuidados da criança ${i + 1}`}
                />
                {linhas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}
                    className="justify-self-start text-xs text-danger underline sm:col-span-2"
                  >
                    remover criança
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLinhas((ls) => [...ls, ""])}
              className="justify-self-start text-sm text-olive underline"
            >
              + adicionar criança
            </button>
            <span className="text-xs text-muted">
              Cada criança informada aqui entra na lista do espaço infantil para os monitores.
            </span>
          </div>
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="instagram" className="field-label">Seu Instagram (opcional)</label>
        <input id="instagram" name="instagram" placeholder="@seuinstagram" className="field-input" />
        <span className="text-xs text-muted">Guardamos para algumas surpresas e interações na preparação do casamento. 💛</span>
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
