"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { gerarParcelas, type InstallmentState } from "@/app/actions/installments";
import { calcularEntrada, splitComEntrada } from "@/domain/finance/installments";
import { formatCents } from "@/domain/money";
import type { Option } from "@/lib/admin-data";

const initial: InstallmentState = { ok: false, message: "" };

type Ritmo = "intervalo" | "mensal" | "ate_casamento";

/** Combinações que resolvem 95% dos casos de casamento em um clique. */
const PRESETS = [
  { id: "padrao", rotulo: "30% + saldo até o casamento", entrada: 30, n: 3, ritmo: "ate_casamento" as Ritmo },
  { id: "metade", rotulo: "50% agora, 50% no fim", entrada: 50, n: 2, ritmo: "ate_casamento" as Ritmo },
  { id: "mensal", rotulo: "30% + 6× mensais", entrada: 30, n: 7, ritmo: "mensal" as Ritmo },
  { id: "avista", rotulo: "À vista", entrada: 0, n: 1, ritmo: "intervalo" as Ritmo },
];

function Submit({ temParcelas }: { temParcelas: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-2 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : temParcelas ? "Renegociar cronograma" : "Gerar cronograma"}
    </button>
  );
}

/**
 * Condição de pagamento (§16). O padrão de casamento é entrada de 30% e o
 * saldo distribuído até o dia — por isso os presets e a prévia dos valores
 * antes de salvar: dá para ver quanto cai em cada parcela sem gerar nada.
 */
export function GerarParcelas({
  expenseId,
  temParcelas,
  metodos,
  responsaveis,
  totalCents,
}: {
  expenseId: string;
  temParcelas: boolean;
  metodos: Option[];
  responsaveis: Option[];
  totalCents: number | null;
}) {
  const [state, formAction] = useFormState(gerarParcelas, initial);
  const [entrada, setEntrada] = useState(30);
  const [n, setN] = useState(3);
  const [ritmo, setRitmo] = useState<Ritmo>("ate_casamento");

  function aplicarPreset(p: (typeof PRESETS)[number]) {
    setEntrada(p.entrada);
    setN(p.n);
    setRitmo(p.ritmo);
  }

  // Prévia local — mesma regra do servidor, para conferir antes de salvar.
  const previa =
    totalCents && totalCents > 0 && n >= 1
      ? entrada > 0 && n >= 2
        ? splitComEntrada(totalCents, calcularEntrada(totalCents, entrada), n - 1)
        : splitComEntrada(totalCents, 0, n)
      : [];

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-line bg-ivory p-4">
      <input type="hidden" name="expense_id" value={expenseId} />
      <input type="hidden" name="ritmo" value={ritmo} />
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Condição de pagamento</p>

      {/* Atalhos */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const ativo = p.entrada === entrada && p.n === n && p.ritmo === ritmo;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => aplicarPreset(p)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                ativo ? "bg-moss text-white" : "bg-white text-muted shadow-card hover:text-moss"
              }`}
            >
              {p.rotulo}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="field-label">Entrada (%)</label>
          <input
            name="entrada_pct"
            type="number"
            min={0}
            max={100}
            value={entrada}
            onChange={(e) => setEntrada(Number(e.target.value))}
            className="field-input py-1.5"
          />
          <span className="text-[11px] text-muted">
            {entrada > 0 && totalCents
              ? `${formatCents(calcularEntrada(totalCents, entrada))} na assinatura`
              : "0% = sem entrada"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="field-label">Total de parcelas</label>
          <input
            name="n"
            type="number"
            min={1}
            max={60}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            required
            className="field-input py-1.5"
          />
          <span className="text-[11px] text-muted">
            {entrada > 0 ? `entrada + ${Math.max(0, n - 1)}× do saldo` : `${n}× iguais`}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="field-label">1º vencimento</label>
          <input name="primeiro_vencimento" type="date" className="field-input py-1.5" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="field-label">Ritmo das parcelas</label>
          <select value={ritmo} onChange={(e) => setRitmo(e.target.value as Ritmo)} className="field-input py-1.5">
            <option value="ate_casamento">Distribuir até o casamento</option>
            <option value="mensal">Mensal (mesmo dia do mês)</option>
            <option value="intervalo">Intervalo fixo em dias</option>
          </select>
        </div>

        {ritmo === "intervalo" && (
          <div className="flex flex-col gap-1">
            <label className="field-label" title="Dias entre uma parcela e a próxima (30 ≈ mensal, 15 = quinzenal, 7 = semanal)">
              Intervalo (dias) ⓘ
            </label>
            <input name="intervalo_dias" type="number" min={1} max={365} defaultValue={30} className="field-input py-1.5" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="field-label">Forma de pagamento</label>
          <select name="metodo_id" className="field-input py-1.5">
            <option value="">—</option>
            {metodos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="field-label">Responsável pela cobrança (quem paga)</label>
          <select name="responsavel_payer_id" className="field-input py-1.5">
            <option value="">— manter atual —</option>
            {responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </div>

        {temParcelas && (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="field-label">Motivo da renegociação</label>
            <input name="motivo" placeholder="Obrigatório ao renegociar" required className="field-input py-1.5" />
          </div>
        )}
      </div>

      {/* Prévia dos valores antes de gerar */}
      {previa.length > 0 && (
        <div className="rounded border border-line bg-white px-3 py-2">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">Ficará assim</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink">
            {previa.map((v, i) => (
              <span key={i}>
                <span className="text-muted">{i === 0 && entrada > 0 ? "Entrada" : `${i + 1}ª`}:</span>{" "}
                <span className="font-medium">{formatCents(v)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Submit temParcelas={temParcelas} />
        <span className="text-xs text-muted">
          As parcelas fecham exatamente o total; valor e data de cada uma podem ser ajustados abaixo.
        </span>
      </div>
      {state.message && <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
    </form>
  );
}
