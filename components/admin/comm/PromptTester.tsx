"use client";

import { useState } from "react";
import { sanitizeContext } from "@/domain/comm/sanitize";
import { gerarRascunhosLocais } from "@/domain/comm/draft";
import { repeticaoArtificialDoNome } from "@/domain/comm/personalize";
import { salvarTestePrompt } from "@/app/actions/comm";

interface Props {
  promptId: string;
  versionId: string | null;
  contextoPermitido: string[];
  cta?: string | null;
  convidados: { id: string; nomeMascarado: string }[];
}

const FASES = [
  ["conexao", "Conexão"], ["rsvp", "RSVP / decisão"], ["planejamento", "Planejamento"],
  ["preparacao", "Preparação final"], ["agradecimento", "Pós-evento"],
] as const;

export function PromptTester({ promptId, versionId, contextoPermitido, cta, convidados }: Props) {
  const [nome, setNome] = useState("Carlos Eduardo");
  const [papel, setPapel] = useState("padrinho");
  const [cidade, setCidade] = useState("Belo Horizonte");
  const [fase, setFase] = useState("conexao");
  const [variacoes, setVariacoes] = useState<string[]>([]);
  const [enviado, setEnviado] = useState<Record<string, unknown> | null>(null);
  const [removido, setRemovido] = useState<string[]>([]);
  const [escolhida, setEscolhida] = useState<string>("");

  function gerar() {
    // Monta o contexto com um campo proibido de propósito para provar a remoção.
    const dados: Record<string, unknown> = {
      primeiro_nome: nome.trim().split(/\s+/)[0] ?? "",
      nome: nome.trim(),
      papel,
      cidade: cidade.trim(),
      fase_jornada: fase,
      valor_presente: 50000, // sempre proibido → deve ser removido
      observacoes_internas: "nota interna de teste", // sempre proibido
    };
    const s = sanitizeContext(dados, { permitido: contextoPermitido });
    setEnviado(s.enviado);
    setRemovido(s.removido);
    const v = gerarRascunhosLocais(
      { nome: nome.trim(), papel, cidade: cidade.trim(), fase, cta: cta ?? undefined },
      3,
    );
    setVariacoes(v);
    setEscolhida(v[0] ?? "");
  }

  return (
    <div className="grid gap-6 p-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="field-label">Convidado (fictício ou real mascarado)</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="field-input" />
          {convidados.length > 0 && (
            <select onChange={(e) => e.target.value && setNome(e.target.value)} defaultValue="" className="field-input mt-1 text-xs">
              <option value="">usar um convidado real (mascarado)…</option>
              {convidados.map((c) => <option key={c.id} value={c.nomeMascarado}>{c.nomeMascarado}</option>)}
            </select>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Papel</label>
          <select value={papel} onChange={(e) => setPapel(e.target.value)} className="field-input">
            <option value="convidado">Convidado</option>
            <option value="padrinho">Padrinho</option>
            <option value="madrinha">Madrinha</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="field-label">Fase</label>
          <select value={fase} onChange={(e) => setFase(e.target.value)} className="field-input">
            {FASES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="field-label">Cidade</label>
          <input value={cidade} onChange={(e) => setCidade(e.target.value)} className="field-input" />
        </div>
      </div>

      <div>
        <button type="button" onClick={gerar} className="btn btn-dark">Gerar 3 variações</button>
        <p className="mt-2 text-xs text-muted">
          Prévia <strong>local (sem IA)</strong> para revisão — usa só os dados autorizados. Quando o provedor de IA
          for ligado, o mesmo contexto sanitizado é enviado a ele.
        </p>
      </div>

      {enviado && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-olive">Informações usadas pela IA</p>
            <ul className="space-y-1 text-sm text-moss">
              {Object.entries(enviado).map(([k, v]) => <li key={k}><strong>{k}:</strong> {String(v)}</li>)}
            </ul>
          </div>
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-danger">Removido por privacidade</p>
            <ul className="space-y-1 text-sm text-muted">
              {removido.length === 0 ? <li>—</li> : removido.map((k) => <li key={k}>{k}</li>)}
            </ul>
          </div>
        </div>
      )}

      {variacoes.length > 0 && (
        <div className="grid gap-3">
          {variacoes.map((v, i) => (
            <label key={i} className={`block cursor-pointer rounded-lg border p-4 ${escolhida === v ? "border-olive bg-cream" : "border-line bg-white"}`}>
              <div className="flex items-start gap-3">
                <input type="radio" name="escolha" checked={escolhida === v} onChange={() => setEscolhida(v)} className="mt-1" />
                <div>
                  <p className="text-sm text-moss">{v}</p>
                  <p className="mt-1 text-xs text-muted">
                    {v.length} caracteres · {repeticaoArtificialDoNome(v, nome) ? "⚠️ nome repetido" : "nome natural ✓"}
                  </p>
                </div>
              </div>
            </label>
          ))}

          <form action={salvarTestePrompt} className="mt-2 flex flex-wrap items-center gap-4 rounded-lg border border-line p-4">
            <input type="hidden" name="prompt_id" value={promptId} />
            <input type="hidden" name="prompt_version_id" value={versionId ?? ""} />
            <input type="hidden" name="entrada" value={JSON.stringify({ nome, papel, cidade, fase })} />
            <input type="hidden" name="contexto_enviado" value={JSON.stringify(enviado ?? {})} />
            <input type="hidden" name="contexto_removido" value={JSON.stringify(removido)} />
            <input type="hidden" name="saida" value={escolhida} />
            <span className="text-sm text-muted">Avaliação:</span>
            {["pessoal", "natural", "correto"].map((c) => (
              <label key={c} className="flex items-center gap-1 text-sm text-muted"><input type="checkbox" name={`av_${c}`} /> {c}</label>
            ))}
            <input type="hidden" name="avaliacao" value={JSON.stringify({ salvo_como_exemplo: true })} />
            <button type="submit" disabled={!versionId} className="btn btn-outline disabled:opacity-50">Salvar como exemplo</button>
          </form>
        </div>
      )}
    </div>
  );
}
