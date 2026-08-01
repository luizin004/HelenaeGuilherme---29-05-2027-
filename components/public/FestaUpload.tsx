"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_ARQUIVOS,
  caminhoPendente,
  mensagemAgradecimento,
  triarLote,
  type ArquivoRecusado,
} from "@/domain/festa/album";

const BUCKET = "hg-festa";

interface Selecionada {
  file: File;
  preview: string;
}

/** id de pasta para agrupar os arquivos deste envio. */
function novoLote(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `l${Date.now()}${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Envio colaborativo de fotos da festa.
 *
 * O arquivo sobe direto do celular para um bucket privado (área de moderação)
 * e só depois o registro é criado por RPC. Nada aparece no site antes de os
 * noivos aprovarem — e o contato informado nunca é exibido publicamente.
 */
export function FestaUpload({ agradecimento }: { agradecimento?: string | null }) {
  const [fotos, setFotos] = useState<Selecionada[]>([]);
  const [recusadas, setRecusadas] = useState<ArquivoRecusado[]>([]);
  const [autor, setAutor] = useState("");
  const [contato, setContato] = useState("");
  const [legenda, setLegenda] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Libera as URLs de preview quando o componente sai de cena.
  useEffect(() => () => fotos.forEach((f) => URL.revokeObjectURL(f.preview)), [fotos]);

  function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const escolhidos = Array.from(e.target.files ?? []);
    if (escolhidos.length === 0) return;

    const { aceitos, recusados } = triarLote(
      escolhidos.map((f) => ({ nome: f.name, tipo: f.type, tamanho: f.size })),
      fotos.length,
    );
    const aceitosSet = new Set(aceitos.map((a) => a.nome));
    const novos = escolhidos
      .filter((f) => aceitosSet.has(f.name))
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));

    setFotos((atual) => [...atual, ...novos]);
    setRecusadas(recusados);
    setErro("");
    e.target.value = "";
  }

  function remover(indice: number) {
    setFotos((atual) => {
      const alvo = atual[indice];
      if (alvo) URL.revokeObjectURL(alvo.preview);
      return atual.filter((_, i) => i !== indice);
    });
  }

  function recomecar() {
    setFotos([]);
    setRecusadas([]);
    setLegenda("");
    setSucesso(null);
    setProgresso(0);
    setErro("");
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fotos.length === 0) {
      setErro("Escolha pelo menos uma foto. 📷");
      return;
    }
    if (!autor.trim()) {
      setErro("Conta pra gente quem tirou essas fotos.");
      return;
    }
    if (!autorizado) {
      setErro("Precisamos da sua autorização para publicar as fotos na galeria.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setErro("Envio indisponível no momento. Tente de novo em instantes.");
      return;
    }

    setEnviando(true);
    setErro("");
    setProgresso(0);

    const lote = novoLote();
    const enviados: { path: string; mime: string; tamanho: number }[] = [];

    for (let i = 0; i < fotos.length; i++) {
      const { file } = fotos[i];
      const path = caminhoPendente(lote, i, file.name);
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (error) {
        setEnviando(false);
        setErro(
          enviados.length > 0
            ? `Conseguimos guardar ${enviados.length} de ${fotos.length}. Tente enviar o resto de novo.`
            : "Não conseguimos enviar as fotos. Confira sua conexão e tente de novo.",
        );
        return;
      }
      enviados.push({ path, mime: file.type, tamanho: file.size });
      setProgresso(i + 1);
    }

    const { error: rpcError } = await supabase.rpc("hg_festa_enviar", {
      p_autor: autor.trim(),
      p_contato: contato.trim() || null,
      p_legenda: legenda.trim() || null,
      p_arquivos: enviados,
    });

    setEnviando(false);
    if (rpcError) {
      setErro("As fotos subiram, mas não conseguimos registrar seu envio. Fale com os noivos, por favor.");
      return;
    }

    fotos.forEach((f) => URL.revokeObjectURL(f.preview));
    setFotos([]);
    setRecusadas([]);
    setLegenda("");
    setSucesso(agradecimento?.trim() || mensagemAgradecimento(autor, enviados.length));
  }

  if (sucesso) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-card">
        <p className="mb-3 text-4xl" aria-hidden="true">
          💛
        </p>
        <p className="mb-6 font-serif text-2xl leading-snug text-moss">{sucesso}</p>
        <button type="button" onClick={recomecar} className="btn btn-dark">
          Enviar mais fotos
        </button>
      </div>
    );
  }

  const restantes = MAX_ARQUIVOS - fotos.length;

  return (
    <form onSubmit={enviar} className="grid gap-6 rounded-xl bg-white p-6 shadow-card sm:p-8">
      {/* 1. As fotos */}
      <div className="grid gap-3">
        <span className="field-label">Suas fotos</span>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={restantes <= 0 || enviando}
          className="flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-gold/60 bg-gold-soft/30 px-6 py-8 text-center transition hover:border-gold hover:bg-gold-soft/60 disabled:opacity-50"
        >
          <span className="text-3xl" aria-hidden="true">
            📷
          </span>
          <span className="font-serif text-lg text-moss">
            {fotos.length === 0 ? "Escolher fotos" : "Adicionar mais fotos"}
          </span>
          <span className="text-xs text-muted">
            {restantes > 0
              ? `Pode escolher várias de uma vez — até ${restantes} ${restantes === 1 ? "foto" : "fotos"}`
              : "Você chegou ao limite deste envio"}
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={escolher}
          className="hidden"
          aria-label="Escolher fotos da festa"
        />

        {fotos.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {fotos.map((f, i) => (
                <figure key={`${f.file.name}-${i}`} className="relative aspect-square overflow-hidden rounded-lg bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.preview} alt={f.file.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => remover(i)}
                    disabled={enviando}
                    aria-label={`Remover ${f.file.name}`}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-moss-deep/85 text-sm text-white transition hover:bg-danger disabled:opacity-40"
                  >
                    ×
                  </button>
                </figure>
              ))}
            </div>
            <p className="text-xs text-muted">
              {fotos.length} {fotos.length === 1 ? "foto selecionada" : "fotos selecionadas"} · toque no × para tirar
              alguma da lista
            </p>
          </>
        )}

        {recusadas.length > 0 && (
          <ul className="grid gap-1 rounded-lg bg-cream px-3 py-2 text-xs text-muted">
            {recusadas.map((r) => (
              <li key={r.nome}>
                <strong className="text-moss">{r.nome}</strong>: {r.motivo}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 2. Quem tirou */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="festa-autor" className="field-label">
            Seu nome <span className="text-danger">*</span>
          </label>
          <input
            id="festa-autor"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            required
            maxLength={80}
            placeholder="Como você quer aparecer no crédito"
            className="field-input"
          />
          <span className="text-xs text-muted">Vai junto da foto na galeria: &ldquo;foto de {autor.trim() || "você"}&rdquo;.</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="festa-contato" className="field-label">
            WhatsApp ou e-mail (opcional)
          </label>
          <input
            id="festa-contato"
            value={contato}
            onChange={(e) => setContato(e.target.value)}
            maxLength={120}
            placeholder="Para a gente agradecer"
            className="field-input"
          />
          <span className="text-xs text-muted">Fica só com a gente — nunca aparece no site. 🔒</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="festa-legenda" className="field-label">
          Conta o momento (opcional)
        </label>
        <textarea
          id="festa-legenda"
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="Ex.: a hora do buquê, a mesa rindo, o pai chorando…"
          className="field-input"
        />
      </div>

      {/* 3. Autorização */}
      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-ivory p-3 text-sm text-muted">
        <input
          type="checkbox"
          checked={autorizado}
          onChange={(e) => setAutorizado(e.target.checked)}
          className="mt-1"
        />
        <span>
          Autorizo a Helena e o Guilherme a publicarem estas fotos na galeria do site do casamento, com o crédito no
          meu nome.
        </span>
      </label>

      {erro && (
        <p role="alert" className="rounded-lg bg-[#f4e2dc] px-3 py-2 text-sm text-danger">
          {erro}
        </p>
      )}

      <div className="grid gap-2">
        <button type="submit" disabled={enviando} className="btn btn-dark disabled:opacity-60">
          {enviando ? "Estamos guardando suas lembranças…" : "Compartilhar lembranças"}
        </button>
        {enviando && fotos.length > 0 && (
          <>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-cream"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={fotos.length}
              aria-valuenow={progresso}
              aria-label="Envio das fotos"
            >
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${Math.round((progresso / fotos.length) * 100)}%` }}
              />
            </div>
            <p className="text-center text-xs text-muted">
              {progresso} de {fotos.length} — não feche a página. 💛
            </p>
          </>
        )}
      </div>
    </form>
  );
}
