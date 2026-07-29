import Link from "next/link";
import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { NovoContrato } from "@/components/admin/NovoContrato";
import { ContratoActions } from "@/components/admin/ContratoActions";
import { UploadContrato } from "@/components/admin/UploadContrato";
import { UploadComprovante } from "@/components/admin/UploadComprovante";
import { DadosContratacaoForm } from "@/components/admin/DadosContratacaoForm";
import { ModeloDocumentoForm } from "@/components/admin/ModeloDocumentoForm";
import { excluirComprovante } from "@/app/actions/comprovantes";
import {
  listContracts,
  listSuppliers,
  listItensContratados,
  getDadosContratacao,
  getModeloDocumento,
  type ContractRow,
} from "@/lib/admin-data";
import { formatCents, sumCents } from "@/domain/money";
import { numeroAutorizacao } from "@/domain/contratacao/autorizacao";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BUCKET = "hg-documentos";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function BlocoContrato({
  contrato,
  supplierName,
  fornecedores,
  link,
}: {
  contrato: ContractRow | undefined;
  supplierName: Map<string, string>;
  fornecedores: { id: string; nome: string }[];
  link: string | undefined;
}) {
  if (!contrato) {
    return (
      <p className="text-sm text-muted">
        Ainda não contratado — marque como &quot;contratado&quot; ou &quot;pago&quot; no{" "}
        <Link href="/admin/financeiro" className="text-olive underline">Financeiro</Link> para o
        contrato aparecer aqui.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-ivory p-3">
      <span className="text-sm text-moss">
        {contrato.supplier_id ? supplierName.get(contrato.supplier_id) ?? "—" : "Sem fornecedor vinculado"}
      </span>
      <span className="inline-block rounded-full bg-cream px-3 py-0.5 text-xs uppercase tracking-wide text-muted">
        {contrato.status}
      </span>
      {contrato.data_evento && <span className="text-xs text-muted">{contrato.data_evento}</span>}
      {link && (
        <a href={link} target="_blank" rel="noopener" className="text-xs text-olive underline">
          baixar contrato
        </a>
      )}
      <Link href={`/admin/contratos/${contrato.id}/autorizacao`} className="text-xs text-olive underline">
        {contrato.autorizacao_seq === null ? "gerar autorização" : `autorização ${numeroAutorizacao(contrato.autorizacao_seq, contrato.autorizacao_emitida_em)}`}
      </Link>
      <UploadContrato contractId={contrato.id} temArquivo={!!contrato.arquivo_url} />
      <ContratoActions c={contrato} fornecedores={fornecedores} />
    </div>
  );
}

export default async function ContratosPage() {
  const [contracts, suppliers, itens, dadosContratacao, modelo] = await Promise.all([
    listContracts(),
    listSuppliers(),
    listItensContratados(),
    getDadosContratacao(),
    getModeloDocumento(),
  ]);
  const dadosPreenchidos = !!(dadosContratacao.contratante_nome && dadosContratacao.contratante_documento);
  const supplierName = new Map(suppliers.map((s) => [s.id, s.nome]));
  const fornecedoresOpcoes = suppliers.map((s) => ({ id: s.id, nome: s.nome }));
  const contractByExpense = new Map(contracts.filter((c) => c.expense_id).map((c) => [c.expense_id as string, c]));
  const standaloneContracts = contracts.filter((c) => !c.expense_id);

  const supabase = createClient();
  const contractLinks = new Map<string, string>();
  const comprovanteLinks = new Map<string, string>();
  if (supabase) {
    await Promise.all([
      ...contracts
        .filter((c) => c.arquivo_url)
        .map(async (c) => {
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(c.arquivo_url as string, 3600);
          if (data?.signedUrl) contractLinks.set(c.id, data.signedUrl);
        }),
      ...itens
        .flatMap((i) => i.comprovantes)
        .map(async (c) => {
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(c.arquivo_url, 3600);
          if (data?.signedUrl) comprovanteLinks.set(c.id, data.signedUrl);
        }),
    ]);
  }

  const totalComp = itens.reduce((n, i) => n + i.comprovantes.length, 0);
  const valorComprovado = sumCents(itens.flatMap((i) => i.comprovantes.map((c) => c.valor_cents ?? 0)));

  return (
    <>
      <PageTitle>Contratos & comprovantes</PageTitle>

      {!isSupabaseConfigured && <Notice>Conecte o Supabase para cadastrar contratos e anexar comprovantes.</Notice>}

      <Notice>
        Esta tela mostra <strong>apenas o que já foi fechado</strong> — itens marcados como{" "}
        <strong>contratado</strong> ou <strong>pago</strong> no{" "}
        <Link href="/admin/financeiro" className="text-olive underline">Financeiro</Link>. Para cada
        um: o <strong>PDF da autorização</strong> (escopo, forma de pagamento e dados de nota fiscal
        para enviar ao fornecedor), o <strong>contrato assinado</strong> e os{" "}
        <strong>comprovantes de pagamento</strong> — tudo em armazenamento privado, com links de
        download que expiram em 1h. Ao vincular um comprovante a uma <strong>parcela</strong>, ela é
        marcada como paga automaticamente.
      </Notice>

      <KpiGrid>
        <Kpi label="Itens contratados" value={itens.length} />
        <Kpi label="Contratos" value={contracts.length} />
        <Kpi label="Comprovantes" value={totalComp} />
        <Kpi label="Valor comprovado" value={formatCents(valorComprovado)} hint="soma dos comprovantes com valor" />
      </KpiGrid>

      <Panel title="Dados para contratação e nota fiscal">
        <DadosContratacaoForm d={dadosContratacao} preenchido={dadosPreenchidos} />
      </Panel>

      <Panel title="Modelo do documento (PDF)">
        <ModeloDocumentoForm
          modelo={modelo}
          exemploHref={contracts.length > 0 ? `/admin/contratos/${contracts[0].id}/autorizacao` : null}
        />
      </Panel>

      <Panel title="Novo contrato">
        <div className="p-6">
          <NovoContrato fornecedores={suppliers} />
        </div>
      </Panel>

      {itens.length === 0 && standaloneContracts.length === 0 && (
        <Notice>
          Nenhum item contratado ainda. Marque uma despesa como &quot;contratado&quot; no{" "}
          <Link href="/admin/financeiro" className="text-olive underline">Financeiro</Link> e ela
          aparece aqui.
        </Notice>
      )}

      <div className="grid gap-6">
        {itens.map((item) => (
          <Panel
            key={item.id}
            title={`${item.descricao}${item.categoria ? ` · ${item.categoria}` : ""} · ${formatCents(item.valor_total_cents)}`}
            action={
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-0.5 text-[11px] uppercase tracking-wide ${
                    item.exige_nota_fiscal ? "bg-[#e6efe0] text-success" : "bg-cream text-muted"
                  }`}
                >
                  {item.exige_nota_fiscal ? "com nota fiscal" : "sem nota fiscal"}
                </span>
                {contractByExpense.has(item.id) && (
                  <Link
                    href={`/admin/contratos/${contractByExpense.get(item.id)!.id}/autorizacao`}
                    className="btn btn-dark px-4 py-1.5 text-xs"
                  >
                    PDF da autorização
                  </Link>
                )}
              </div>
            }
          >
            <div className="space-y-5 p-6">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Contrato</p>
                <BlocoContrato
                  contrato={contractByExpense.get(item.id)}
                  supplierName={supplierName}
                  fornecedores={fornecedoresOpcoes}
                  link={(() => {
                    const c = contractByExpense.get(item.id);
                    return c ? contractLinks.get(c.id) : undefined;
                  })()}
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Comprovantes de pagamento</p>
                {item.comprovantes.length === 0 ? (
                  <p className="text-sm text-muted">Nenhum comprovante anexado.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {item.comprovantes.map((c) => {
                      const link = comprovanteLinks.get(c.id);
                      return (
                        <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                          <div>
                            <span className="font-medium">{c.titulo || "Comprovante"}</span>
                            {c.valor_cents !== null && <span className="ml-2 text-olive">{formatCents(c.valor_cents)}</span>}
                            {c.data_pagamento && <span className="ml-2 text-xs text-muted">{fmtDate(c.data_pagamento)}</span>}
                            {c.installment_id && (
                              <span className="ml-2 rounded-full bg-[#e6efe0] px-2 py-0.5 text-[10px] uppercase text-success">
                                parcela paga
                              </span>
                            )}
                            {c.observacao && <span className="ml-2 text-xs text-muted">· {c.observacao}</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            {link ? (
                              <a href={link} target="_blank" rel="noopener" className="text-xs text-olive underline">baixar</a>
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                            <form action={excluirComprovante}>
                              <input type="hidden" name="id" value={c.id} />
                              <input type="hidden" name="path" value={c.arquivo_url} />
                              <button type="submit" className="text-xs text-danger underline">excluir</button>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="mt-2">
                  <UploadComprovante expenseId={item.id} parcelas={item.parcelasAbertas} />
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {standaloneContracts.length > 0 && (
        <Panel title="Outros contratos (sem despesa vinculada)">
          <div className="divide-y divide-line">
            {standaloneContracts.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{c.titulo}</p>
                  <p className="text-xs text-muted">
                    {c.supplier_id ? supplierName.get(c.supplier_id) ?? "—" : "Sem fornecedor"} ·{" "}
                    {formatCents(Math.round(Number(c.valor) * 100))}
                    {c.data_evento ? ` · ${c.data_evento}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-block rounded-full bg-cream px-3 py-0.5 text-xs uppercase tracking-wide text-muted">
                    {c.status}
                  </span>
                  {contractLinks.has(c.id) && (
                    <a href={contractLinks.get(c.id)} target="_blank" rel="noopener" className="text-xs text-olive underline">
                      baixar
                    </a>
                  )}
                  <Link href={`/admin/contratos/${c.id}/autorizacao`} className="text-xs text-olive underline">
                    {c.autorizacao_seq === null ? "gerar autorização" : `autorização ${numeroAutorizacao(c.autorizacao_seq, c.autorizacao_emitida_em)}`}
                  </Link>
                  <UploadContrato contractId={c.id} temArquivo={!!c.arquivo_url} />
                  <ContratoActions c={c} fornecedores={fornecedoresOpcoes} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
