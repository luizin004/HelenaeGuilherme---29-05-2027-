"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reveal } from "./Reveal";

export function Rsvp() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = codigo.trim();
    if (c) router.push(`/rsvp/${encodeURIComponent(c)}`);
  }

  return (
    <section id="rsvp" className="scroll-mt-20 bg-cream md:scroll-mt-28">
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <Reveal>
          <p className="eyebrow">Contamos com você</p>
          <h2 className="section-title after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
            Confirme sua presença
          </h2>
          <p className="mx-auto mb-8 max-w-md text-muted">
            Use o <strong>link pessoal</strong> que você recebeu no convite — ou informe o código do
            convite abaixo para continuar.
          </p>
          <form onSubmit={submit} className="mx-auto flex max-w-sm flex-col gap-3 sm:flex-row">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código do convite"
              aria-label="Código do convite"
              className="field-input flex-1 text-center"
            />
            <button type="submit" className="btn btn-dark">Continuar</button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
