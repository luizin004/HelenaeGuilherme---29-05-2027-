"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  importarListaRapida,
  importarPlanilhaGrupos,
  type ImportPlanilhaState,
} from "@/app/actions/import-planilha";
import { parseListaRapida, previewPlanilha } from "@/domain/convidados/importPlanilha";

const initial: ImportPlanilhaState = { ok: false, message: "" };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark text-sm disabled:opacity-60">
      {pending ? "Importando…" : label}
    </button>
  );
}

function Contador({ label, valor, tom }: { label: string; valor: number; tom?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-4 py-2 text-center">
      <div className={`font-serif text-2xl ${tom ?? "text-moss"}`}>{valor}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

export function ImportarPlanilha() {
  const [modo, setModo] = useState<"rapida" | "grupos">("rapida");

  const [textoR, setTextoR] = useState("");
  const [stateR, actionR] = useFormState(importarListaRapida, initial);
  const previaR = useMemo(() => parseListaRapida(textoR), [textoR]);

  const [textoG, setTextoG] = useState("");
  const [stateG, actionG] = useFormState(importarPlanilhaGrupos, initial);
  const previaG = useMemo(() => previewPlanilha(textoG), [textoG]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {[
          { k: "rapida", label: "Lista rápida" },
          { k: "grupos", label: "Planilha com grupos" },
        ].map((t) => (
          <button
            key={t.k}
            type="button"
            role="tab"
            aria-selected={modo === t.k}
            onClick={() => setModo(t.k as "rapida" | "grupos")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wide transition ${
              modo === t.k ? "bg-moss text-white" : "bg-white text-muted shadow-card hover:text-moss"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {modo === "rapida" ? (
        <form action={actionR} className="grid gap-3">
          <p className="text-sm text-muted">
            Vá digitando <strong>um nome por linha</strong> — todo mundo que vier à cabeça. Para marcar criança,
            termine a linha com <code>(c)</code> ou <code>(criança)</code>. Depois você vincula às famílias.
          </p>
          <textarea
            name="texto"
            value={textoR}
            onChange={(e) => setTextoR(e.target.value)}
            rows={10}
            placeholder={"Tia Elen\nÉrico\nLaís (c)\nMatheus"}
            className="field-input font-mono text-sm"
          />
          <div className="grid grid-cols-3 gap-3">
            <Contador label="Total" valor={previaR.total} />
            <Contador label="Adultos" valor={previaR.adultos} tom="text-olive" />
            <Contador label="Crianças" valor={previaR.criancas} tom="text-wood" />
          </div>
          <div className="flex items-center gap-3">
            <Submit label="Adicionar à lista" />
            {stateR.message && <span className={`text-xs ${stateR.ok ? "text-olive" : "text-danger"}`}>{stateR.message}</span>}
          </div>
        </form>
      ) : (
        <form action={actionG} className="grid gap-3">
          <p className="text-sm text-muted">
            Cole da sua planilha: <strong>nome</strong> e o <strong>rótulo do convite</strong> por linha (separados por
            tabulação). Em células mescladas, o rótulo fica só na 1ª pessoa do grupo — o resto entra junto
            automaticamente. Ex.: <code>Caixa padrinhos</code> com 2 pessoas vira <strong>sugestão de casal</strong>.
          </p>
          <textarea
            name="texto"
            value={textoG}
            onChange={(e) => setTextoG(e.target.value)}
            rows={10}
            placeholder={"Elen\tTia Elen e família\nÉrico\nLaís\nAline\tCaixa padrinhos\nAlan"}
            className="field-input font-mono text-sm"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Contador label="Pessoas" valor={previaG.totalPessoas} />
            <Contador label="Grupos" valor={previaG.totalGrupos} tom="text-olive" />
            <Contador label="Padrinhos" valor={previaG.totalPadrinhos} tom="text-wood" />
            <Contador label="Casais sugeridos" valor={previaG.casaisSugeridos} tom="text-success" />
          </div>

          {previaG.grupos.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-cream">
                  <tr className="text-left text-xs uppercase tracking-wide text-moss">
                    <th className="px-3 py-2">Grupo (impressão)</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Integrantes</th>
                  </tr>
                </thead>
                <tbody>
                  {previaG.grupos.map((g, i) => (
                    <tr key={i} className="border-t border-line align-top">
                      <td className="px-3 py-1.5 font-medium text-moss">{g.nomeImpressao}</td>
                      <td className="px-3 py-1.5 text-xs">
                        <span className="text-muted">{g.tipo}</span>
                        {g.sugestaoCasal && <span className="ml-1 rounded bg-[#e6efe0] px-1.5 text-[10px] uppercase text-success">casal?</span>}
                        {g.ambiguo && <span className="ml-1 rounded bg-[#f6ecd6] px-1.5 text-[10px] uppercase text-warn">revisar</span>}
                      </td>
                      <td className="px-3 py-1.5 text-muted">{g.membros.map((m) => m.nome).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Submit label="Importar planilha" />
            {stateG.message && <span className={`text-xs ${stateG.ok ? "text-olive" : "text-danger"}`}>{stateG.message}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
