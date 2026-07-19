"use client";

import { useState, useTransition } from "react";
import { registrarCheckin, type CheckinResult } from "@/app/actions/checkin";
import { PageTitle } from "@/components/admin/ui";

export default function CheckinPage() {
  const [codigo, setCodigo] = useState("");
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    start(async () => {
      const r = await registrarCheckin(codigo);
      setResult(r);
      setCodigo("");
    });
  }

  return (
    <>
      <PageTitle>Check-in</PageTitle>
      <div className="mx-auto max-w-lg text-center">
        <form onSubmit={submit} className="rounded-lg bg-white p-10 shadow-card">
          <p className="mb-4 text-muted">Aponte o QR Code do convidado ou digite o código:</p>
          <input
            autoFocus
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código do convidado"
            className="w-full rounded border border-line px-4 py-4 text-center text-lg focus:border-olive focus:outline-none focus:ring-4 focus:ring-olive/15"
          />
          <button type="submit" disabled={pending} className="btn btn-dark mt-4 disabled:opacity-60">
            {pending ? "Validando…" : "Registrar chegada"}
          </button>
          {result && (
            <p className={`mt-5 font-serif text-2xl ${result.ok ? "text-success" : "text-danger"}`}>
              {result.message}
            </p>
          )}
        </form>
        <p className="mt-4 text-sm text-muted">
          No dia do casamento, a leitura pela câmera valida o <code>qr_token</code> e registra a
          chegada na tabela <code>checkins</code>.
        </p>
      </div>
    </>
  );
}
