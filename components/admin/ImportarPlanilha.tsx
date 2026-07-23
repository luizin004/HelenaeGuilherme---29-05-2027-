"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  importarListaRapida,
  importarPlanilhaGrupos,
  type ImportPlanilhaState,
} from "@/app/actions/import-planilha";
import { parseListaRapida, previewPlanilha, type GrupoDraft } from "@/domain/convidados/importPlanilha";
import { KITS } from "@/domain/convites/caixas";

const initial: ImportPlanilhaState = { ok: false, message: "" };
const KIT_OPCOES = Object.values(KITS).map((k) => ({ id: k.id, label: k.label }));
const TIPO_OPCOES = ["familiar", "casal", "solo", "padrinhos", "personalizado"];

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

  // ————— Lista rápida
  const [textoR, setTextoR] = useState("");
  const [stateR, actionR] = useFormState(importarListaRapida, initial);
  const previaR = useMemo(() => parseListaRapida(textoR), [textoR]);

  // ————— Planilha com grupos (prévia editável)
  const [textoG, setTextoG] = useState("");
  const [grupos, setGrupos] = useState<GrupoDraft[] | null>(null);
  const [stateG, actionG] = useFormState(importarPlanilhaGrupos, initial);

  const processar = () => setGrupos(previewPlanilha(textoG).grupos);
  const atualizarMembro = (gi: number, mi: number, papel: string) =>
    setGrupos((gs) => gs && gs.map((g, i) => (i !== gi ? g : { ...g, membros: g.membros.map((m, j) => (j !== mi ? m : { ...m, papel: papel as GrupoDraft["membros"][number]["papel"] })) })));
  const removerMembro = (gi: number, mi: number) =>
    setGrupos((gs) => gs && gs.map((g, i) => (i !== gi ? g : { ...g, membros: g.membros.filter((_, j) => j !== mi) })).filter((g) => g.membros.length > 0));
  const atualizarGrupo = (gi: number, campo: "kit" | "tipo", valor: string) =>
    setGrupos((gs) => gs && gs.map((g, i) => (i !== gi ? g : { ...g, [campo]: valor })));

  const cont = useMemo(() => {
    const gs = grupos ?? [];
    const pessoas = gs.reduce((n, g) => n + g.membros.length, 0);
    const padrinhos = gs.reduce((n, g) => n + g.membros.filter((m) => m.papel !== "convidado").length, 0);
    return { pessoas, grupos: gs.length, padrinhos };
  }, [grupos]);

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
            Vá digitando <strong>um nome por linha</strong> — todo mundo que vier à cabeça. Marque criança com{" "}
            <code>(c)</code> e jovem com <code>(j)</code> no fim da linha; sem marca é adulto. Depois você vincula às
            famílias.
          </p>
          <textarea
            name="texto"
            value={textoR}
            onChange={(e) => setTextoR(e.target.value)}
            rows={10}
            placeholder={"Tia Elen\nÉrico\nLaís (c)\nSobrinho (j)\nMatheus"}
            className="field-input font-mono text-sm"
          />
          <div className="grid grid-cols-4 gap-3">
            <Contador label="Total" valor={previaR.total} />
            <Contador label="Adultos" valor={previaR.adultos} tom="text-olive" />
            <Contador label="Jovens" valor={previaR.jovens} tom="text-gold" />
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
            tabulação). Células mescladas: o rótulo fica só na 1ª pessoa e o resto entra junto. Clique em{" "}
            <strong>Processar</strong> para revisar — dá para ajustar <strong>padrinho/madrinha</strong> e o{" "}
            <strong>kit</strong> antes de importar.
          </p>
          <textarea
            name="texto"
            value={textoG}
            onChange={(e) => setTextoG(e.target.value)}
            rows={8}
            placeholder={"Elen\tTia Elen e família\nÉrico\nLaís\nAline\tCaixa padrinhos\nAlan"}
            className="field-input font-mono text-sm"
          />
          <input type="hidden" name="grupos_json" value={grupos ? JSON.stringify(grupos) : ""} />

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={processar} className="btn btn-outline text-sm">Processar / revisar</button>
            {grupos && (
              <div className="flex gap-3">
                <Contador label="Pessoas" valor={cont.pessoas} />
                <Contador label="Grupos" valor={cont.grupos} tom="text-olive" />
                <Contador label="Padrinhos" valor={cont.padrinhos} tom="text-wood" />
              </div>
            )}
          </div>

          {grupos && grupos.length > 0 && (
            <div className="max-h-96 overflow-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-cream">
                  <tr className="text-left text-xs uppercase tracking-wide text-moss">
                    <th className="px-3 py-2">Grupo (impressão)</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Kit</th>
                    <th className="px-3 py-2">Integrantes (papel)</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map((g, gi) => (
                    <tr key={gi} className="border-t border-line align-top">
                      <td className="px-3 py-2 font-medium text-moss">{g.nomeImpressao}</td>
                      <td className="px-3 py-2">
                        <select value={g.tipo} onChange={(e) => atualizarGrupo(gi, "tipo", e.target.value)} className="field-input py-1 text-xs">
                          {TIPO_OPCOES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={g.kit} onChange={(e) => atualizarGrupo(gi, "kit", e.target.value)} className="field-input py-1 text-xs">
                          {KIT_OPCOES.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="grid gap-1">
                          {g.membros.map((m, mi) => (
                            <div key={mi} className="flex items-center gap-2">
                              <span className="min-w-[7rem] truncate">{m.nome}</span>
                              <select value={m.papel} onChange={(e) => atualizarMembro(gi, mi, e.target.value)} className="field-input py-0.5 text-xs">
                                <option value="convidado">convidado</option>
                                <option value="padrinho">padrinho</option>
                                <option value="madrinha">madrinha</option>
                              </select>
                              <button type="button" onClick={() => removerMembro(gi, mi)} className="text-xs text-danger underline">remover</button>
                            </div>
                          ))}
                        </div>
                      </td>
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
