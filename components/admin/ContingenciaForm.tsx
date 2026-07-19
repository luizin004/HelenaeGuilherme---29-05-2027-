"use client";

import { useFormState, useFormStatus } from "react-dom";
import { salvarContingencia, type ContingenciaState } from "@/app/actions/contingencia";

const initial: ContingenciaState = { ok: false, message: "" };

export interface ContingenciaData {
  previsao: string | null;
  areas_cobertas: string | null;
  cobertura_adicional: string | null;
  gerador: boolean;
  drenagem: string | null;
  acesso_veiculos: string | null;
  protecao_equipamentos: string | null;
  mudanca_palco: string | null;
  responsavel: string | null;
  horario_limite: string | null;
  fornecedores: string | null;
  comunicado: string | null;
  status: string;
}

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">{pending ? "Salvando…" : "Salvar plano"}</button>;
}

function Campo({ name, label, val, area }: { name: string; label: string; val: string | null; area?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="field-label">{label}</label>
      {area ? (
        <textarea name={name} defaultValue={val ?? ""} rows={2} className="field-input" />
      ) : (
        <input name={name} defaultValue={val ?? ""} className="field-input" />
      )}
    </div>
  );
}

export function ContingenciaForm({ data }: { data: ContingenciaData }) {
  const [state, formAction] = useFormState(salvarContingencia, initial);
  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <Campo name="previsao" label="Previsão do tempo" val={data.previsao} />
      <div className="flex flex-col gap-1">
        <label className="field-label">Status do plano</label>
        <select name="status" defaultValue={data.status} className="field-input">
          <option value="planejando">Planejando</option>
          <option value="pronto">Pronto</option>
          <option value="ativado">Ativado</option>
        </select>
      </div>
      <Campo name="areas_cobertas" label="Áreas cobertas" val={data.areas_cobertas} area />
      <Campo name="cobertura_adicional" label="Cobertura adicional" val={data.cobertura_adicional} area />
      <Campo name="drenagem" label="Drenagem" val={data.drenagem} />
      <Campo name="acesso_veiculos" label="Acesso de veículos" val={data.acesso_veiculos} />
      <Campo name="protecao_equipamentos" label="Proteção de equipamentos" val={data.protecao_equipamentos} />
      <Campo name="mudanca_palco" label="Mudança de palco" val={data.mudanca_palco} />
      <Campo name="responsavel" label="Responsável pela decisão" val={data.responsavel} />
      <Campo name="horario_limite" label="Horário limite de decisão" val={data.horario_limite} />
      <Campo name="fornecedores" label="Fornecedores envolvidos" val={data.fornecedores} />
      <Campo name="comunicado" label="Comunicado aos convidados" val={data.comunicado} area />
      <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
        <input type="checkbox" name="gerador" defaultChecked={data.gerador} /> Gerador disponível
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <Submit />
        {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
