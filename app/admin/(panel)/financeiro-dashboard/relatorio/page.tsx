/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { DocumentoActions } from "@/components/admin/DocumentoActions";
import { loadFinance, dashboardFinanceiro, projetarMensal } from "@/lib/finance-core";
import { listCortesias, getModeloDocumento } from "@/lib/admin-data";
import { getSettings, resolveCouple } from "@/lib/data";
import { formatCents } from "@/domain/money";
import { fmtDateBR, hojeISO } from "@/lib/format";
import { WEDDING } from "@/lib/constants";
import { classesDestaque } from "@/domain/contratacao/modelo";

export const dynamic = "force-dynamic";

/** "2026-08" → "ago/2026" */
function mesExtenso(ym: string): string {
  const [ano, mes] = ym.split("-");
  const nome = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", { month: "short" });
  return `${nome.replace(".", "")}/${ano}`;
}

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

/** Célula numérica da tabela — alinhada à direita e com dígitos tabulares. */
function Num({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`border border-line px-3 py-1.5 text-right tabular-nums ${className}`}>{children}</td>;
}

export default async function RelatorioFinanceiroPage() {
  const [d, cortesias, settings, modelo] = await Promise.all([
    loadFinance(),
    listCortesias(),
    getSettings(),
    getModeloDocumento(),
  ]);
  const economia = cortesias.reduce((n, c) => n + (c.valor_mercado_cents ?? 0), 0);
  const dash = dashboardFinanceiro(d, economia);
  const proj = projetarMensal(d, "vencimento");
  const couple = resolveCouple(settings);
  const cor = classesDestaque(modelo.cor_destaque);

  const dataEvento = new Date(couple.dataISO).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WEDDING.timezone,
  });
  const hoje = hojeISO();
  const diasRestantes = Math.max(
    0,
    Math.ceil((new Date(couple.dataISO).getTime() - Date.now()) / 86_400_000),
  );

  const indicadores = [
    { r: "Previsto total", v: dash.previstoCents, nota: "todas as contas ativas (sem cortesias)" },
    { r: "Contratado", v: dash.contratadoCents, nota: "itens em contratado ou pago" },
    { r: "Pago", v: dash.pagoCents, nota: "pagamentos válidos registrados" },
    { r: "Pendente", v: dash.pendenteCents, nota: "saldo em aberto" },
    { r: "Vencido", v: dash.vencidoCents, nota: "pendente com vencimento no passado" },
    { r: "Aportes", v: dash.aportesCents, nota: "entradas dos responsáveis" },
    { r: "Saldo disponível", v: dash.saldoDisponivelCents, nota: "aportes − pagamentos" },
    { r: "Economia (cortesias)", v: dash.economiaCents, nota: "não é saída de caixa" },
  ];

  // Texto resumido para WhatsApp/e-mail.
  const texto = [
    `RELATÓRIO FINANCEIRO — Casamento ${couple.noiva} & ${couple.noivo}`,
    `Posição em ${fmtDateBR(hoje)} · faltam ${diasRestantes} dias para ${dataEvento}`,
    ``,
    ...indicadores.map((i) => `${i.r}: ${formatCents(i.v)}`),
    ``,
    `GASTOS POR CLASSIFICAÇÃO`,
    ...dash.porClassificacao.map((c) => `• ${c.nome} — ${formatCents(c.cents)} (${c.pct}%)`),
    ``,
    `PRÓXIMAS CONTAS`,
    ...(dash.proximasContas.length === 0
      ? ["Nada vencendo em breve."]
      : dash.proximasContas.map(
          (c) =>
            `• ${c.descricao}${c.numero ? ` ${c.numero}/${c.totalParcelas}` : ""} — ${formatCents(c.saldoCents)} · ${
              c.vencimento ? fmtDateBR(c.vencimento) : "sem data"
            }`,
        )),
  ].join("\n");

  return (
    <>
      <style>{`
        @page { size: A4; margin: 14mm 12mm; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/financeiro-dashboard" className="text-sm text-olive underline">
          ← voltar para o Dashboard
        </Link>
        <DocumentoActions texto={texto} />
      </div>

      <article className="mx-auto max-w-[820px] overflow-hidden rounded-lg bg-white shadow-card print:max-w-none print:rounded-none print:shadow-none">
        <header className={`border-b-2 bg-sand px-12 py-9 text-center print:px-8 print:py-6 ${cor.borda}`}>
          {modelo.mostrar_monograma && (
            <img
              src="/logo.png"
              alt="Monograma Helena e Guilherme"
              className="mx-auto h-16 w-auto object-contain print:h-14"
            />
          )}
          <p className="mt-3 font-serif text-[26px] leading-tight text-moss-deep">
            Casamento {couple.noiva} &amp; {couple.noivo}
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-olive">
            {dataEvento} · {WEDDING.cidade}
          </p>
        </header>

        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line bg-cream px-12 py-4 print:px-8 print:py-3">
          <h1 className="font-serif text-xl leading-snug text-moss-deep">Relatório financeiro</h1>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            Posição em {fmtDateBR(hoje)} · faltam {diasRestantes} dias
          </p>
        </div>

        <div className="grid gap-6 px-12 py-8 print:px-8 print:py-6">
          <Secao n={1} titulo="Indicadores" corTexto={cor.texto}>
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                {indicadores.map((i) => (
                  <tr key={i.r}>
                    <td className="border border-line px-3 py-1.5">
                      {i.r}
                      <span className="ml-2 text-[11px] text-muted">{i.nota}</span>
                    </td>
                    <Num className="font-medium text-moss-deep">{formatCents(i.v)}</Num>
                  </tr>
                ))}
              </tbody>
            </table>
          </Secao>

          <Secao n={2} titulo="Gastos por classificação" corTexto={cor.texto}>
            {dash.porClassificacao.length === 0 ? (
              <p className="text-[13px] text-muted">Nenhuma despesa classificada ainda.</p>
            ) : (
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-cream text-left">
                    <th className="border border-line px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-moss">
                      Classificação
                    </th>
                    <th className="border border-line px-3 py-2 text-right text-[10px] font-medium uppercase tracking-[0.12em] text-moss">
                      Valor
                    </th>
                    <th className="border border-line px-3 py-2 text-right text-[10px] font-medium uppercase tracking-[0.12em] text-moss">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dash.porClassificacao.map((c) => (
                    <tr key={c.nome}>
                      <td className="border border-line px-3 py-1.5">{c.nome}</td>
                      <Num>{formatCents(c.cents)}</Num>
                      <Num>{c.pct}%</Num>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Secao>

          <Secao n={3} titulo="Próximas contas" corTexto={cor.texto}>
            {dash.proximasContas.length === 0 ? (
              <p className="text-[13px] text-muted">Nada vencendo em breve.</p>
            ) : (
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-cream text-left">
                    <th className="border border-line px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-moss">
                      Conta
                    </th>
                    <th className="border border-line px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-moss">
                      Vencimento
                    </th>
                    <th className="border border-line px-3 py-2 text-right text-[10px] font-medium uppercase tracking-[0.12em] text-moss">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dash.proximasContas.map((c) => (
                    <tr key={c.id}>
                      <td className="border border-line px-3 py-1.5">
                        {c.descricao}
                        {c.numero ? ` · ${c.numero}/${c.totalParcelas}` : ""}
                        {c.classificacao && <span className="ml-2 text-[11px] text-muted">{c.classificacao}</span>}
                      </td>
                      <td className="border border-line px-3 py-1.5">
                        {c.vencimento ? fmtDateBR(c.vencimento) : "—"}
                      </td>
                      <Num>{formatCents(c.saldoCents)}</Num>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Secao>

          {dash.contasVencidas.length > 0 && (
            <Secao n={4} titulo="Contas vencidas" corTexto={cor.texto}>
              <table className="w-full border-collapse text-[13px]">
                <tbody>
                  {dash.contasVencidas.map((c) => (
                    <tr key={c.id}>
                      <td className="border border-line px-3 py-1.5">
                        {c.descricao}
                        <span className="ml-2 text-[11px] text-danger">
                          venceu {c.vencimento ? fmtDateBR(c.vencimento) : ""}
                        </span>
                      </td>
                      <Num className="text-danger">{formatCents(c.saldoCents)}</Num>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Secao>
          )}

          <Secao n={dash.contasVencidas.length > 0 ? 5 : 4} titulo="Projeção mensal (por vencimento)" corTexto={cor.texto}>
            {proj.meses.length === 0 ? (
              <p className="text-[13px] text-muted">Sem contas com data definida.</p>
            ) : (
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-cream text-left">
                    {["Mês", "Previsto", "Pago", "Pendente", "Entradas", "Acumulado"].map((h, i) => (
                      <th
                        key={h}
                        className={`border border-line px-2.5 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-moss ${
                          i > 0 ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proj.meses.map((m) => (
                    <tr key={m.ym}>
                      <td className="border border-line px-2.5 py-1.5">{mesExtenso(m.ym)}</td>
                      <Num className="px-2.5">{formatCents(m.previstoCents)}</Num>
                      <Num className="px-2.5 text-success">{formatCents(m.pagoCents)}</Num>
                      <Num className="px-2.5">{formatCents(m.pendenteCents)}</Num>
                      <Num className="px-2.5">{formatCents(m.entradasCents)}</Num>
                      <Num className="px-2.5 font-medium">{formatCents(m.acumuladoCents)}</Num>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={cor.fundoSuave}>
                    <td className="border border-line px-2.5 py-2 font-medium uppercase tracking-wide text-moss-deep">
                      Total
                    </td>
                    <Num className="px-2.5 font-medium">{formatCents(proj.totalPrevistoCents)}</Num>
                    <Num className="px-2.5 font-medium">{formatCents(proj.totalPagoCents)}</Num>
                    <Num className="px-2.5 font-medium">{formatCents(proj.totalPendenteCents)}</Num>
                    <Num className="px-2.5 font-medium">{formatCents(proj.totalEntradasCents)}</Num>
                    <Num className="px-2.5">—</Num>
                  </tr>
                </tfoot>
              </table>
            )}
            {proj.semDataCents > 0 && (
              <p className="mt-2 text-[12px] text-muted">
                {formatCents(proj.semDataCents)} em contas <strong>sem data definida</strong> — fora da
                projeção acima até receberem vencimento.
              </p>
            )}
          </Secao>
        </div>

        <footer className="border-t border-line bg-sand px-12 py-3 text-center text-[10px] uppercase tracking-[0.16em] text-muted print:px-8">
          {couple.noiva} &amp; {couple.noivo} · {dataEvento} · Relatório gerado em {fmtDateBR(hoje)}
        </footer>
      </article>
    </>
  );
}
