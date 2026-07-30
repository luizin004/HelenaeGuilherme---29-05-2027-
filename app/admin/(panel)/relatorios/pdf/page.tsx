/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { DocumentoActions } from "@/components/admin/DocumentoActions";
import { carregarConsolidado } from "@/lib/relatorio-consolidado";
import { getModeloDocumento } from "@/lib/admin-data";
import { getSettings, resolveCouple } from "@/lib/data";
import { formatCents } from "@/domain/money";
import { fmtDateBR } from "@/lib/format";
import { labelMesPT } from "@/domain/finance/status";
import { WEDDING } from "@/lib/constants";
import { classesDestaque } from "@/domain/contratacao/modelo";

export const dynamic = "force-dynamic";

const ROTULO_SITUACAO = {
  coberto: "Caixa coberto",
  apertado: "Caixa apertado",
  descoberto: "Caixa descoberto",
} as const;

const FUNDO_SITUACAO = {
  coberto: "bg-[#e6efe0]",
  apertado: "bg-[#f6ecd6]",
  descoberto: "bg-[#f4e2dc]",
} as const;

function Secao({ n, titulo, corTexto, children }: { n: number; titulo: string; corTexto: string; children: React.ReactNode }) {
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

function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`border border-line px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-moss ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Td({ children, right = false, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={`border border-line px-2.5 py-1 ${right ? "text-right tabular-nums" : ""} ${className}`}>{children}</td>;
}

export default async function RelatorioConsolidadoPdfPage() {
  const [dados, settings, modelo] = await Promise.all([carregarConsolidado(), getSettings(), getModeloDocumento()]);
  const c = dados.consolidado;
  const couple = resolveCouple(settings);
  const cor = classesDestaque(modelo.cor_destaque);

  const dataEvento = new Date(couple.dataISO).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WEDDING.timezone,
  });
  const diasRestantes = Math.max(0, Math.ceil((new Date(couple.dataISO).getTime() - Date.now()) / 86_400_000));

  const indicadores = [
    { r: "Aportes (entradas)", v: c.aportesCents },
    { r: "Custo conhecido", v: c.custoConhecidoCents },
    { r: "Pago", v: c.pagoCents },
    { r: "Sobra após tudo pago", v: c.saldoAposCompromissosCents },
    { r: "Contratado", v: c.contratadoCents },
    { r: "Falta contratar", v: c.aContratarCents },
    { r: "Em aberto", v: c.pendenteCents },
    { r: "Vencido", v: c.vencidoCents },
  ];

  const texto = [
    `RELATÓRIO CONSOLIDADO — Casamento ${couple.noiva} & ${couple.noivo}`,
    `Posição em ${fmtDateBR(dados.hoje)} · faltam ${diasRestantes} dias para ${dataEvento}`,
    ``,
    `${ROTULO_SITUACAO[c.situacao].toUpperCase()} — ${dados.leitura}`,
    ``,
    ...indicadores.map((i) => `${i.r}: ${formatCents(i.v)}`),
    ``,
    `${c.itens.total} itens · ${c.itens.comValor} com valor · ${c.itens.semValor} sem valor · ${c.itens.gratuitos} cortesias`,
    ...(dados.avisos.length > 0 ? [``, `PONTOS DE ATENÇÃO`, ...dados.avisos.map((a) => `• ${a}`)] : []),
  ].join("\n");

  return (
    <>
      <style>{`
        @page { size: A4; margin: 12mm 10mm; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/relatorios" className="text-sm text-olive underline">← voltar para Relatórios</Link>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/financeiro/relatorio" className="text-sm text-olive underline">ver relatório detalhado</Link>
          <DocumentoActions texto={texto} />
        </div>
      </div>

      <article className="mx-auto max-w-[900px] overflow-hidden rounded-lg bg-white shadow-card print:max-w-none print:rounded-none print:shadow-none">
        <header className={`border-b-2 bg-sand px-10 py-8 text-center print:px-6 print:py-5 ${cor.borda}`}>
          {modelo.mostrar_monograma && (
            <img src="/logo.png" alt="Monograma Helena e Guilherme" className="mx-auto h-14 w-auto object-contain print:h-12" />
          )}
          <p className="mt-3 font-serif text-[24px] leading-tight text-moss-deep">
            Casamento {couple.noiva} &amp; {couple.noivo}
          </p>
          <p className="mt-1.5 text-[10.5px] uppercase tracking-[0.2em] text-olive">
            {dataEvento} · {WEDDING.cidade}
          </p>
        </header>

        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line bg-cream px-10 py-3.5 print:px-6">
          <h1 className="font-serif text-xl leading-snug text-moss-deep">Relatório consolidado</h1>
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">
            Posição em {fmtDateBR(dados.hoje)} · faltam {diasRestantes} dias
          </p>
        </div>

        <div className="grid gap-6 px-10 py-7 print:px-6 print:py-5">
          {/* Leitura do caixa */}
          <div className={`break-inside-avoid rounded border-l-[3px] px-5 py-4 ${cor.borda} ${FUNDO_SITUACAO[c.situacao]}`}>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-moss-deep">
              {ROTULO_SITUACAO[c.situacao]}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{dados.leitura}</p>
          </div>

          <Secao n={1} titulo="Posição financeira" corTexto={cor.texto}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
              {indicadores.map((i) => (
                <div key={i.r} className="border-b border-line py-1.5">
                  <p className="text-[9.5px] uppercase tracking-[0.12em] text-muted">{i.r}</p>
                  <p className={`font-serif text-[15px] leading-tight ${i.v < 0 ? "text-danger" : "text-moss-deep"}`}>
                    {formatCents(i.v)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
              Cobertura dos aportes: <strong>{c.coberturaPct}%</strong> do custo conhecido · Execução:{" "}
              <strong>{c.execucaoPct}%</strong> já pago. {c.itens.total} itens no orçamento —{" "}
              {c.itens.comValor} com valor, <strong>{c.itens.semValor} ainda sem valor</strong> e{" "}
              {c.itens.gratuitos} cortesias ({formatCents(c.economiaCents)} de economia).
            </p>
          </Secao>

          {dados.avisos.length > 0 && (
            <Secao n={2} titulo="Pontos de atenção" corTexto={cor.texto}>
              <ul className="space-y-1 text-[12px] leading-relaxed text-ink">
                {dados.avisos.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={cor.texto}>•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </Secao>
          )}

          <Secao n={dados.avisos.length > 0 ? 3 : 2} titulo="Onde o dinheiro está — por classificação" corTexto={cor.texto}>
            {dados.porClassificacao.length === 0 ? (
              <p className="text-[11.5px] text-muted">Sem contas classificadas ainda.</p>
            ) : (
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr className="bg-cream">
                    <Th>Classificação</Th>
                    <Th right>Previsto</Th>
                    <Th right>%</Th>
                    <Th right>Contratado</Th>
                    <Th right>Pago</Th>
                    <Th right>Em aberto</Th>
                  </tr>
                </thead>
                <tbody>
                  {dados.porClassificacao.map((l) => (
                    <tr key={l.nome}>
                      <Td>{l.nome}</Td>
                      <Td right>{formatCents(l.previstoCents)}</Td>
                      <Td right className="text-muted">{l.pct}%</Td>
                      <Td right>{formatCents(l.contratadoCents)}</Td>
                      <Td right className="text-success">{formatCents(l.pagoCents)}</Td>
                      <Td right>{formatCents(l.abertoCents)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Secao>

          <Secao n={dados.avisos.length > 0 ? 4 : 3} titulo="Por responsável" corTexto={cor.texto}>
            {dados.porResponsavel.length === 0 ? (
              <p className="text-[11.5px] text-muted">Nenhum responsável configurado.</p>
            ) : (
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr className="bg-cream">
                    <Th>Responsável</Th>
                    <Th right>Assumido</Th>
                    <Th right>Pago</Th>
                    <Th right>Em aberto</Th>
                    <Th right>Este mês</Th>
                    <Th right>Próximo mês</Th>
                    <Th right>Aportes</Th>
                  </tr>
                </thead>
                <tbody>
                  {dados.porResponsavel.map((r) => (
                    <tr key={r.nome}>
                      <Td>{r.nome}</Td>
                      <Td right>{formatCents(r.assumidoCents)}</Td>
                      <Td right className="text-success">{formatCents(r.pagoCents)}</Td>
                      <Td right>{formatCents(r.abertoCents)}</Td>
                      <Td right>{formatCents(r.esteMesCents)}</Td>
                      <Td right>{formatCents(r.proxMesCents)}</Td>
                      <Td right className="text-olive">{formatCents(r.aportesCents)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Secao>

          <Secao n={dados.avisos.length > 0 ? 5 : 4} titulo="Fluxo de caixa projetado" corTexto={cor.texto}>
            {dados.fluxo.meses.length === 0 ? (
              <p className="text-[11.5px] text-muted">Sem movimentações com data definida.</p>
            ) : (
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr className="bg-cream">
                    <Th>Mês</Th>
                    <Th right>Entradas</Th>
                    <Th right>Saídas</Th>
                    <Th right>Saldo disponível</Th>
                    <Th right>Acumulado</Th>
                  </tr>
                </thead>
                <tbody>
                  {dados.fluxo.meses.map((m) => (
                    <tr key={m.ym}>
                      <Td>{labelMesPT(m.ym)}</Td>
                      <Td right className="text-success">{formatCents(m.entradasCents)}</Td>
                      <Td right>{formatCents(m.saidasCents)}</Td>
                      <Td right className={m.saldoCents < 0 ? "text-danger" : ""}>{formatCents(m.saldoCents)}</Td>
                      <Td right className={`font-medium ${m.acumuladoCents < 0 ? "text-danger" : ""}`}>
                        {formatCents(m.acumuladoCents)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={cor.fundoSuave}>
                    <Td className="font-medium uppercase tracking-wide text-moss-deep">Total</Td>
                    <Td right className="font-medium">{formatCents(dados.fluxo.totalEntradasCents)}</Td>
                    <Td right className="font-medium">{formatCents(dados.fluxo.totalSaidasCents)}</Td>
                    <Td right className="font-medium">{formatCents(dados.fluxo.saldoCents)}</Td>
                    <Td right>—</Td>
                  </tr>
                </tfoot>
              </table>
            )}
          </Secao>

          <Secao n={dados.avisos.length > 0 ? 6 : 5} titulo="Agenda — o que vem pela frente" corTexto={cor.texto}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                  Próximos vencimentos ({dados.proximas.length})
                </p>
                {dados.proximas.length === 0 ? (
                  <p className="text-[11.5px] text-muted">Nada vencendo em breve.</p>
                ) : (
                  <table className="w-full border-collapse text-[11.5px]">
                    <tbody>
                      {dados.proximas.map((p) => (
                        <tr key={p.id}>
                          <Td className="w-20 text-muted">{p.vencimento ? fmtDateBR(p.vencimento) : "—"}</Td>
                          <Td>{p.descricao}{p.numero ? ` · ${p.numero}/${p.totalParcelas}` : ""}</Td>
                          <Td right>{formatCents(p.saldoCents)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                  Falta contratar ({dados.contratacao.pendentes} itens)
                </p>
                <table className="w-full border-collapse text-[11.5px]">
                  <tbody>
                    <tr>
                      <Td>Passaram do prazo</Td>
                      <Td right className={dados.contratacao.vencidos.length > 0 ? "text-danger" : ""}>
                        {dados.contratacao.vencidos.length}
                      </Td>
                    </tr>
                    <tr>
                      <Td>Vencem em até 7 dias</Td>
                      <Td right>{dados.contratacao.semana.length}</Td>
                    </tr>
                    <tr>
                      <Td>Sem prazo definido</Td>
                      <Td right>{dados.contratacao.semPrazo.length}</Td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {dados.vencidas.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-danger">
                  Contas vencidas ({dados.vencidas.length})
                </p>
                <table className="w-full border-collapse text-[11.5px]">
                  <tbody>
                    {dados.vencidas.map((v) => (
                      <tr key={v.id}>
                        <Td className="w-20 text-danger">{v.vencimento ? fmtDateBR(v.vencimento) : "—"}</Td>
                        <Td>{v.descricao}{v.numero ? ` · ${v.numero}/${v.totalParcelas}` : ""}</Td>
                        <Td right className="text-danger">{formatCents(v.saldoCents)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Secao>

          <p className="text-[10.5px] leading-relaxed text-muted">
            Presentes ficam fora destes números — entram como receita à parte. Cortesias contam como
            economia, nunca como saída de caixa. O detalhamento item a item está no{" "}
            <strong>relatório detalhado</strong>.
          </p>
        </div>

        <footer className="border-t border-line bg-sand px-10 py-3 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted print:px-6">
          {couple.noiva} &amp; {couple.noivo} · {dataEvento} · Consolidado gerado em {fmtDateBR(dados.hoje)}
        </footer>
      </article>
    </>
  );
}
