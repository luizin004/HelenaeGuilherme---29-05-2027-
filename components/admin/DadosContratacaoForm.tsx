"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { salvarDadosContratacao, type ContratacaoState } from "@/app/actions/contratacao";
import type { DadosContratacao } from "@/lib/admin-data";

const initial: ContratacaoState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar dados"}
    </button>
  );
}

function Campo({
  name,
  label,
  defaultValue,
  placeholder,
  className = "",
}: {
  name: string;
  label: string;
  defaultValue: string | null;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={`dc-${name}`} className="field-label">{label}</label>
      <input
        id={`dc-${name}`}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="field-input"
      />
    </div>
  );
}

/**
 * Cadastro único dos dados que aparecem em toda autorização de contratação:
 * quem contrata (os noivos) e para quem o fornecedor emite a nota fiscal.
 */
export function DadosContratacaoForm({ d, preenchido }: { d: DadosContratacao; preenchido: boolean }) {
  const [aberto, setAberto] = useState(!preenchido);
  const [state, formAction] = useFormState(salvarDadosContratacao, initial);

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setAberto((v) => !v)} className="text-sm text-olive underline">
          {aberto ? "fechar" : preenchido ? "editar dados" : "preencher dados"}
        </button>
        {!preenchido && (
          <span className="text-xs text-danger">
            Preencha para que as autorizações saiam completas.
          </span>
        )}
      </div>

      {aberto && (
        <form action={formAction} className="grid gap-6">
          <fieldset className="grid gap-4 md:grid-cols-2">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Contratantes (quem assina)
            </legend>
            <Campo name="contratante_nome" label="Nome completo (1º contratante)" defaultValue={d.contratante_nome} />
            <Campo name="contratante_documento" label="CPF" defaultValue={d.contratante_documento} placeholder="000.000.000-00" />
            <Campo name="contratante_rg" label="RG (opcional)" defaultValue={d.contratante_rg} />
            <Campo name="contratante_telefone" label="Telefone" defaultValue={d.contratante_telefone} />
            <Campo name="contratante_email" label="E-mail" defaultValue={d.contratante_email} className="md:col-span-2" />
            <Campo name="contratante2_nome" label="Nome completo (2º contratante)" defaultValue={d.contratante2_nome} />
            <Campo name="contratante2_documento" label="CPF do 2º contratante" defaultValue={d.contratante2_documento} />
          </fieldset>

          <fieldset className="grid gap-4 md:grid-cols-4">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Endereço</legend>
            <Campo name="endereco" label="Logradouro, nº e bairro" defaultValue={d.endereco} className="md:col-span-2" />
            <Campo name="cidade" label="Cidade" defaultValue={d.cidade} />
            <Campo name="uf" label="UF" defaultValue={d.uf} placeholder="MG" />
            <Campo name="cep" label="CEP" defaultValue={d.cep} placeholder="00000-000" />
          </fieldset>

          <fieldset className="grid gap-4 md:grid-cols-2">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Dados para emissão da nota fiscal
            </legend>
            <Campo
              name="nf_destinatario"
              label="Destinatário (nome ou razão social)"
              defaultValue={d.nf_destinatario}
              placeholder="Deixe vazio para usar o 1º contratante"
            />
            <Campo name="nf_documento" label="CPF / CNPJ do destinatário" defaultValue={d.nf_documento} />
            <Campo name="nf_ie" label="Inscrição estadual (se houver)" defaultValue={d.nf_ie} />
            <Campo name="nf_im" label="Inscrição municipal (se houver)" defaultValue={d.nf_im} />
            <Campo
              name="nf_endereco"
              label="Endereço de faturamento"
              defaultValue={d.nf_endereco}
              placeholder="Deixe vazio para usar o endereço acima"
              className="md:col-span-2"
            />
            <Campo name="nf_email" label="E-mail para envio da NF" defaultValue={d.nf_email} className="md:col-span-2" />
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="dc-nf_observacoes" className="field-label">Observações de faturamento (opcional)</label>
              <textarea
                id="dc-nf_observacoes"
                name="nf_observacoes"
                defaultValue={d.nf_observacoes ?? ""}
                rows={2}
                placeholder="Ex.: emitir NF somente após a confirmação do pagamento da parcela."
                className="field-input"
              />
            </div>
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Condições gerais (texto repetido em toda autorização)
            </legend>
            <textarea
              name="condicoes_gerais"
              defaultValue={d.condicoes_gerais ?? ""}
              rows={4}
              placeholder="Ex.: A execução dos serviços fica condicionada à assinatura do contrato pelas duas partes. Qualquer alteração de escopo ou valor deve ser aprovada previamente por escrito."
              className="field-input"
            />
          </fieldset>

          <div className="flex items-center gap-3">
            <Submit />
            {state.message && (
              <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
