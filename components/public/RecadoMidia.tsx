"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "hg-recados";
const MAX_AUDIO_SEG = 180;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

/** mm:ss */
function relogio(seg: number): string {
  return `${String(Math.floor(seg / 60)).padStart(2, "0")}:${String(seg % 60).padStart(2, "0")}`;
}

/** Extensão a partir do mime do MediaRecorder (webm/mp4/ogg). */
function extensaoDe(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * Recado em áudio (gravado na hora) e vídeo (do celular ou do computador).
 * O arquivo sobe direto para um bucket privado — o convidado envia, mas só
 * os noivos conseguem ouvir/assistir. Os caminhos salvos viajam em campos
 * ocultos junto do formulário de confirmação.
 */
export function RecadoMidia({ token }: { token: string }) {
  const [suportaGravacao, setSuportaGravacao] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioPath, setAudioPath] = useState("");
  const [audioDuracao, setAudioDuracao] = useState(0);
  const [videoNome, setVideoNome] = useState("");
  const [videoPath, setVideoPath] = useState("");
  const [enviando, setEnviando] = useState<"audio" | "video" | null>(null);
  const [erro, setErro] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Contador em ref: o onstop precisa do valor final, sem depender do estado. */
  const segundosRef = useRef(0);

  useEffect(() => {
    setSuportaGravacao(
      typeof window !== "undefined" &&
        typeof window.MediaRecorder !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function enviarArquivo(blob: Blob, nome: string, tipo: "audio" | "video"): Promise<string | null> {
    const supabase = createClient();
    if (!supabase) {
      setErro("Envio indisponível no momento.");
      return null;
    }
    setEnviando(tipo);
    setErro("");
    const caminho = `recados/${token}/${Date.now()}-${nome}`;
    const { error } = await supabase.storage.from(BUCKET).upload(caminho, blob, {
      contentType: blob.type || undefined,
    });
    setEnviando(null);
    if (error) {
      setErro("Não conseguimos enviar o arquivo. Tente de novo.");
      return null;
    }
    return caminho;
  }

  async function iniciarGravacao() {
    setErro("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setAudioUrl(URL.createObjectURL(blob));
        const duracao = segundosRef.current;
        setAudioDuracao(duracao);
        const caminho = await enviarArquivo(blob, `recado.${extensaoDe(recorder.mimeType)}`, "audio");
        if (caminho) setAudioPath(caminho);
      };

      recorder.start();
      recorderRef.current = recorder;
      setGravando(true);
      setSegundos(0);
      segundosRef.current = 0;
      timerRef.current = setInterval(() => {
        segundosRef.current += 1;
        setSegundos(segundosRef.current);
        if (segundosRef.current >= MAX_AUDIO_SEG) pararGravacao();
      }, 1000);
    } catch {
      setErro("Não conseguimos acessar o microfone. Verifique a permissão do navegador.");
    }
  }

  function pararGravacao() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setGravando(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function descartarAudio() {
    setAudioUrl(null);
    setAudioPath("");
    setAudioDuracao(0);
    setSegundos(0);
    segundosRef.current = 0;
  }

  async function escolherVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setErro("O vídeo passa de 60 MB. Grave um trechinho menor, por favor.");
      e.target.value = "";
      return;
    }
    const safe = file.name.replace(/[^\w.\-]/g, "_");
    const caminho = await enviarArquivo(file, safe, "video");
    if (caminho) {
      setVideoPath(caminho);
      setVideoNome(file.name);
    }
    e.target.value = "";
  }

  return (
    <div className="grid gap-4 rounded-lg border border-sand/70 p-3">
      <p className="font-serif text-lg text-moss">Prefere falar em vez de escrever?</p>

      {/* Campos que viajam com o formulário de confirmação */}
      <input type="hidden" name="recado_audio_path" value={audioPath} />
      <input type="hidden" name="recado_audio_duracao" value={audioDuracao || ""} />
      <input type="hidden" name="recado_video_path" value={videoPath} />

      {/* Áudio */}
      <div className="grid gap-2">
        <span className="field-label">Recado em áudio</span>
        {!suportaGravacao ? (
          <p className="text-xs text-muted">
            Seu navegador não permite gravar por aqui — pode mandar um vídeo abaixo ou escrever o
            recado. 💛
          </p>
        ) : audioUrl ? (
          <div className="flex flex-wrap items-center gap-3">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls src={audioUrl} className="h-9 max-w-full" />
            <span className="text-xs text-muted">
              {enviando === "audio" ? "enviando…" : audioPath ? "enviado ✓" : "não enviado"}
            </span>
            <button type="button" onClick={descartarAudio} className="text-xs text-danger underline">
              gravar de novo
            </button>
          </div>
        ) : gravando ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-sm text-danger">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-danger" />
              gravando {relogio(segundos)}
            </span>
            <button type="button" onClick={pararGravacao} className="btn btn-dark px-4 py-1.5 text-xs">
              Parar
            </button>
          </div>
        ) : (
          <button type="button" onClick={iniciarGravacao} className="btn btn-outline w-fit px-4 py-1.5 text-xs">
            🎙️ Gravar áudio
          </button>
        )}
        {suportaGravacao && !audioUrl && !gravando && (
          <span className="text-xs text-muted">Até 3 minutos. Grave onde estiver — a gente ouve depois. 🤍</span>
        )}
      </div>

      {/* Vídeo */}
      <div className="grid gap-2">
        <span className="field-label">Recado em vídeo</span>
        {videoPath ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-moss">🎬 {videoNome}</span>
            <span className="text-xs text-olive">enviado ✓</span>
            <button
              type="button"
              onClick={() => {
                setVideoPath("");
                setVideoNome("");
              }}
              className="text-xs text-danger underline"
            >
              trocar
            </button>
          </div>
        ) : (
          <label className="btn btn-outline w-fit cursor-pointer px-4 py-1.5 text-xs">
            {enviando === "video" ? "Enviando…" : "🎬 Enviar vídeo"}
            <input
              type="file"
              accept="video/*"
              onChange={escolherVideo}
              disabled={enviando !== null}
              className="hidden"
            />
          </label>
        )}
        {!videoPath && <span className="text-xs text-muted">Até 60 MB — um recadinho curto já faz o dia. 💛</span>}
      </div>

      {erro && <p className="text-xs text-danger">{erro}</p>}
    </div>
  );
}
