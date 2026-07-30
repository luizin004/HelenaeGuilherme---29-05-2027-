/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentoActions } from "@/components/admin/DocumentoActions";
import { EscopoContratoForm } from "@/components/admin/EscopoContratoForm";
import { emitirAutorizacao } from "@/app/actions/contratacao";
import { getAutorizacao, getModeloDocumento } from "@/lib/admin-data";
import { classesDestaque, textoDoModelo } from "@/domain/contratacao/modelo";
import { getSettings, getVenues, resolveCouple } from "@/lib/data";
import { formatCents, sumCents } from "@/domain/money";
import { fmtDateBR, hojeISO } from "@/lib/format";
import { WEDDING } from "@/lib/constants";
import {
  destinatarioNotaFiscal,
  linhaContratantes,
  linhaEndereco,
  montarTextoAutorizacao,
  numeroAutorizacao,
  resumoPagamento,
  type AutorizacaoInput,
} from "@/domain/contratacao/autorizacao";

export const dynamic = "force-dynamic";

/** Título de seção: numeral na cor de destaque + rótulo em versalete. */
function Secao({
  n,
  titulo,
  corTexto,
  children,
}: {
  n: number;
  titulo: string;
  corTexto: string;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-2.5 flex items-center gap-2.5">
        <span className={`font-serif text-base leading-none ${corTexto}`}>{n}</span>
        <span className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-moss">{titulo}</span>
        <span className="h-px flex-1 bg-line" />
      </h2>
      {children}
    </section>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <p className="text-[13px] leading-relaxed">
      <span className="text-muted">{rotulo}: </span>
      <span className="text-ink">{valor}</span>
    </p>
  );
}

