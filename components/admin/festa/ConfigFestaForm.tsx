"use client";

import { useFormState, useFormStatus } from "react-dom";
import { salvarConfigFesta, type FestaState } from "@/app/actions/festa";
import { linkWhatsapp } from "@/domain/festa/album";
import type { FestaConfig } from "@/lib/festa-data";

const initial: FestaState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar configuração"}
    </button>
  );
}

/**
 * Configuração da aba pública. O botão de WhatsApp do site só existe quando
 * há um número aqui — enquanto estiver vazio, a alternativa some da página em
 * vez de apontar para um link inventado.
 */
export function ConfigFestaForm({ config }: { config: FestaConfig }) {
  const [state, formAction] = useFormState(salvarConfigFesta, initial);
  const linkAtual = linkWhatsapp(config.whatsapp_numero, config.whatsapp_mensagem);

  return (
    <form action={formAction} className="grid gap-4 p-6">
      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-ivory p-3 text-sm text-muted">
        <input type="checkbox" name="aberto" defaultChecked={config.aberto} className="mt-1" />
        <span>
          <strong className="text-moss">Aceitar envios</strong> — desmarque depois que o álbum estiver completo. A
          galeria continua no ar; só o formulário sai.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="cf-numero" className="field-label">
            WhatsApp para receber fotos
          </label>
          <input
            id="cf-numero"
            name="whatsapp_numero"
            defaultValue={config.whatsapp_numero ?? ""}
            placeholder="5531999999999"
            className="field-input"
          />
          <span className="text-xs text-muted">
            DDI + DDD + número, só dígitos.{" "}
            {linkAtual ? (
              <a href={linkAtual} target="_blank" rel="noopener noreferrer" className="text-olive underline">
                testar o link
              </a>
            ) : (
              <strong className="text-warn">pendente — o botão não aparece no site enquanto estiver vazio.</strong>
            )}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="cf-msg" className="field-label">
            Mensagem que já vem escrita
          </label>
          <input
            id="cf-msg"
            name="whatsapp_mensagem"
            defaultValue={config.whatsapp_mensagem ?? ""}
            className="field-input"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cf-chamada" className="field-label">
          Chamada do topo da página
        </label>
        <textarea id="cf-chamada" name="chamada" rows={2} defaultValue={config.chamada ?? ""} className="field-input" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cf-agradec" className="field-label">
          Agradecimento depois do envio
        </label>
        <textarea
          id="cf-agradec"
          name="agradecimento"
          rows={2}
          defaultValue={config.agradecimento ?? ""}
          className="field-input"
        />
        <span className="text-xs text-muted">Em branco, o site usa um agradecimento com o primeiro nome de quem enviou.</span>
      </div>

      {state.message && (
        <p className={`text-sm ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</p>
      )}
      <div>
        <Submit />
      </div>
    </form>
  );
}
