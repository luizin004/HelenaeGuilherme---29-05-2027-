import Link from "next/link";
import { notFound } from "next/navigation";
import { AutorizacaoActions } from "@/components/admin/AutorizacaoActions";
import { EscopoContratoForm } from "@/components/admin/EscopoContratoForm";
import { emitirAutorizacao } from "@/app/actions/contratacao";
import { getAutorizacao } from "@/lib/admin-data";
import { getSettings, resolveCouple } from "@/lib/data";
import { formatCents } from "@/domain/money";
import { fmtDateBR, hojeISO } from "@/lib/format";
import { WEDDING } from "@/lib/constants";
import {
  destinatarioNotaFiscal,
  linhaContratantes,
  linhaEndereco,
  linhasPagamento,
  montarTextoAutorizacao,
  numeroAutorizacao,
  resumoPagamento,
  type AutorizacaoInput,
} from "@/domain/contratacao/autorizacao";

export const dynamic = "force-dynamic";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4">
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-olive">{titulo}</h2>
      {children}
    </section>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <p className="text-sm leading-relaxed">
      <span className="text-muted">{rotulo}: </span>
      <span className="text-ink">{valor}</span>
    </p>
  );
}

export default async function AutorizacaoPage({ params }: { params: { id: string } }) {
  const [dados, settings] = await Promise.all([getAutorizacao(params.id), getSettings()]);
  if (!dados) notFound();

  const { contrato, fornecedor, dados: cfg, parcelas, incluiCotacao, categoria } = dados;
  const couple = resolveCouple(settings);
  const dataEvento = new Date(couple.dataISO).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WEDDING.timezone,
  });

  const input: AutorizacaoInput = {
    seq: contrato.autorizacao_seq,
    emitidaEm: contrato.autorizacao_emitida_em,
    hoje: hojeISO(),
    titulo: contrato.titulo,
    categoria,
    valorCents: Math.round(Number(contrato.valor) * 100),
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
    evento: { data: dataEvento, local: WEDDING.cidade },
    parcelas: parcelas.map((p) => ({ numero: p.numero, valor_cents: p.valor_cents, vencimento: p.vencimento })),
  };

  const numero = numeroAutorizacao(input.seq, input.emitidaEm);
  const emitida = input.seq !== null;
  const nf = destinatarioNotaFiscal(input);
  const texto = montarTextoAutorizacao(input);
  const contatoFornecedor = [fornecedor?.contato_nome, fornecedor?.telefone, fornecedor?.email]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {/* Barra de ações — não sai na impressão */}
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
          <AutorizacaoActions texto={texto} />
        </div>
      </div>

      {!emitida && (
        <div className="mb-6 rounded-lg bg-gold-soft px-5 py-4 text-sm text-moss print:hidden">
          Este documento ainda é um <strong>rascunho</strong>. Confira os dados e clique em
          &quot;Emitir e numerar&quot; para gerar o número oficial antes de enviar ao fornecedor.
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

      {/* Documento */}
      <article className="mx-auto max-w-3xl rounded-lg bg-white p-10 shadow-card print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="mb-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
            {couple.noiva} &amp; {couple.noivo} · {dataEvento}
          </p>
          <h1 className="mt-3 font-serif text-2xl leading-snug text-moss">
            Aprovação de orçamento e autorização de contratação
          </h1>
          <p className="mt-2 text-sm text-muted">
            Documento {numero} · emitido em{" "}
            {fmtDateBR(contrato.autorizacao_emitida_em ? contrato.autorizacao_emitida_em.slice(0, 10) : hojeISO())}
          </p>
        </header>

        <div className="grid gap-5">
          <Secao titulo="1. Contratantes">
            <Linha rotulo="Nome" valor={linhaContratantes(input.contratantes)} />
            <Linha rotulo="Endereço" valor={linhaEndereco(input.contratantes)} />
            {cfg.contratante_email && <Linha rotulo="E-mail" valor={cfg.contratante_email} />}
            {cfg.contratante_telefone && <Linha rotulo="Telefone" valor={cfg.contratante_telefone} />}
          </Secao>

          <Secao titulo="2. Contratado (fornecedor)">
            <Linha rotulo="Nome" valor={fornecedor?.nome ?? "— fornecedor não vinculado —"} />
            {fornecedor?.documento && <Linha rotulo="CNPJ / CPF" valor={fornecedor.documento} />}
            {fornecedor?.endereco && <Linha rotulo="Endereço" valor={fornecedor.endereco} />}
            {contatoFornecedor && <Linha rotulo="Contato" valor={contatoFornecedor} />}
          </Secao>

          <Secao titulo="3. Objeto">
            <Linha rotulo="Serviço / produto" valor={`${contrato.titulo}${categoria ? ` (${categoria})` : ""}`} />
            {input.escopo ? (
              <div className="mt-2">
                <p className="text-sm text-muted">Escopo aprovado:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
                  {input.escopo.split("\n").filter(Boolean).map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Escopo não detalhado — descreva em &quot;editar escopo e observações&quot;.
              </p>
            )}
          </Secao>

          <Secao titulo="4. Valor e condições de pagamento">
            <p className="font-serif text-2xl text-moss">{formatCents(input.valorCents)}</p>
            <p className="mt-1 text-sm text-ink">{resumoPagamento(input.parcelas)}</p>
            {input.parcelas.length > 0 && (
              <table className="mt-3 w-full border-collapse text-sm">
                <tbody>
                  {linhasPagamento(input.parcelas).map((l, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-1.5">{l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {input.parcelas.length === 0 && (
              <p className="mt-1 text-xs text-muted print:hidden">
                Gere as parcelas no Financeiro para que o cronograma apareça aqui.
              </p>
            )}
          </Secao>

          <Secao titulo="5. Dados para emissão da nota fiscal">
            <Linha rotulo="Destinatário" valor={nf.nome} />
            <Linha rotulo="CPF / CNPJ" valor={nf.documento} />
            <Linha rotulo="Endereço" valor={nf.endereco} />
            {cfg.nf_ie && <Linha rotulo="Inscrição estadual" valor={cfg.nf_ie} />}
            {cfg.nf_im && <Linha rotulo="Inscrição municipal" valor={cfg.nf_im} />}
            {cfg.nf_email && <Linha rotulo="Enviar a NF para" valor={cfg.nf_email} />}
            {cfg.nf_observacoes && <p className="mt-1 text-sm text-muted">{cfg.nf_observacoes}</p>}
          </Secao>

          <Secao titulo="6. Evento">
            <Linha rotulo="Data" valor={dataEvento} />
            <Linha rotulo="Local" valor={WEDDING.cidade} />
            {contrato.data_evento && <Linha rotulo="Data de execução do serviço" valor={fmtDateBR(contrato.data_evento)} />}
          </Secao>

          {(contrato.observacoes || cfg.condicoes_gerais) && (
            <Secao titulo="7. Observações e condições gerais">
              {contrato.observacoes && <p className="text-sm leading-relaxed">{contrato.observacoes}</p>}
              {cfg.condicoes_gerais && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{cfg.condicoes_gerais}</p>
              )}
            </Secao>
          )}

          <Secao titulo="Declaração">
            <p className="text-sm leading-relaxed">
              Aprovamos o orçamento acima e autorizamos a contratação nas condições descritas.
              Solicitamos o envio do <strong>contrato para assinatura</strong>, contemplando o mesmo
              escopo, valor e cronograma de pagamento aqui registrados.
            </p>
          </Secao>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2">
          {[cfg.contratante_nome || "Contratante", fornecedor?.nome || "Contratado"].map((nome, i) => (
            <div key={i} className="text-center">
              <div className="border-t border-ink/40" />
              <p className="mt-1 text-xs text-muted">{nome}</p>
              <p className="text-[11px] text-muted">{i === 0 ? "Contratante" : "Contratado"}</p>
            </div>
          ))}
        </div>
      </article>
    </>
  );
}
