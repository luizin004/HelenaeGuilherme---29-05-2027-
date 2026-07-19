"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { registrarDocumento } from "@/app/actions/documents";

const BUCKET = "hg-documentos";

export function UploadDocumento() {
  const formRef = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem("arquivo") as HTMLInputElement).files?.[0];
    const titulo = (form.elements.namedItem("titulo") as HTMLInputElement).value.trim();
    const categoria = (form.elements.namedItem("categoria") as HTMLInputElement).value.trim();

    if (!file || !titulo) {
      setOk(false);
      setMsg("Escolha um arquivo e informe o título.");
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
      const path = `${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) {
        setOk(false);
        setMsg("Falha no upload: " + error.message);
        return;
      }
      const fd = new FormData();
      fd.set("titulo", titulo);
      fd.set("categoria", categoria);
      fd.set("path", path);
      const res = await registrarDocumento({ ok: false, message: "" }, fd);
      setOk(res.ok);
      setMsg(res.message);
      if (res.ok) formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="d-tit" className="field-label">Título</label>
        <input id="d-tit" name="titulo" required placeholder="Contrato do buffet" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="d-cat" className="field-label">Categoria</label>
        <input id="d-cat" name="categoria" placeholder="Contrato, comprovante…" className="field-input" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="d-arq" className="field-label">Arquivo</label>
        <input id="d-arq" name="arquivo" type="file" className="text-sm" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
        {pending ? "Enviando…" : "Enviar"}
      </button>
      {msg && <span className={`text-sm ${ok ? "text-olive" : "text-danger"}`}>{msg}</span>}
    </form>
  );
}
