"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Leitor de QR por câmera usando a API nativa BarcodeDetector (Chromium/Android).
 * Sem dependências externas. Se o navegador não suportar, o componente informa
 * e o operador continua pelo campo manual do check-in.
 */

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

function getCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector ?? null;
}

export function QrScanner({ onDetected }: { onDetected: (raw: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const [ativo, setAtivo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const suportado = getCtor() !== null;

  const parar = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setAtivo(false);
  }, []);

  const iniciar = useCallback(async () => {
    setErro(null);
    const Ctor = getCtor();
    if (!Ctor) {
      setErro("Este navegador não suporta leitura por câmera. Use o campo manual.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setAtivo(true);

      const detector = new Ctor({ formats: ["qr_code"] });
      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const value = codes[0].rawValue;
            const now = Date.now();
            // Evita disparos repetidos do mesmo código (cooldown 2.5s).
            if (value && (value !== lastRef.current.value || now - lastRef.current.at > 2500)) {
              lastRef.current = { value, at: now };
              onDetected(value);
            }
          }
        } catch {
          /* frame ruim — ignora e continua */
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setErro("Não foi possível acessar a câmera. Verifique a permissão do navegador.");
      parar();
    }
  }, [onDetected, parar]);

  useEffect(() => () => parar(), [parar]);

  if (!suportado) {
    return (
      <p className="mt-3 text-xs text-muted">
        Leitura por câmera indisponível neste navegador — use o campo acima (funciona com leitores
        USB de QR, que digitam o código).
      </p>
    );
  }

  return (
    <div className="mt-4">
      {!ativo ? (
        <button type="button" onClick={() => void iniciar()} className="btn btn-outline">
          📷 Escanear com a câmera
        </button>
      ) : (
        <div className="space-y-2">
          <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg border-2 border-olive/40">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} playsInline muted className="w-full" />
            <div className="pointer-events-none absolute inset-6 rounded border-2 border-gold/70" />
          </div>
          <button type="button" onClick={parar} className="text-sm text-danger underline">
            Parar câmera
          </button>
        </div>
      )}
      {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
    </div>
  );
}
