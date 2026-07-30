/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { DocumentoActions } from "@/components/admin/DocumentoActions";
import {
  loadFinance,
  dashboardFinanceiro,
  fluxoCaixa,
  filtrarAba,
  type ContaRow,
} from "@/lib/finance-core";
import { listCortesias, listExpenses, getModeloDocumento } from "@/lib/admin-data";
import { getSettings, resolveCouple } from "@/lib/data";
import { formatCents, sumCents } from "@/domain/money";
import { fmtDateBR, hojeISO } from "@/lib/format";
import { labelMesPT } from "@/domain/finance/status";
import { agruparEventosPorMes, montarEventos, totaisPorTipo } from "@/domain/finance/calendario";
import { WEDDING } from "@/lib/constants";
import { classesDestaque } from "@/domain/contratacao/modelo";

export const dynamic = "force-dynamic";

const ESTADO_LABEL: Record<string, string> = {
  previsto: "Previsto",
  orcado: "Orçado",
  contratado: "Contratado",
  pago: "Pago",
  gratuito: "Gratuito",
};

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
    <th
      className={`border border-line px-2.5 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-moss ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children, right = false, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return (
    <td className={`border border-line px-2.5 py-1 ${right ? "text-right tabular-nums" : ""} ${className}`}>{children}</td>
  );
}

/** Bloco de contas (a pagar, vencidas, pagas) com total. */
function TabelaContas({ contas, corFundo }: { contas: ContaRow[]; corFundo: string }) {
  const total = sumCents(contas.map((c) => (c.saldoCents > 0 ? c.saldoCents : c.valorCents)));
  return (
    <table className="w-full border-collapse text-[11.5px]">
      <thead>
        <tr className="bg-cream">
          <Th>Conta</Th>
          <Th>Classificação</Th>
          <Th>Vencimento</Th>
          <Th right>Valor</Th>
          <Th right>Saldo</Th>
        </tr>
      </thead>
      <tbody>
        {contas.map((c) => (
          <tr key={c.id}>
            <Td>
              {c.descricao}
              {c.numero ? ` · ${c.numero}/${c.totalParcelas}` : ""}
            </Td>
            <Td className="text-muted">{c.classificacao ?? "—"}</Td>
            <Td>{c.vencimento ? fmtDateBR(c.vencimento) : c.previsao ? `${fmtDateBR(c.previsao)} (prev.)` : "—"}</Td>
            <Td right>{formatCents(c.valorCents)}</Td>
            <Td right>{formatCents(c.saldoCents)}</Td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className={corFundo}>
          <Td className="font-medium uppercase tracking-wide text-moss-deep">Total ({contas.length})</Td>
          <Td>{""}</Td>
          <Td>{""}</Td>
          <Td>{""}</Td>
          <Td right className="font-medium text-moss-deep">{formatCents(total)}</Td>
        </tr>
      </tfoot>
    </table>
  );
}

export default async function RelatorioFinanceiroCompletoPage() {
  const [d, cortesias, expenses, settings, modelo] = await Promise.all([
    loadFinance(),
    listCortesias(),
    listExpenses(),
    getSettings(),
    getModeloDocumento(),
  ]);

  const economia = cortesias.reduce((n, c) => n + (c.valor_mercado_cents ?? 0), 0);
  const dash = dashboardFinanceiro(d, economia);
  const fluxo = fluxoCaixa(d, "projetado");
  const couple = resolveCouple(settings);
  const cor = classesDestaque(modelo.cor_destaque);
  const hoje = hojeISO();

  const dataEvento = new Date(couple.dataISO).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WEDDING.timezone,
  });
  const diasRestantes = Math.max(0, Math.ceil((new Date(couple.dataISO).getTime() - Date.now()) / 86_400_000));

  // --- Lançamentos: todos os itens do orçamento, com ou sem valor ---
  const lancamentos = expenses.slice().sort((a, b) => a.descricao.localeCompare(b.descricao));
  const semValor = lancamentos.filter((e) => !e.gratuito && e.valor_total_cents === null);
  const gratuitos = lancamentos.filter((e) => e.gratuito);

  // --- Contas por situação ---
  const aPagar = filtrarAba(d.contas, "a_pagar", hoje);
  const vencidas = filtrarAba(d.contas, "vencidas", hoje);
  const pagas = filtrarAba(d.contas, "pagas", hoje);

  // --- Calendário (mesma fonte da aba) ---
  const eventos = montarEventos(d);
  const porMes = agruparEventosPorMes(eventos);
  const totaisEventos = totaisPorTipo(eventos);

  const indicadores = [
    { r: "Previsto total", v: dash.previstoCents },
    { r: "Contratado", v: dash.contratadoCents },
    { r: "Pago", v: dash.pagoCents },
    { r: "Pendente", v: dash.pendenteCents },
    { r: "Vencido", v: dash.vencidoCents },
    { r: "Aportes", v: dash.aportesCents },
    { r: "Saldo disponível", v: dash.saldoDisponivelCents },
    { r: "Economia (cortesias)", v: dash.economiaCents },
  ];

  const texto = [
    `RELATÓRIO FINANCEIRO COMPLETO — Casamento ${couple.noiva} & ${couple.noivo}`,
    `Posição em ${fmtDateBR(hoje)} · faltam ${diasRestantes} dias para ${dataEvento}`,
    ``,
    ...indicadores.map((i) => `${i.r}: ${formatCents(i.v)}`),
    ``,
    `${lancamentos.length} itens no orçamento · ${semValor.length} ainda sem valor · ${gratuitos.length} cortesias`,
    `${aPagar.length} contas a pagar · ${vencidas.length} vencidas · ${pagas.length} pagas`,
    ``,
    `PRÓXIMOS VENCIMENTOS`,
    ...(dash.proximasContas.length === 0
      ? ["Nada vencendo em breve."]
      : dash.proximasContas.map(
          (c) => `• ${fmtDateBR(c.vencimento ?? "")} — ${c.descricao} — ${formatCents(c.saldoCents)}`,
        )),
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
        <Link href="/admin/financeiro" className="text-sm text-olive underline">
          ← voltar para o Financeiro
        </Link>
        <DocumentoActions texto={texto} />
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
          <h1 className="font-serif text-xl leading-snug text-moss-deep">Relatório financeiro completo</h1>
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">
            Posição em {fmtDateBR(hoje)} · faltam {diasRestantes} dias
          </p>
        </div>

        <div className="grid gap-6 px-10 py-7 print:px-6 print:py-5">
          {/* 1 — Resumo */}
          <Secao n={1} titulo="Resumo executivo" corTexto={cor.texto}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
              {indicadores.map((i) => (
                <div key={i.r} className="border-b border-line py-1.5">
                  <p className="text-[9.5px] uppercase tracking-[0.12em] text-muted">{i.r}</p>
                  <p className="font-serif text-[15px] leading-tight text-moss-deep">{formatCents(i.v)}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
              {lancamentos.length} itens no orçamento — <strong>{semValor.length}</strong> ainda sem valor
              definido (não contam como R$ 0) e <strong>{gratuitos.length}</strong> cortesias (não geram
              parcela). {aPagar.length} contas a pagar, {vencidas.length} vencidas e {pagas.length} pagas.
            </p>
          </Secao>

          {/* 2 — Lançamentos */}
          <Secao n={2} titulo="Lançamentos — todos os itens do orçamento" corTexto={cor.texto}>
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="bg-cream">
                  <Th>Item</Th>
                  <Th>Categoria</Th>
                  <Th>Estado</Th>
                  <Th right>Valor</Th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((e) => (
                  <tr key={e.id}>
                    <Td>{e.descricao}</Td>
                    <Td className="text-muted">{e.categoria ?? "—"}</Td>
                    <Td>{ESTADO_LABEL[e.gratuito ? "gratuito" : e.estado] ?? e.estado}</Td>
                    <Td right className={e.valor_total_cents === null ? "text-muted" : ""}>
                      {e.gratuito
                        ? "cortesia"
                        : e.valor_total_cents === null
                          ? "a definir"
                          : formatCents(e.valor_total_cents)}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={cor.fundoSuave}>
                  <Td className="font-medium uppercase tracking-wide text-moss-deep">
                    Total conhecido ({lancamentos.length} itens)
                  </Td>
                  <Td>{""}</Td>
                  <Td>{""}</Td>
                  <Td right className="font-medium text-moss-deep">
                    {formatCents(sumCents(lancamentos.filter((e) => !e.gratuito).map((e) => e.valor_total_cents ?? 0)))}
                  </Td>
                </tr>
              </tfoot>
            </table>
          </Secao>

          {/* 3 — Gastos por classificação */}
          <Secao n={3} titulo="Distribuição por classificação" corTexto={cor.texto}>
            {dash.porClassificacao.length === 0 ? (
              <p className="text-[11.5px] text-muted">Nenhuma despesa classificada ainda.</p>
            ) : (
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr className="bg-cream">
                    <Th>Classificação</Th>
                    <Th right>Valor</Th>
                    <Th right>%</Th>
                  </tr>
                </thead>
                <tbody>
                  {dash.porClassificacao.map((c) => (
                    <tr key={c.nome}>
                      <Td>{c.nome}</Td>
                      <Td right>{formatCents(c.cents)}</Td>
                      <Td right>{c.pct}%</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Secao>

          {/* 4 — Contas */}
          <Secao n={4} titulo="Contas a pagar" corTexto={cor.texto}>
            {aPagar.length === 0 ? (
              <p className="text-[11.5px] text-muted">Nenhuma conta em aberto.</p>
            ) : (
              <TabelaContas contas={aPagar} corFundo={cor.fundoSuave} />
            )}
          </Secao>

          {vencidas.length > 0 && (
            <Secao n={5} titulo="Contas vencidas" corTexto={cor.texto}>
              <TabelaContas contas={vencidas} corFundo="bg-[#f4e2dc]" />
            </Secao>
          )}

          {pagas.length > 0 && (
            <Secao n={vencidas.length > 0 ? 6 : 5} titulo="Contas pagas" corTexto={cor.texto}>
              <TabelaContas contas={pagas} corFundo="bg-[#e6efe0]" />
            </Secao>
          )}

          {/* Fluxo de caixa */}
          <Secao
            n={5 + (vencidas.length > 0 ? 1 : 0) + (pagas.length > 0 ? 1 : 0)}
            titulo="Fluxo de caixa projetado (mês a mês)"
            corTexto={cor.texto}
          >
            {fluxo.meses.length === 0 ? (
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
                  {fluxo.meses.map((m) => (
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
                    <Td right className="font-medium">{formatCents(fluxo.totalEntradasCents)}</Td>
                    <Td right className="font-medium">{formatCents(fluxo.totalSaidasCents)}</Td>
                    <Td right className="font-medium">{formatCents(fluxo.saldoCents)}</Td>
                    <Td right>—</Td>
                  </tr>
                </tfoot>
              </table>
            )}
          </Secao>

          {/* Calendário financeiro */}
          <Secao
            n={6 + (vencidas.length > 0 ? 1 : 0) + (pagas.length > 0 ? 1 : 0)}
            titulo="Calendário financeiro"
            corTexto={cor.texto}
          >
            <p className="mb-2 text-[11.5px] text-muted">
              {totaisEventos.vencimento.qtde} vencimentos ({formatCents(totaisEventos.vencimento.cents)}) ·{" "}
              {totaisEventos.pagamento.qtde} pagamentos ({formatCents(totaisEventos.pagamento.cents)}) ·{" "}
              {totaisEventos.aporte.qtde} aportes ({formatCents(totaisEventos.aporte.cents)}).
            </p>
            {porMes.size === 0 ? (
              <p className="text-[11.5px] text-muted">Nenhum evento financeiro com data definida.</p>
            ) : (
              <div className="grid gap-4">
                {[...porMes.entries()].map(([ym, evs]) => (
                  <div key={ym} className="break-inside-avoid">
                    <p className="mb-1 font-serif text-[13px] text-moss">{labelMesPT(ym)}</p>
                    <table className="w-full border-collapse text-[11.5px]">
                      <tbody>
                        {evs.map((e, i) => (
                          <tr key={i}>
                            <Td className="w-24 text-muted">{fmtDateBR(e.data)}</Td>
                            <Td>
                              {e.titulo}
                              {e.detalhe && <span className="ml-2 text-[10.5px] text-muted">{e.detalhe}</span>}
                            </Td>
                            <Td right className={e.tipo === "pagamento" ? "text-success" : e.tipo === "aporte" ? "text-gold" : ""}>
                              {e.tipo === "aporte" ? "+" : ""}
                              {formatCents(e.valorCents)}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </Secao>
        </div>

        <footer className="border-t border-line bg-sand px-10 py-3 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted print:px-6">
          {couple.noiva} &amp; {couple.noivo} · {dataEvento} · Relatório gerado em {fmtDateBR(hoje)}
        </footer>
      </article>
    </>
  );
}
