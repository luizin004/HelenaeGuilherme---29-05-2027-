"use client";

import { useEffect, useRef, useState } from "react";
import { parseBRLToCents, formatCents } from "@/domain/money";

const VALOR_MINIMO_CENTS = 2_000; // R$ 20,00 (mesmo piso técnico do backend)

type Metodo = "PIX" | "CREDIT_CARD" | "BOLETO";

interface Resultado {
  invoiceUrl?: string;
  pix?: { qrCode?: string; copiaECola?: string };
}

export function PresentearModal({
  gift,
}: {
  gift: { id: string; nome: string; preco: number; permite_cota: boolean };
}) {
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [metodo, setMetodo] = useState<Metodo>("PIX");
  const [copiado, setCopiado] = useState(false);
  const primeiroCampoRef = useRef<HTMLInputElement>(null);

  const precoCents = Math.round(gift.preco * 100);

  useEffect(() => {
    if (!aberto) return;
    primeiroCampoRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  function abrir() {
    setErro(null);
    setResultado(null);
    setMetodo("PIX");
    setCopiado(false);
    setAberto(true);
  }

  function fechar() {
    if (enviando) return;
    setAberto(false);
  }

  async function submeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    const form = new FormData(e.currentTarget);
    const nome = String(form.get("nome") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const telefone = String(form.get("telefone") ?? "").trim();
    const mensagem = String(form.get("mensagem") ?? "").trim();
    const valorRaw = String(form.get("valor") ?? "").trim();

    if (!nome) {
      setErro("Informe seu nome.");
      return;
    }

    let valorCents = precoCents;
    if (gift.permite_cota) {
      try {
        valorCents = parseBRLToCents(valorRaw);
      } catch {
        setErro("Informe um valor válido.");
        return;
      }
    }
    if (valorCents < VALOR_MINIMO_CENTS) {
      setErro(`O valor mínimo de presente é ${formatCents(VALOR_MINIMO_CENTS)}.`);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/asaas/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gift_id: gift.id,
          valor: valorCents / 100,
          metodo,
          pagador: { nome, email: email || undefined, telefone: telefone || undefined },
          mensagem: mensagem || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(
          res.status === 503
            ? "Pagamentos ainda não estão configurados. Fale com os noivos para combinar esse presente diretamente."
            : (data.error ?? "Não foi possível iniciar o pagamento. Tente novamente."),
        );
        return;
      }
      setResultado(data as Resultado);
    } catch {
      setErro("Falha de conexão. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  async function copiarPix() {
    if (!resultado?.pix?.copiaECola) return;
    try {
      await navigator.clipboard.writeText(resultado.pix.copiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // silencioso — o campo de texto abaixo já permite copiar manualmente
    }
  }

  return (
    <>
      <button type="button" onClick={abrir} className="btn btn-dark px-5 py-2.5">
        Presentear
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-moss-deep/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Presentear: ${gift.nome}`}
          onClick={fechar}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 text-left shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">Presentear</p>
                <h2 className="font-serif text-2xl text-moss">{gift.nome}</h2>
              </div>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="-m-2 shrink-0 p-2 text-xl text-muted hover:text-moss"
              >
                ✕
              </button>
            </div>

            {resultado ? (
              <ResultadoPagamento resultado={resultado} metodo={metodo} onCopiar={copiarPix} copiado={copiado} />
            ) : (
              <form onSubmit={submeter} className="grid gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="p-nome" className="field-label">Seu nome</label>
                  <input ref={primeiroCampoRef} id="p-nome" name="nome" required placeholder="Nome completo" className="field-input" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="p-email" className="field-label">E-mail (opcional)</label>
                    <input id="p-email" name="email" type="email" placeholder="voce@email.com" className="field-input" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="p-tel" className="field-label">Telefone (opcional)</label>
                    <input id="p-tel" name="telefone" type="tel" inputMode="tel" placeholder="(00) 90000-0000" className="field-input" />
                  </div>
                </div>

                {gift.permite_cota ? (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="p-valor" className="field-label">Valor da cota</label>
                    <input
                      id="p-valor"
                      name="valor"
                      inputMode="decimal"
                      defaultValue={formatCents(precoCents)}
                      className="field-input"
                    />
                    <span className="text-xs text-muted">Valor livre, a partir de {formatCents(VALOR_MINIMO_CENTS)}.</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    Valor: <span className="font-serif text-lg text-olive">{formatCents(precoCents)}</span>
                  </p>
                )}

                <div className="flex flex-col gap-1.5">
                  <span className="field-label">Forma de pagamento</span>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { v: "PIX", label: "Pix" },
                      { v: "CREDIT_CARD", label: "Cartão" },
                      { v: "BOLETO", label: "Boleto" },
                    ] as const).map((op) => (
                      <button
                        key={op.v}
                        type="button"
                        onClick={() => setMetodo(op.v)}
                        className={`rounded-full border px-4 py-1.5 text-sm transition ${
                          metodo === op.v
                            ? "border-olive bg-olive text-white"
                            : "border-line text-muted hover:border-olive hover:text-olive"
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="p-msg" className="field-label">Mensagem para os noivos (opcional)</label>
                  <textarea id="p-msg" name="mensagem" rows={2} placeholder="Deixe um recado carinhoso" className="field-input" />
                </div>

                {erro && <p className="text-sm text-danger">{erro}</p>}

                <button type="submit" disabled={enviando} className="btn btn-dark disabled:opacity-60">
                  {enviando ? "Processando…" : "Continuar para pagamento"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ResultadoPagamento({
  resultado,
  metodo,
  onCopiar,
  copiado,
}: {
  resultado: Resultado;
  metodo: Metodo;
  onCopiar: () => void;
  copiado: boolean;
}) {
  if (metodo === "PIX" && resultado.pix?.qrCode) {
    return (
      <div className="grid gap-4 text-center">
        <p className="text-sm text-muted">Escaneie o QR Code ou copie o código Pix abaixo.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${resultado.pix.qrCode}`}
          alt="QR Code Pix"
          className="mx-auto h-48 w-48 rounded-lg border border-line"
        />
        {resultado.pix.copiaECola && (
          <div className="flex flex-col gap-1.5 text-left">
            <span className="field-label">Pix copia e cola</span>
            <textarea readOnly rows={3} value={resultado.pix.copiaECola} className="field-input text-xs" />
            <button type="button" onClick={onCopiar} className="btn btn-outline mt-1">
              {copiado ? "Copiado!" : "Copiar código"}
            </button>
          </div>
        )}
        <p className="text-xs text-muted">
          Após a confirmação do pagamento, atualizamos o status automaticamente. Obrigado! 🤍
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 text-center">
      <p className="text-sm text-muted">Seu pagamento foi iniciado. Finalize na página segura abaixo:</p>
      {resultado.invoiceUrl && (
        <a href={resultado.invoiceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-dark">
          Ir para pagamento
        </a>
      )}
      <p className="text-xs text-muted">Obrigado por fazer parte desse novo capítulo! 🤍</p>
    </div>
  );
}
