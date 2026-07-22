"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { gerarParcelas, type InstallmentState } from "@/app/actions/installments";
import type { Option } from "@/lib/admin-data";

const initial: InstallmentState = { ok: false, message: "" };

function Submit({ temParcelas }: { temParcelas: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark px-4 py-2 text-xs disabled:opacity-60">
      {pending ? "Salvando…" : temParcelas ? "Renegociar cronograma" : "Gerar cronograma"}
    </button>
  );
}

/**
 * Condição de pagamento (§16): parcelamento, 1º vencimento, intervalo em dias
 * OU mensal, forma de pagamento e responsável pela cobrança. Gera/renegocia o
 * cronograma (renegociar versiona o anterior, exige motivo).
 */
export function GerarParcelas({
  expenseId,
  temParcelas,
  metodos,
  responsaveis,
}: {
  expenseId: string;
  temParcelas: boolean;
  metodos: Option[];
  responsaveis: Option[];
}) {
  const [state, formAction] = useFormState(gerarParcelas, initial);
  const [mensal, setMensal] = useState(false);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-line bg-ivory p-4">
      <input type="hidden" name="expense_id" value={expenseId} />
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Condição de pagamento</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="field-label">Parcelamento</label>
          <input name="n" type="number" min={1} max={60} defaultValue={temParcelas ? undefined : 1} required className="field-input py-1.5" placeholder="Ex.: 4" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">1º vencimento</label>
          <input name="primeiro_vencimento" type="date" className="field-input py-1.5" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label" title="Dias entre uma parcela e a próxima (30 ≈ mensal, 15 = quinzenal, 7 = semanal)">
            Intervalo (dias) ⓘ
          </label>
          <input name="intervalo_dias" type="number" min={1} max={365} defaultValue={30} disabled={mensal} className="field-input py-1.5 disabled:opacity-50" />
        </div>
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
        <label className="flex items-center gap-2 self-end pb-1.5 text-sm text-muted">
          <input type="checkbox" name="mensal" checked={mensal} onChange={(e) => setMensal(e.target.checked)} />
          Mensal (mesmo dia do mês)
        </label>
        {temParcelas && (
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
            <label className="field-label">Motivo da renegociação</label>
            <input name="motivo" placeholder="Obrigatório ao renegociar" required className="field-input py-1.5" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Submit temParcelas={temParcelas} />
        <span className="text-xs text-muted">As parcelas fecham exatamente o total; cada data pode ser ajustada abaixo.</span>
      </div>
      {state.message && <span className={`text-xs ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
    </form>
  );
}
