"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { atualizarDespesa, excluirDespesa, type ExpenseFormState } from "@/app/actions/expenses";
import { atualizarVencimentoParcela } from "@/app/actions/installments";
import { ClassificarDespesa } from "@/components/admin/ClassificarDespesa";
import { GerarParcelas } from "@/components/admin/GerarParcelas";
import { CATEGORIAS } from "@/domain/orcamento/catalogo";
import { formatCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import type { Option, InstallmentItem } from "@/lib/admin-data";
import { MoneyInput } from "@/components/admin/MoneyInput";

const initial: ExpenseFormState = { ok: false, message: "" };

export const ESTADO_BADGE: Record<string, string> = {
  previsto: "bg-[#f6ecd6] text-warn",
  orcado: "bg-[#eef1e6] text-olive",
  contratado: "bg-[#e6efe0] text-success",
  pago: "bg-[#e6efe0] text-success",
  gratuito: "bg-gold-soft text-moss",
};

export const ESTADOS_LANCAMENTO = Object.keys(ESTADO_BADGE);

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

export interface DespesaEditavel {
  id: string;
  descricao: string;
  estado: string;
  gratuito: boolean;
  valor_total_cents: number | null;
  observacao: string | null;
  categoria: string | null;
  exige_nota_fiscal: boolean;
  prazo_contratacao: string | null;
}

/**
 * Uma linha de Lançamentos: dados + classificar + editar/excluir. Quando aberta,
 * a edição vira uma linha própria de largura total (em vez de espremer o
 * formulário na coluna estreita de Ações) e já traz, no mesmo lugar, a
 * condição de pagamento — 1º vencimento e a data de cada parcela seguinte —
 * porque é exatamente aqui que se decide o custo.
 */
export function DespesaRow({
  d,
  classificacaoNome,
  classificacoes,
  responsaveis,
  classificacaoAtual,
  responsavelAtual,
  metodos,
  temParcelas,
  parcelas,
}: {
  d: DespesaEditavel;
  classificacaoNome: string;
  classificacoes: Option[];
  responsaveis: Option[];
  classificacaoAtual: string | null;
  responsavelAtual: string | null;
  metodos: Option[];
  temParcelas: boolean;
  parcelas: InstallmentItem[];
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(atualizarDespesa, initial);

  return (
    <>
      <tr className="border-t border-line align-top hover:bg-ivory">
        <td className="px-6 py-3 font-medium">{d.descricao}</td>
        <td className="px-6 py-3 text-xs text-muted">{classificacaoNome}</td>
        <td className="px-6 py-3">
          <span className={`inline-block rounded-full px-3 py-0.5 text-xs uppercase tracking-wide ${ESTADO_BADGE[d.estado] ?? "bg-cream text-muted"}`}>
            {d.estado}
          </span>
        </td>
        <td className="whitespace-nowrap px-6 py-3 font-serif text-base text-moss">
          {d.gratuito ? "Gratuito" : d.valor_total_cents === null ? "— a definir" : formatCents(d.valor_total_cents)}
        </td>
        <td className="px-6 py-3" title={d.observacao ?? ""}>
          <ClassificarDespesa
            expenseId={d.id}
            classificacoes={classificacoes}
            responsaveis={responsaveis}
            classificacaoAtual={classificacaoAtual}
            responsavelAtual={responsavelAtual}
          />
        </td>
        <td className="px-6 py-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setAberto((v) => !v)} className="text-xs text-olive underline">
              {aberto ? "fechar" : "editar"}
            </button>
            <form
              action={excluirDespesa}
              onSubmit={(e) => {
                if (!confirm(`Excluir a despesa "${d.descricao}"? (exclusão lógica)`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={d.id} />
              <button type="submit" className="text-xs text-danger underline">excluir</button>
            </form>
          </div>
        </td>
      </tr>

      {aberto && (
        <tr className="border-t border-line bg-ivory/60">
          <td colSpan={6} className="p-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <form action={formAction} className="grid gap-2 rounded-lg border border-line bg-white p-4">
                <input type="hidden" name="id" value={d.id} />
                <input name="descricao" defaultValue={d.descricao} placeholder="Descrição" required className="field-input py-1.5 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <MoneyInput
                    name="valor"
                    defaultValueCents={d.valor_total_cents}
                    placeholder="Valor (R$)"
                    className="field-input py-1.5 text-sm"
                  />
                  <select name="estado" defaultValue={d.gratuito ? "gratuito" : d.estado} className="field-input py-1.5 text-sm">
                    <option value="previsto">Previsto</option>
                    <option value="orcado">Orçado</option>
                    <option value="contratado">Contratado</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                <p className="text-[11px] text-muted">
                  &quot;Contratado&quot; ou &quot;Pago&quot; aparece automaticamente em Contratos para anexar o arquivo assinado.
                </p>
                <input name="categoria" defaultValue={d.categoria ?? ""} list="cat-list-edit" placeholder="Categoria" className="field-input py-1.5 text-sm" />
                <datalist id="cat-list-edit">
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <div className="flex flex-col gap-1">
                  <label className="field-label">Prazo para contratar</label>
                  <input
                    name="prazo_contratacao"
                    type="date"
                    defaultValue={d.prazo_contratacao ?? ""}
                    className="field-input py-1.5 text-sm"
                  />
                </div>
                <input name="observacao" defaultValue={d.observacao ?? ""} placeholder="Observação" className="field-input py-1.5 text-sm" />
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input type="checkbox" name="exige_nota_fiscal" defaultChecked={d.exige_nota_fiscal} /> Exigir nota fiscal
                </label>
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input type="checkbox" name="gratuito" defaultChecked={d.gratuito} /> É gratuito / cortesia
                </label>
                <div className="flex items-center gap-3">
                  <SaveButton />
                  {state.message && (
                    <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
                  )}
                </div>
              </form>

              <div className="rounded-lg border border-line bg-white p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Datas de pagamento</p>
                {d.gratuito ? (
                  <p className="text-sm text-muted">Item gratuito — não gera parcelas.</p>
                ) : d.valor_total_cents === null ? (
                  <p className="text-sm text-muted">Defina o valor ao lado para poder agendar os pagamentos.</p>
                ) : (
                  <div className="grid gap-3">
                    <GerarParcelas expenseId={d.id} temParcelas={temParcelas} metodos={metodos} responsaveis={responsaveis} />
                    {parcelas.length > 0 && (
                      <ul className="grid gap-1.5">
                        {parcelas
                          .slice()
                          .sort((a, b) => a.numero - b.numero)
                          .map((p) => (
                            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-ivory px-3 py-1.5 text-sm">
                              <span className="text-moss">
                                {p.numero}º pagamento — {formatCents(p.valor_cents)}
                                {p.vencimento && <span className="ml-2 text-xs text-muted">({fmtDateBR(p.vencimento)})</span>}
                              </span>
                              <form action={atualizarVencimentoParcela} className="flex items-center gap-1">
                                <input type="hidden" name="id" value={p.id} />
                                <input
                                  type="date"
                                  name="vencimento"
                                  defaultValue={p.vencimento ?? ""}
                                  className="field-input py-1 text-xs"
                                  aria-label={`Data do ${p.numero}º pagamento`}
                                />
                                <button type="submit" className="text-xs text-olive underline">salvar</button>
                              </form>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
