"use client";

import { useCallback, useEffect, useState } from "react";
import { registrarCheckin, type CheckinEntry } from "@/app/actions/checkin";

const CACHE_KEY = "hg_checkin_cache_v1";
const QUEUE_KEY = "hg_checkin_queue_v1";

type Cache = Record<string, { nome: string; chegou: boolean }>;
type QueueItem = { token: string; ts: string };

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function CheckinOffline({ initial }: { initial: CheckinEntry[] }) {
  const [cache, setCache] = useState<Cache>({});
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [online, setOnline] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Sincroniza a fila com o servidor (uma tentativa por item).
  const sync = useCallback(async (q: QueueItem[]) => {
    if (q.length === 0) return;
    const restante: QueueItem[] = [];
    for (const item of q) {
      try {
        const r = await registrarCheckin(item.token);
        if (!r.ok && r.message.includes("não encontrado")) continue; // descarta inválidos
        if (!r.ok && !r.message.includes("já fez")) restante.push(item);
      } catch {
        restante.push(item); // offline — mantém na fila
      }
    }
    setQueue(restante);
    writeJSON(QUEUE_KEY, restante);
  }, []);

  // Inicialização: monta o cache (lista do servidor tem prioridade quando online).
  useEffect(() => {
    const local = readJSON<Cache>(CACHE_KEY, {});
    const base: Cache = { ...local };
    for (const g of initial) base[g.token] = { nome: g.nome, chegou: g.chegou || base[g.token]?.chegou || false };
    setCache(base);
    writeJSON(CACHE_KEY, base);

    const q = readJSON<QueueItem[]>(QUEUE_KEY, []);
    setQueue(q);

    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      setQueue((cur) => {
        void sync(cur);
        return cur;
      });
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    if (navigator.onLine && q.length) void sync(q);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [initial, sync]);

  function checkIn(e: React.FormEvent) {
    e.preventDefault();
    const token = codigo.trim();
    if (!token) return;
    setCodigo("");

    const entry = cache[token];
    if (!entry) {
      setMsg({ ok: false, text: "Código não encontrado na lista." });
      return;
    }
    if (entry.chegou) {
      setMsg({ ok: false, text: `${entry.nome} já fez check-in.` });
      return;
    }

    const novoCache: Cache = { ...cache, [token]: { ...entry, chegou: true } };
    setCache(novoCache);
    writeJSON(CACHE_KEY, novoCache);

    const novaFila = [...queue, { token, ts: new Date().toISOString() }];
    setQueue(novaFila);
    writeJSON(QUEUE_KEY, novaFila);

    setMsg({ ok: true, text: `✓ Bem-vindo(a), ${entry.nome}!` });
    if (navigator.onLine) void sync(novaFila);
  }

  const chegados = Object.values(cache).filter((c) => c.chegou).length;
  const totalLista = Object.keys(cache).length;

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-4 flex items-center justify-center gap-3 text-xs uppercase tracking-wide">
        <span className={`rounded-full px-3 py-1 ${online ? "bg-[#e6efe0] text-success" : "bg-[#f4e2dc] text-danger"}`}>
          {online ? "● Online" : "○ Offline"}
        </span>
        <span className="rounded-full bg-cream px-3 py-1 text-muted">{chegados}/{totalLista} presentes</span>
        {queue.length > 0 && (
          <span className="rounded-full bg-[#f6ecd6] px-3 py-1 text-warn">{queue.length} a sincronizar</span>
        )}
      </div>

      <form onSubmit={checkIn} className="rounded-lg bg-white p-10 shadow-card">
        <p className="mb-4 text-muted">Aponte o QR Code do convidado ou digite o código:</p>
        <input
          autoFocus
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código do convidado"
          className="w-full rounded border border-line px-4 py-4 text-center text-lg focus:border-olive focus:outline-none focus:ring-4 focus:ring-olive/15"
        />
        <button type="submit" className="btn btn-dark mt-4">Registrar chegada</button>
        {msg && (
          <p className={`mt-5 font-serif text-2xl ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>
        )}
      </form>

      {queue.length > 0 && online && (
        <button onClick={() => void sync(queue)} className="mt-4 text-sm text-olive underline">
          Sincronizar {queue.length} pendente(s) agora
        </button>
      )}
      <p className="mt-4 text-sm text-muted">
        Funciona <strong>offline</strong>: a lista fica no aparelho e as chegadas entram numa fila que
        sincroniza sozinha ao voltar a conexão.
      </p>
    </div>
  );
}
