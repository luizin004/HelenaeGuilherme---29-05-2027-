# FINANCIAL_RULES — Regras financeiras (implementadas e testadas)

Fonte: `PROJECT_SPEC.md §6`. Implementação: `domain/money.ts`,
`domain/finance/installments.ts`. Testes: `tests/finance/installments.test.ts`,
`tests/domain/money.test.ts` (**19 testes passando**).

## Dinheiro
- Armazenado em **centavos inteiros (`bigint`)** — nunca ponto flutuante (regra 12).
- Conversão/format em `domain/money.ts` (`reaisToCents`, `parseBRLToCents`, `formatCents`).
- **Valor desconhecido = `NULL`**, nunca 0 (regra 11) — coluna `expenses.valor_total_cents` é nullable.

## Estados (separados)
`orcado · cotado · aprovado · contratado · previsto · pago · vencido · realizado · gratuito`
(coluna `expenses.estado`).

## Responsáveis × Centros de custo
- **Responsáveis** (quem paga): Helena, Guilherme, Toninho, Gratuito → tabela `payers`.
- **Centros de custo**: cerimônia, recepção, noivos, convidados, estrutura, administrativo → `cost_centers`.
- São conceitos **distintos** (não confundir).

## Regras validadas por teste
| Regra | Descrição | Teste |
|-------|-----------|-------|
| 1 | Soma das parcelas fecha **exatamente** o total | ✅ `splitEqualInstallments` (R$ 1.893,50 em 6× = R$ 1.893,50) |
| 2 | Soma da divisão por responsáveis fecha o desembolso | ✅ `validateResponsibleSplit` |
| 3 | Entrada faz parte do cronograma, sem dupla contagem | `expense_installments.is_entrada` |
| 4/38 | Item gratuito não gera parcela nem saída de caixa | ✅ `buildSchedule({gratuito:true}) === []` |
| 5/37 | Parcela **sem vencimento** nunca está vencida | ✅ `isOverdue(..., vencimento=null) === false` |
| 6 | Renegociação **não apaga** o cronograma anterior | `expense_schedule_versions` (snapshot) |
| 7/13 | Pagamento não é apagado | soft-delete (`deleted_at`) |
| 8/21 | Alterações críticas são auditadas | `audit_log` |
| 10 | Presentes **não** interferem no financeiro | módulos e tabelas separados (`payments`/`gifts` ≠ `expenses`) |

## Algoritmo de fechamento exato
`splitEqualInstallments(total, n)`: `base = floor(total/n)`; o resto em centavos é
distribuído 1 a 1 nas primeiras parcelas. Invariante verificada em runtime
(`sum(parcelas) === total`) e por teste.

## Projeção mensal
Julho/2026 → maio/2027 (ampliável) — agregação por mês de `expense_installments.vencimento`.

## Pendências
- Seed com valores/vencimentos/responsáveis reais: **PEND-003** (aguarda o cliente).
