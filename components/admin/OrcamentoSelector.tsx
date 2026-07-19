"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { gerarDespesasDoOrcamento, type OrcamentoState } from "@/app/actions/orcamento";
import { CATALOGO } from "@/domain/orcamento/catalogo";

const initial: OrcamentoState = { ok: false, message: "" };

function Submit({ n }: { n: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || n === 0} className="btn btn-dark disabled:opacity-50">
      {pending ? "Adicionando…" : `Adicionar ${n} item(ns) ao financeiro`}
    </button>
  );
}

/**
 * Assistente de orçamento: o casal marca o que quer no casamento e cada item
 * vira uma despesa "prevista / a definir" no Financeiro. Itens que já estão no
 * financeiro aparecem marcados e travados (não duplicam).
 */
export function OrcamentoSelector({ jaNoFinanceiro }: { jaNoFinanceiro: string[] }) {
  const [state, formAction] = useFormState(gerarDespesasDoOrcamento, initial);
  const existentes = useMemo(
    () => new Set(jaNoFinanceiro.map((s) => s.trim().toLowerCase())),
    [jaNoFinanceiro],
  );
  const [marcados, setMarcados] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setMarcados((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function marcarGrupo(itens: { key: string; existe: boolean }[], on: boolean) {
    setMarcados((prev) => {
      const next = new Set(prev);
      for (const it of itens) {
        if (it.existe) continue;
        if (on) next.add(it.key);
        else next.delete(it.key);
      }
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-3 border-b border-line bg-ivory/95 px-6 py-3 backdrop-blur">
        <p className="text-sm text-muted">
          <strong className="text-moss">{marcados.size}</strong> selecionado(s) para cotar
        </p>
        <Submit n={marcados.size} />
      </div>
      {state.message && (
        <p className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</p>
      )}

      {CATALOGO.map((grupo) => {
        const itens = grupo.itens.map((i) => {
          const key = `${grupo.categoria}|||${i.nome}`;
          return { ...i, key, existe: existentes.has(i.nome.trim().toLowerCase()) };
        });
        const selecionaveis = itens.filter((i) => !i.existe);
        return (
          <section key={grupo.categoria} className="overflow-hidden rounded-lg bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h3 className="font-serif text-lg text-moss">
                <span className="mr-2">{grupo.icone}</span>
                {grupo.categoria}
              </h3>
              {selecionaveis.length > 0 && (
                <div className="flex gap-3 text-xs">
                  <button type="button" onClick={() => marcarGrupo(itens, true)} className="text-olive underline">
                    marcar todos
                  </button>
                  <button type="button" onClick={() => marcarGrupo(itens, false)} className="text-muted underline">
                    limpar
                  </button>
                </div>
              )}
            </div>
            <div className="grid gap-1 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {itens.map((i) => (
                <label
                  key={i.key}
                  className={`flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm ${
                    i.existe ? "cursor-default text-muted" : "hover:bg-ivory"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="item"
                    value={i.key}
                    checked={i.existe || marcados.has(i.key)}
                    disabled={i.existe}
                    onChange={() => toggle(i.key)}
                  />
                  <span className={i.existe ? "line-through" : ""}>{i.nome}</span>
                  {i.essencial && !i.existe && (
                    <span className="rounded-full bg-gold-soft px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-moss">
                      essencial
                    </span>
                  )}
                  {i.existe && <span className="text-[10px] uppercase tracking-wide text-olive">no financeiro</span>}
                </label>
              ))}
            </div>
          </section>
        );
      })}

      <div className="flex justify-end">
        <Submit n={marcados.size} />
      </div>
    </form>
  );
}
