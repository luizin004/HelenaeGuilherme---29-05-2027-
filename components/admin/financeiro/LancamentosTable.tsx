"use client";

import { useMemo, useState } from "react";
import { DespesaRow, ESTADO_BADGE, ESTADOS_LANCAMENTO, type DespesaEditavel } from "@/components/admin/DespesaRow";
import { Icon } from "@/components/admin/Icon";
import type { Option, InstallmentItem } from "@/lib/admin-data";

export interface LinhaLancamento {
  d: DespesaEditavel;
  classificacaoNome: string;
  classificacaoAtual: string | null;
  responsavelAtual: string | null;
  temParcelas: boolean;
  parcelas: InstallmentItem[];
}

export function LancamentosTable({
  linhas,
  classificacoes,
  responsaveis,
  metodos,
}: {
  linhas: LinhaLancamento[];
  classificacoes: Option[];
  responsaveis: Option[];
  metodos: Option[];
}) {
  const [busca, setBusca] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string | null>(null);

  const porBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return linhas;
    return linhas.filter((l) =>
      [l.d.descricao, l.classificacaoNome, l.d.categoria ?? ""].some((campo) =>
        campo.toLowerCase().includes(termo),
      ),
    );
  }, [linhas, busca]);

  const contagemPorEstado = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of porBusca) m.set(l.d.estado, (m.get(l.d.estado) ?? 0) + 1);
    return m;
  }, [porBusca]);

  const filtradas = useMemo(() => {
    if (!estadoFiltro) return porBusca;
    return porBusca.filter((l) => l.d.estado === estadoFiltro);
  }, [porBusca, estadoFiltro]);

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-line px-6 py-3">
        <div className="relative max-w-xs">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar item…"
            aria-label="Buscar lançamento"
            className="field-input py-1.5 pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEstadoFiltro(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide transition ${
              estadoFiltro === null ? "bg-moss text-cream" : "bg-cream text-muted hover:bg-ivory"
            }`}
          >
            Todos ({porBusca.length})
          </button>
          {ESTADOS_LANCAMENTO.map((estado) => (
            <button
              key={estado}
              type="button"
              onClick={() => setEstadoFiltro((atual) => (atual === estado ? null : estado))}
              className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide transition ${ESTADO_BADGE[estado]} ${
                estadoFiltro === estado ? "ring-2 ring-moss ring-offset-1" : "opacity-60 hover:opacity-100"
              }`}
            >
              {estado} ({contagemPorEstado.get(estado) ?? 0})
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["Descrição", "Classificação", "Estado", "Valor", "Classificar (classificação · responsável)", "Ações"].map((h) => (
                <th key={h} className="whitespace-nowrap bg-cream px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-moss">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted">
                  Faça login para visualizar os lançamentos (dados protegidos por RLS).
                </td>
              </tr>
            )}
            {linhas.length > 0 && filtradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted">
                  {busca
                    ? <>Nenhum item encontrado para &quot;{busca}&quot;{estadoFiltro ? ` em ${estadoFiltro}` : ""}.</>
                    : <>Nenhum item em {estadoFiltro}.</>}
                </td>
              </tr>
            )}
            {filtradas.map((l) => (
              <DespesaRow
                key={l.d.id}
                d={l.d}
                classificacaoNome={l.classificacaoNome}
                classificacoes={classificacoes}
                responsaveis={responsaveis}
                classificacaoAtual={l.classificacaoAtual}
                responsavelAtual={l.responsavelAtual}
                metodos={metodos}
                temParcelas={l.temParcelas}
                parcelas={l.parcelas}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
