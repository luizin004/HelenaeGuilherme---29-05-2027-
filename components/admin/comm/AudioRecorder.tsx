"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { registrarAudio, type ActionState } from "@/app/actions/comm";

const initial: ActionState = { ok: false, message: "" };
const CATEGORIAS = [
  "convite", "agradecimento", "confirmacao", "lembrete", "padrinhos", "traje",
  "medidas", "reuniao", "ensaio", "hospedagem", "rota", "check-in", "resposta_rapida",
  "atendimento", "personalizado", "outro",
];

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className="btn btn-dark disabled:opacity-50">
      {pending ? "Registrando…" : "Registrar áudio"}
    </button>
  );
}

export function AudioRecorder() {
  const [state, formAction] = useFormState(registrarAudio, initial);
  const [gravando, setGravando] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ path: string; dur: number; size: number; fmt: string } | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const startRef = useRef<number>(0);

  async function iniciar() {
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        blobRef.current = blob;
        setBlobUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      startRef.current = Date.now();
      mr.start();
      mediaRef.current = mr;
      setGravando(true);
      setMeta(null);
    } catch {
      setErro("Não foi possível acessar o microfone. Você pode enviar um arquivo de áudio abaixo.");
    }
  }

  function parar() {
    mediaRef.current?.stop();
    setGravando(false);
  }

  function escolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    blobRef.current = f;
    setBlobUrl(URL.createObjectURL(f));
    setMeta(null);
    startRef.current = 0;
  }

  async function enviar() {
    if (!blobRef.current) return;
    setEnviando(true);
    setErro(null);
    const supabase = createClient();
    if (!supabase) {
      setErro("Backend não configurado.");
      setEnviando(false);
      return;
    }
    const blob = blobRef.current;
    const ext = (blob.type.split("/")[1] || "webm").replace("x-", "");
    const path = `audios/${Date.now()}-${Math.round(blob.size)}.${ext}`;
    const { error } = await supabase.storage.from("hg-audios").upload(path, blob, {
      contentType: blob.type || "audio/webm",
      upsert: false,
    });
    if (error) {
      setErro("Falha ao enviar o áudio. Faça login novamente e tente de novo.");
      setEnviando(false);
      return;
    }
    const dur = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0;
    setMeta({ path, dur, size: blob.size, fmt: blob.type || "audio/webm" });
    setEnviando(false);
  }

  return (
    <div className="grid gap-5 p-6">
      <div className="flex flex-wrap items-center gap-3">
        {!gravando ? (
          <button type="button" onClick={iniciar} className="btn btn-outline">● Gravar</button>
        ) : (
          <button type="button" onClick={parar} className="btn btn-dark">■ Parar</button>
        )}
        <span className="text-sm text-muted">ou</span>
        <label className="btn btn-outline cursor-pointer">
          Enviar arquivo
          <input type="file" accept="audio/*" onChange={escolherArquivo} className="hidden" />
        </label>
        {gravando && <span className="text-sm text-danger">Gravando…</span>}
      </div>

      {blobUrl && (
        <div className="flex flex-wrap items-center gap-4">
          <audio controls src={blobUrl} className="max-w-full" />
          {!meta && (
            <button type="button" onClick={enviar} disabled={enviando} className="btn btn-dark disabled:opacity-60">
              {enviando ? "Enviando…" : "Enviar para o cofre privado"}
            </button>
          )}
          {meta && <span className="text-sm text-olive">Áudio enviado ✓ (privado)</span>}
        </div>
      )}

      {erro && <p className="text-sm text-danger">{erro}</p>}

      <form action={formAction} className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
        <input type="hidden" name="storage_path" value={meta?.path ?? ""} />
        <input type="hidden" name="duracao_seg" value={meta?.dur ?? ""} />
        <input type="hidden" name="tamanho_bytes" value={meta?.size ?? ""} />
        <input type="hidden" name="formato" value={meta?.fmt ?? ""} />
        <div className="flex flex-col gap-1">
          <label className="field-label">Título</label>
          <input name="titulo" required className="field-input" placeholder="Ex.: Convite para a madrinha" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Categoria</label>
          <select name="categoria" className="field-input">
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Quem gravou</label>
          <input name="gravado_por" className="field-input" placeholder="Ex.: Helena" />
        </div>
        <label className="flex items-center gap-2 self-end text-sm text-muted">
          <input type="checkbox" name="quick_reply" /> Usar como resposta rápida
        </label>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="field-label">Roteiro / observação (opcional)</label>
          <textarea name="roteiro" rows={2} className="field-input" />
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Submit disabled={!meta} />
          {!meta && <span className="text-sm text-muted">Grave ou envie o áudio antes de registrar.</span>}
          {state.message && <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>}
        </div>
      </form>
    </div>
  );
}
