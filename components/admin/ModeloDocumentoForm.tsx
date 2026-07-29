"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  restaurarModeloDocumento,
  salvarModeloDocumento,
  type ContratacaoState,
} from "@/app/actions/contratacao";
import {
  aplicarMarcadores,
  CORES_DISPONIVEIS,
  MARCADORES,
  MODELO_PADRAO,
  classesDestaque,
  type ModeloDocumento,
} from "@/domain/contratacao/modelo";

const initial: ContratacaoState = { ok: false, message: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-dark disabled:opacity-60">
      {pending ? "Salvando…" : "Salvar modelo"}
    </button>
  );
}

/** Campo de texto com padrão como placeholder — vazio volta ao padrão. */
function Texto({
  name,
  label,
  valor,
  onChange,
  linhas = 1,
}: {
  name: keyof ModeloDocumento;
  label: string;
  valor: string;
  onChange: (v: string) => void;
  linhas?: number;
}) {
  const padrao = String(MODELO_PADRAO[name] ?? "");
  const props = {
    id: `md-${name}`,
    name,
    value: valor,
    placeholder: padrao,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    className: "field-input text-sm",
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`md-${name}`} className="field-label">{label}</label>
      {linhas > 1 ? <textarea {...props} rows={linhas} /> : <input {...props} />}
    </div>
  );
}

