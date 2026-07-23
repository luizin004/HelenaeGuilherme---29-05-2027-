"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { atualizarConvidado, excluirConvidado, regenerarQr, type GuestFormState } from "@/app/actions/guests";
import { PAPEIS } from "@/domain/convites/caixas";

const initial: GuestFormState = { ok: false, message: "" };

export interface ConvidadoEditavel {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  mesa: string | null;
  group_id: string | null;
  papel: string | null;
  faixa_etaria: string | null;
  eh_crianca: boolean;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

export function ConvidadoActions({ g, grupos }: { g: ConvidadoEditavel; grupos: { id: string; nome: string }[] }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarConvidado, initial);

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">
          {aberto ? "fechar" : "editar"}
        </button>
        <form action={regenerarQr} onSubmit={(e) => { if (!confirm(`Gerar um novo QR para ${g.nome}? O anterior deixa de valer.`)) e.preventDefault(); }}>
          <input type="hidden" name="id" value={g.id} />
          <button type="submit" className="text-xs text-muted underline">novo QR</button>
        </form>
        <form
          action={excluirConvidado}
          onSubmit={(e) => {
            if (!confirm(`Excluir ${g.nome} da lista? (exclusão lógica, reversível no banco)`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={g.id} />
          <button type="submit" className="text-xs text-danger underline">excluir</button>
        </form>
      </div>

      {aberto && (
        <form action={formAction} className="mt-3 grid gap-2 rounded-lg border border-line bg-ivory p-3 text-left">
          <input type="hidden" name="id" value={g.id} />
          <input name="nome" defaultValue={g.nome} placeholder="Nome" required className="field-input py-1.5 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input name="email" defaultValue={g.email ?? ""} placeholder="E-mail" className="field-input py-1.5 text-sm" />
            <input name="telefone" defaultValue={g.telefone ?? ""} placeholder="Telefone" className="field-input py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 items-center gap-2">
            <input name="mesa" defaultValue={g.mesa ?? ""} placeholder="Mesa" className="field-input py-1.5 text-sm" />
            <select name="faixa_etaria" defaultValue={g.faixa_etaria ?? (g.eh_crianca ? "crianca" : "adulto")} className="field-input py-1.5 text-sm">
              <option value="adulto">Adulto</option>
              <option value="jovem">Jovem</option>
              <option value="crianca">Criança</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select name="papel" defaultValue={g.papel ?? "convidado"} className="field-input py-1.5 text-sm">
              {PAPEIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select name="group_id" defaultValue={g.group_id ?? ""} className="field-input py-1.5 text-sm">
              <option value="">Sem grupo</option>
              {grupos.map((gr) => <option key={gr.id} value={gr.id}>{gr.nome}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <SaveButton />
            {state.message && (
              <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
