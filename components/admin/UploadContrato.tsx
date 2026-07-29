"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { anexarArquivoContrato } from "@/app/actions/contracts";

const BUCKET = "hg-documentos";
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "webp"];
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

export function UploadContrato({ contractId, temArquivo }: { contractId: string; temArquivo: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const path = `contratos/${contractId}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) {
        setOk(false);
        setMsg("Falha no upload: " + error.message);
        return;
      }
      const res = await anexarArquivoContrato(contractId, path);
      setOk(res.ok);
      setMsg(res.message);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <label className="cursor-pointer text-xs text-olive underline">
        {pending ? "Enviando…" : temArquivo ? "trocar arquivo" : "+ anexar contrato"}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onChange}
          disabled={pending}
          className="hidden"
        />
      </label>
      {msg && <span className={`text-xs ${ok ? "text-olive" : "text-danger"}`}>{msg}</span>}
    </div>
  );
}
