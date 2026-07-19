"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { registrarComprovante } from "@/app/actions/comprovantes";
import { formatCents } from "@/domain/money";

const BUCKET = "hg-documentos";
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "webp"];
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

export function UploadComprovante({
  expenseId,
  parcelas,
}: {
  expenseId: string;
  parcelas: { id: string; numero: number; valor_cents: number }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [aberto, setAberto] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem("arquivo") as HTMLInputElement).files?.[0];
    if (!file) {
      setOk(false);
      setMsg("Escolha um arquivo.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      setOk(false);
      setMsg(`Tipo não permitido (.${ext}). Aceitos: ${ALLOWED_EXT.join(", ")}.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setOk(false);
      setMsg("Arquivo acima de 15 MB.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setOk(false);
      setMsg("Backend não configurado.");
      return;
    }

    start(async () => {
      const safe = file.name.replace(/[^\w.\-]/g, "_");
      const path = `comprovantes/${expenseId}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) {
        setOk(false);
        setMsg("Falha no upload: " + error.message);
        return;
      }
      const fd = new FormData(form);
      fd.set("expense_id", expenseId);
      fd.set("path", path);
      const res = await registrarComprovante({ ok: false, message: "" }, fd);
      setOk(res.ok);
      setMsg(res.message);
      if (res.ok) {
        formRef.current?.reset();
        setAberto(false);
      }
    });
  }

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="text-xs text-olive underline">
        + anexar comprovante
      </button>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-2 grid gap-2 rounded-lg border border-line bg-ivory p-3 text-left">
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="titulo" placeholder="Título (ex.: Recibo entrada)" className="field-input py-1.5 text-sm" />
        <input name="valor" inputMode="decimal" placeholder="Valor do comprovante (R$)" className="field-input py-1.5 text-sm" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="data_pagamento" type="date" className="field-input py-1.5 text-sm" />
        <select name="installment_id" defaultValue="" className="field-input py-1.5 text-sm">
          <option value="">Sem vincular a parcela</option>
          {parcelas.map((p) => (
            <option key={p.id} value={p.id}>
              Parcela {p.numero} · {formatCents(p.valor_cents)} (marca paga)
            </option>
          ))}
        </select>
      </div>
      <input name="observacao" placeholder="Observações" className="field-input py-1.5 text-sm" />
      <input name="arquivo" type="file" accept={ACCEPT} className="text-sm" />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-dark px-4 py-1.5 text-xs disabled:opacity-60">
          {pending ? "Enviando…" : "Anexar"}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="text-xs text-muted underline">fechar</button>
        {msg && <span className={`text-xs ${ok ? "text-olive" : "text-danger"}`}>{msg}</span>}
      </div>
    </form>
  );
}