function Bloco({
  name,
  label,
  ativo,
  onChange,
}: {
  name: keyof ModeloDocumento;
  label: string;
  ativo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <input type="checkbox" name={name} checked={ativo} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/**
 * Editor do modelo do documento. Os dados continuam vindo do sistema — aqui se
 * ajustam textos, quais blocos aparecem e a cor de destaque, com prévia ao vivo
 * dos marcadores já substituídos por dados de exemplo.
 */
export function ModeloDocumentoForm({
  modelo,
  exemploHref,
}: {
  modelo: ModeloDocumento;
  exemploHref: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction] = useFormState(salvarModeloDocumento, initial);
  const [m, setM] = useState(modelo);

  const set = <K extends keyof ModeloDocumento>(chave: K, valor: ModeloDocumento[K]) =>
    setM((p) => ({ ...p, [chave]: valor }));

  // Dados de exemplo só para a prévia — o documento real usa os dados de verdade.
  const vars = {
    noivos: "Helena & Guilherme",
    noiva: "Helena",
    noivo: "Guilherme",
    data: "29 de maio de 2027",
    local: "Itabira — Minas Gerais",
    numero: "AC-2026-0001",
    emissao: "29/07/2026",
    fornecedor: "Estúdio Luz",
    objeto: "Fotógrafo",
    valor: "R$ 5.403,00",
  };
  const previa = (campo: keyof ModeloDocumento) => {
    const v = m[campo];
    const base = typeof v === "string" && v.trim() !== "" ? v : String(MODELO_PADRAO[campo] ?? "");
    return aplicarMarcadores(base, vars);
  };
  const cor = classesDestaque(m.cor_destaque);

  if (!aberto) {
    return (
      <div className="flex flex-wrap items-center gap-3 p-6">
        <button type="button" onClick={() => setAberto(true)} className="text-sm text-olive underline">
          editar modelo do documento
        </button>
        <span className="text-xs text-muted">
          Textos, blocos visíveis e cor de destaque do PDF enviado ao fornecedor.
        </span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setAberto(false)} className="text-sm text-olive underline">
          fechar
        </button>
        {exemploHref && (
          <Link href={exemploHref} className="text-sm text-olive underline">
            ver documento completo
          </Link>
        )}
        <form action={restaurarModeloDocumento} onSubmit={(e) => {
          if (!confirm("Restaurar todos os textos e blocos do documento ao padrão?")) e.preventDefault();
        }}>
          <button type="submit" className="text-sm text-danger underline">restaurar padrão</button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form action={formAction} className="grid gap-5">
          <fieldset className="grid gap-3">
            <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Cabeçalho</legend>
            <Texto name="cabecalho_titulo" label="Título do cabeçalho" valor={m.cabecalho_titulo ?? ""} onChange={(v) => set("cabecalho_titulo", v)} />
            <Texto name="cabecalho_legenda" label="Legenda (data e local)" valor={m.cabecalho_legenda ?? ""} onChange={(v) => set("cabecalho_legenda", v)} />
            <Texto name="titulo" label="Título do documento" valor={m.titulo ?? ""} onChange={(v) => set("titulo", v)} />
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Rótulos das seções</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Texto name="rotulo_contratantes" label="Seção 1" valor={m.rotulo_contratantes ?? ""} onChange={(v) => set("rotulo_contratantes", v)} />
              <Texto name="rotulo_contratado" label="Seção 2" valor={m.rotulo_contratado ?? ""} onChange={(v) => set("rotulo_contratado", v)} />
              <Texto name="rotulo_objeto" label="Seção 3" valor={m.rotulo_objeto ?? ""} onChange={(v) => set("rotulo_objeto", v)} />
              <Texto name="rotulo_pagamento" label="Seção 4" valor={m.rotulo_pagamento ?? ""} onChange={(v) => set("rotulo_pagamento", v)} />
              <Texto name="rotulo_nota_fiscal" label="Seção 5" valor={m.rotulo_nota_fiscal ?? ""} onChange={(v) => set("rotulo_nota_fiscal", v)} />
              <Texto name="rotulo_observacoes" label="Seção 6" valor={m.rotulo_observacoes ?? ""} onChange={(v) => set("rotulo_observacoes", v)} />
            </div>
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Fechamento</legend>
            <Texto name="declaracao" label="Declaração final" valor={m.declaracao ?? ""} onChange={(v) => set("declaracao", v)} linhas={4} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Texto name="assinatura_1" label="Assinatura da esquerda" valor={m.assinatura_1 ?? ""} onChange={(v) => set("assinatura_1", v)} />
              <Texto name="assinatura_2" label="Assinatura da direita" valor={m.assinatura_2 ?? ""} onChange={(v) => set("assinatura_2", v)} />
            </div>
            <Texto name="rodape" label="Rodapé" valor={m.rodape ?? ""} onChange={(v) => set("rodape", v)} />
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Blocos do documento</legend>
            <Bloco name="mostrar_monograma" label="Monograma do casamento no topo" ativo={m.mostrar_monograma} onChange={(v) => set("mostrar_monograma", v)} />
            <Bloco name="mostrar_evento" label="Faixa com data, cerimônia e recepção" ativo={m.mostrar_evento} onChange={(v) => set("mostrar_evento", v)} />
            <Bloco name="mostrar_objeto" label="Objeto e escopo contratado" ativo={m.mostrar_objeto} onChange={(v) => set("mostrar_objeto", v)} />
            <Bloco name="mostrar_nota_fiscal" label="Seção de nota fiscal" ativo={m.mostrar_nota_fiscal} onChange={(v) => set("mostrar_nota_fiscal", v)} />
            <Bloco name="mostrar_declaracao" label="Declaração final" ativo={m.mostrar_declaracao} onChange={(v) => set("mostrar_declaracao", v)} />
            <Bloco name="mostrar_assinaturas" label="Linhas de assinatura" ativo={m.mostrar_assinaturas} onChange={(v) => set("mostrar_assinaturas", v)} />
            <Bloco name="mostrar_rodape" label="Rodapé" ativo={m.mostrar_rodape} onChange={(v) => set("mostrar_rodape", v)} />
            <p className="text-xs text-muted">
              A tabela de pagamento e os dados dos contratantes são obrigatórios — sem eles o
              documento não formaliza nada.
            </p>
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Cor de destaque</legend>
            <div className="flex flex-wrap gap-4">
              {CORES_DISPONIVEIS.map((c) => (
                <label key={c.valor} className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="radio"
                    name="cor_destaque"
                    value={c.valor}
                    checked={m.cor_destaque === c.valor}
                    onChange={() => set("cor_destaque", c.valor)}
                  />
                  {c.nome}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <Submit />
            {state.message && (
              <span className={`text-sm ${state.ok ? "text-olive" : "text-danger"}`}>{state.message}</span>
            )}
          </div>
        </form>

        {/* Prévia — mostra os textos já com os marcadores resolvidos */}
        <div className="grid gap-4 self-start">
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <div className={`border-b-2 bg-sand px-6 py-5 text-center ${cor.borda}`}>
              {m.mostrar_monograma && (
                <div className="mx-auto mb-2 h-8 w-8 rounded-full border border-line bg-white text-center font-serif text-sm leading-8 text-moss">
                  H&amp;G
                </div>
              )}
              <p className="font-serif text-lg leading-tight text-moss-deep">{previa("cabecalho_titulo")}</p>
              {m.mostrar_evento && (
                <p className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${cor.texto}`}>
                  {previa("cabecalho_legenda")}
                </p>
              )}
            </div>
            <div className="border-b border-line bg-cream px-6 py-3">
              <p className="font-serif text-sm leading-snug text-moss-deep">{previa("titulo")}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">AC-2026-0001 · 29/07/2026</p>
            </div>
            <div className="space-y-2.5 px-6 py-4 text-[11px]">
              {[
                previa("rotulo_contratantes"),
                previa("rotulo_contratado"),
                ...(m.mostrar_objeto ? [previa("rotulo_objeto")] : []),
                previa("rotulo_pagamento"),
                ...(m.mostrar_nota_fiscal ? [previa("rotulo_nota_fiscal")] : []),
                previa("rotulo_observacoes"),
              ].map((r, i) => (
                <p key={i} className="flex items-center gap-2">
                  <span className={`font-serif text-xs ${cor.texto}`}>{i + 1}</span>
                  <span className="uppercase tracking-[0.12em] text-moss">{r}</span>
                  <span className="h-px flex-1 bg-line" />
                </p>
              ))}
              {m.mostrar_declaracao && (
                <p className={`border-l-[3px] px-3 py-2 leading-relaxed text-ink ${cor.borda} ${cor.fundoSuave}`}>
                  {previa("declaracao")}
                </p>
              )}
              {m.mostrar_assinaturas && (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {[previa("assinatura_1"), previa("assinatura_2")].map((a, i) => (
                    <div key={i} className="text-center">
                      <div className="border-t border-ink/40" />
                      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted">{a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {m.mostrar_rodape && (
              <p className="border-t border-line bg-sand px-6 py-2 text-center text-[9px] uppercase tracking-[0.14em] text-muted">
                {previa("rodape")}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-line bg-ivory p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Marcadores que você pode usar nos textos
            </p>
            <ul className="grid gap-1 text-xs text-muted">
              {MARCADORES.map((mk) => (
                <li key={mk.chave}>
                  <code className="rounded bg-cream px-1 py-0.5 text-[11px] text-moss">{mk.chave}</code>{" "}
                  {mk.descricao}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Campo deixado em branco volta ao texto padrão. A prévia acima usa dados de exemplo — o
              documento real puxa os dados do casamento e do fornecedor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
