"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { registrarPagamento, type PagamentoFormState } from "@/app/actions/pagamentos";
import { formatCents } from "@/domain/money";

const initial: PagamentoFormState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark text-xs disabled:opacity-60">
      {pending ? "Registrando…" : "Registrar pagamento"}
    </button>
  );
}

interface Opcao {
  id: string;
  nome: string;
}

/**
 * Registro de pagamento total ou PARCIAL (§15): valor, data, método, conta,
 * responsável e observação. Vários pagamentos podem quitar a mesma conta.
 */
export function PagamentoForm({
  expenseId,
  installmentId,
  saldoCents,
  hoje,
  metodos,
  contas,
}: {
  expenseId: string;
  installmentId: string | null;
  saldoCents: number;
  hoje: string;
  metodos: Opcao[];
  contas: Opcao[];
}) {
  const [state, formAction] = useFormState(registrarPagamento, initial);
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="text-xs text-olive underline">
        registrar pagamento
      </button>
    );
  }

  return (
    <form action={formAction} className="grid min-w-[240px] gap-2 rounded-lg border border-line bg-ivory p-3 text-left">
      <input type="hidden" name="expense_id" value={expenseId} />
      {installmentId && <input type="hidden" name="installment_id" value={installmentId} />}
      <p className="text-xs text-muted">
        Saldo pendente: <strong className="text-moss">{formatCents(saldoCents)}</strong> · pagamento parcial permitido
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input name="valor" required placeholder="R$ 0,00" defaultValue={formatCents(saldoCents)} className="field-input py-1.5 text-xs" aria-label="Valor" />
        <input type="date" name="data" required defaultValue={hoje} className="field-input py-1.5 text-xs" aria-label="Data do pagamento" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select name="metodo_id" className="field-input py-1.5 text-xs" aria-label="Método">
          <option value="">Método…</option>
          {metodos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        <select name="conta_id" className="field-input py-1.5 text-xs" aria-label="Conta">
          <option value="">Conta…</option>
          {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <input name="responsavel" placeholder="Responsável (opcional)" className="field-input py-1.5 text-xs" />
      <input name="observacao" placeholder="Observação (opcional)" className="field-input py-1.5 text-xs" />
      <div className="flex items-center gap-2">
        <Submit />
        <button type="button" onClick={() => setAberto(false)} className="text-xs text-muted underline">fechar</button>
      </div>
      {state.message && <p className={`text-xs ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}