export default async function AutorizacaoPage({ params }: { params: { id: string } }) {
  const [dados, settings, venues, modelo] = await Promise.all([
    getAutorizacao(params.id),
    getSettings(),
    getVenues(),
    getModeloDocumento(),
  ]);
  if (!dados) notFound();

  const { contrato, fornecedor, dados: cfg, parcelas, incluiCotacao, categoria, exigeNotaFiscal } = dados;
  const couple = resolveCouple(settings);
  const dataEvento = new Date(couple.dataISO).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WEDDING.timezone,
  });
  const cerimonia = venues.find((v) => v.tipo === "cerimonia") ?? null;
  const recepcao = venues.find((v) => v.tipo === "recepcao") ?? null;
  const horaCerimonia =
    cerimonia?.horario ??
    new Date(couple.dataISO).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: WEDDING.timezone,
    });

  const valorCents = Math.round(Number(contrato.valor) * 100);
  const parcelasOrdenadas = parcelas.slice().sort((a, b) => a.numero - b.numero);
  const somaParcelas = sumCents(parcelasOrdenadas.map((p) => p.valor_cents));
  const divergeTotal = parcelasOrdenadas.length > 0 && somaParcelas !== valorCents;

  const input: AutorizacaoInput = {
    seq: contrato.autorizacao_seq,
    emitidaEm: contrato.autorizacao_emitida_em,
    hoje: hojeISO(),
    titulo: contrato.titulo,
    categoria,
    valorCents,
    escopo: contrato.escopo ?? incluiCotacao,
    observacoes: contrato.observacoes,
    fornecedor: fornecedor
      ? {
          nome: fornecedor.nome,
          documento: fornecedor.documento,
          contato: fornecedor.contato_nome,
          telefone: fornecedor.telefone,
          email: fornecedor.email,
          endereco: fornecedor.endereco,
        }
      : null,
    contratantes: {
      nome: cfg.contratante_nome,
      documento: cfg.contratante_documento,
      nome2: cfg.contratante2_nome,
      documento2: cfg.contratante2_documento,
      email: cfg.contratante_email,
      telefone: cfg.contratante_telefone,
      endereco: cfg.endereco,
      cidade: cfg.cidade,
      uf: cfg.uf,
      cep: cfg.cep,
    },
    notaFiscal: {
      destinatario: cfg.nf_destinatario,
      documento: cfg.nf_documento,
      ie: cfg.nf_ie,
      im: cfg.nf_im,
      endereco: cfg.nf_endereco,
      email: cfg.nf_email,
      observacoes: cfg.nf_observacoes,
    },
    condicoesGerais: cfg.condicoes_gerais,
    exigeNotaFiscal,
    evento: {
      data: `${dataEvento}, às ${horaCerimonia}`,
      local: [cerimonia?.nome, recepcao?.nome, WEDDING.cidade].filter(Boolean).join(" · "),
    },
    parcelas: parcelasOrdenadas.map((p) => ({ numero: p.numero, valor_cents: p.valor_cents, vencimento: p.vencimento })),
  };

  const numero = numeroAutorizacao(input.seq, input.emitidaEm);
  const emitida = input.seq !== null;
  const nf = destinatarioNotaFiscal(input);
  const texto = montarTextoAutorizacao(input);
  const emissaoISO = contrato.autorizacao_emitida_em ? contrato.autorizacao_emitida_em.slice(0, 10) : hojeISO();
  const contatoFornecedor = [fornecedor?.contato_nome, fornecedor?.telefone, fornecedor?.email]
    .filter(Boolean)
    .join(" · ");

  // Modelo editável: textos com marcadores + blocos visíveis + cor de destaque.
  const cor = classesDestaque(modelo.cor_destaque);
  const vars = {
    noivos: `${couple.noiva} & ${couple.noivo}`,
    noiva: couple.noiva,
    noivo: couple.noivo,
    data: dataEvento,
    local: WEDDING.cidade,
    numero,
    emissao: fmtDateBR(emissaoISO),
    fornecedor: fornecedor?.nome ?? "—",
    objeto: contrato.titulo,
    valor: formatCents(valorCents),
  };
  const txt = (campo: Parameters<typeof textoDoModelo>[1]) => textoDoModelo(modelo, campo, vars);
  // Numeração das seções acompanha os blocos ligados/desligados.
  let seq = 0;
  const proximo = () => ++seq;

  return (
    <>
      {/* Papel A4 e cores de fundo preservadas no PDF (o padrão do navegador é descartá-las). */}
      <style>{`
        @page { size: A4; margin: 14mm 12mm; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Barra de trabalho — não sai no PDF */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/contratos" className="text-sm text-olive underline">
          ← voltar para Contratos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <form action={emitirAutorizacao}>
            <input type="hidden" name="id" value={contrato.id} />
            <button type="submit" className={`px-4 py-1.5 text-xs ${emitida ? "text-olive underline" : "btn btn-dark"}`}>
              {emitida ? "reemitir (atualiza a data)" : "Emitir e numerar"}
            </button>
          </form>
          <DocumentoActions texto={texto} />
        </div>
      </div>

      {!emitida && (
        <div className="mb-4 rounded-lg bg-gold-soft px-5 py-4 text-sm text-moss print:hidden">
          Este documento ainda é um <strong>rascunho</strong>. Confira os dados e clique em
          &quot;Emitir e numerar&quot; para gerar o número oficial antes de enviar ao fornecedor.
        </div>
      )}

      {divergeTotal && (
        <div className="mb-4 rounded-lg bg-[#f4e2dc] px-5 py-4 text-sm text-danger print:hidden">
          As parcelas somam {formatCents(somaParcelas)}, diferente do valor do contrato (
          {formatCents(valorCents)}). Ajuste no Financeiro antes de enviar.
        </div>
      )}

      <div className="mb-6 print:hidden">
        <EscopoContratoForm
          id={contrato.id}
          escopo={contrato.escopo}
          observacoes={contrato.observacoes}
          sugestao={incluiCotacao}
        />
      </div>

      {/* ------------------------------ DOCUMENTO ------------------------------ */}
      <article className="mx-auto max-w-[820px] overflow-hidden rounded-lg bg-white shadow-card print:max-w-none print:rounded-none print:shadow-none">
        {/* Cabeçalho: monograma, nomes e data — identidade do casamento */}
        <header className={`border-b-2 bg-sand px-12 py-9 text-center print:px-8 print:py-6 ${cor.borda}`}>
          {modelo.mostrar_monograma && (
            <img
              src="/logo.png"
              alt="Monograma Helena e Guilherme"
              className="mx-auto h-16 w-auto object-contain print:h-14"
            />
          )}
          <p className="mt-3 font-serif text-[26px] leading-tight text-moss-deep">{txt("cabecalho_titulo")}</p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-olive">{txt("cabecalho_legenda")}</p>
        </header>

        {/* Faixa do documento */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line bg-cream px-12 py-4 print:px-8 print:py-3">
          <h1 className="font-serif text-xl leading-snug text-moss-deep">{txt("titulo")}</h1>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            {numero} · {fmtDateBR(emissaoISO)}
          </p>
        </div>

        {/* Dados do evento */}
        {modelo.mostrar_evento && (
          <div className="grid gap-4 border-b border-line px-12 py-5 sm:grid-cols-3 print:px-8 print:py-4">
            {[
              { r: "Data", v: dataEvento },
              {
                r: "Cerimônia",
                v: cerimonia ? `${cerimonia.nome} · ${horaCerimonia}` : `${horaCerimonia}`,
              },
              { r: "Recepção", v: recepcao ? `${recepcao.nome} — ${recepcao.cidade}` : WEDDING.cidade },
            ].map((c) => (
              <div key={c.r}>
                <p className={`text-[10px] uppercase tracking-[0.16em] ${cor.texto}`}>{c.r}</p>
                <p className="mt-1 text-[13px] leading-snug text-ink">{c.v}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-6 px-12 py-8 print:px-8 print:py-6">
          <Secao n={proximo()} titulo={txt("rotulo_contratantes")} corTexto={cor.texto}>
            <Linha rotulo="Nome" valor={linhaContratantes(input.contratantes)} />
            <Linha rotulo="Endereço" valor={linhaEndereco(input.contratantes)} />
            {cfg.contratante_email && <Linha rotulo="E-mail" valor={cfg.contratante_email} />}
            {cfg.contratante_telefone && <Linha rotulo="Telefone" valor={cfg.contratante_telefone} />}
          </Secao>

          <Secao n={proximo()} titulo={txt("rotulo_contratado")} corTexto={cor.texto}>
            <Linha rotulo="Nome" valor={fornecedor?.nome ?? "— fornecedor não vinculado —"} />
            {fornecedor?.documento && <Linha rotulo="CNPJ / CPF" valor={fornecedor.documento} />}
            {fornecedor?.endereco && <Linha rotulo="Endereço" valor={fornecedor.endereco} />}
            {contatoFornecedor && <Linha rotulo="Contato" valor={contatoFornecedor} />}
          </Secao>

          {modelo.mostrar_objeto && (
            <Secao n={proximo()} titulo={txt("rotulo_objeto")} corTexto={cor.texto}>
              <p className="font-serif text-lg leading-snug text-moss">
                {contrato.titulo}
                {categoria && <span className="ml-2 text-[13px] font-sans text-muted">({categoria})</span>}
              </p>
              {input.escopo ? (
                <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-ink">
                  {input.escopo.split("\n").filter(Boolean).map((l, i) => (
                    <li key={i} className="flex gap-2">
                      <span className={cor.texto}>·</span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[13px] text-muted">
                  Escopo não detalhado — descreva em &quot;editar escopo e observações&quot;.
                </p>
              )}
            </Secao>
          )}

          <Secao n={proximo()} titulo={txt("rotulo_pagamento")} corTexto={cor.texto}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-cream text-left">
                  <th className="border border-line px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-moss">
                    Parcela
                  </th>
                  <th className="border border-line px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-moss">
                    Vencimento
                  </th>
                  <th className="border border-line px-3 py-2 text-right text-[10px] font-medium uppercase tracking-[0.12em] text-moss">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {parcelasOrdenadas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="border border-line px-3 py-3 text-center text-muted">
                      Condição de pagamento a definir entre as partes.
                    </td>
                  </tr>
                )}
                {parcelasOrdenadas.map((p) => (
                  <tr key={p.id}>
                    <td className="border border-line px-3 py-2">{p.numero}ª parcela</td>
                    <td className="border border-line px-3 py-2">
                      {p.vencimento ? fmtDateBR(p.vencimento) : "a combinar"}
                    </td>
                    <td className="border border-line px-3 py-2 text-right tabular-nums">
                      {formatCents(p.valor_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={cor.fundoSuave}>
                  <td colSpan={2} className="border border-line px-3 py-2.5 font-medium uppercase tracking-wide text-moss-deep">
                    Valor total aprovado
                  </td>
                  <td className="border border-line px-3 py-2.5 text-right font-serif text-lg text-moss-deep tabular-nums">
                    {formatCents(valorCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p className="mt-2 text-[12px] text-muted">{resumoPagamento(input.parcelas)}</p>
          </Secao>

          {modelo.mostrar_nota_fiscal && (
          <Secao n={proximo()} titulo={txt("rotulo_nota_fiscal")} corTexto={cor.texto}>
            {exigeNotaFiscal ? (
              <>
                <p className="mb-2 text-[13px] text-ink">
                  <strong>É obrigatória a emissão de nota fiscal</strong> para os dados abaixo.
                </p>
                <div className="rounded border border-line bg-ivory px-4 py-3">
                  <Linha rotulo="Destinatário" valor={nf.nome} />
                  <Linha rotulo="CNPJ / CPF" valor={nf.documento} />
                  {cfg.nf_ie && <Linha rotulo="Inscrição estadual" valor={cfg.nf_ie} />}
                  {cfg.nf_im && <Linha rotulo="Inscrição municipal" valor={cfg.nf_im} />}
                  <Linha rotulo="Endereço" valor={nf.endereco} />
                  {cfg.nf_email && <Linha rotulo="Enviar a NF para" valor={cfg.nf_email} />}
                  {cfg.nf_observacoes && <p className="mt-1.5 text-[12px] text-muted">{cfg.nf_observacoes}</p>}
                </div>
              </>
            ) : (
              <p className="text-[13px] text-ink">
                Este item foi acordado <strong>sem emissão de nota fiscal</strong>. Recibo simples é
                suficiente para a nossa prestação de contas.
              </p>
            )}
          </Secao>
          )}

          {(contrato.observacoes || cfg.condicoes_gerais) && (
            <Secao n={proximo()} titulo={txt("rotulo_observacoes")} corTexto={cor.texto}>
              {contrato.observacoes && <p className="text-[13px] leading-relaxed">{contrato.observacoes}</p>}
              {cfg.condicoes_gerais && (
                <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-muted">
                  {cfg.condicoes_gerais}
                </p>
              )}
            </Secao>
          )}

          {modelo.mostrar_declaracao && (
            <div className={`break-inside-avoid rounded border-l-[3px] px-5 py-4 ${cor.borda} ${cor.fundoSuave}`}>
              <p className="text-[13px] leading-relaxed text-ink">{txt("declaracao")}</p>
            </div>
          )}

          {modelo.mostrar_assinaturas && (
            <div className="mt-10 grid gap-10 break-inside-avoid sm:grid-cols-2">
              {[
                { nome: cfg.contratante_nome || txt("assinatura_1"), papel: txt("assinatura_1") },
                { nome: fornecedor?.nome || txt("assinatura_2"), papel: txt("assinatura_2") },
              ].map((a, i) => (
                <div key={i} className="text-center">
                  <div className="border-t border-ink/40" />
                  <p className="mt-1.5 text-[12px] text-ink">{a.nome}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{a.papel}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {modelo.mostrar_rodape && (
          <footer className="border-t border-line bg-sand px-12 py-3 text-center text-[10px] uppercase tracking-[0.16em] text-muted print:px-8">
            {txt("rodape")}
          </footer>
        )}
      </article>
    </>
  );
}
