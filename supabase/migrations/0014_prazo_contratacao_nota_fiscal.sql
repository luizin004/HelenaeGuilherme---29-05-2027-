-- Composição do custo: dois dados que o fornecedor precisa saber e que os
-- noivos precisam acompanhar:
--   1. se aquele item exige nota fiscal (padrão: sim, para todos);
--   2. até quando o item precisa estar contratado (prazo que alimenta os
--      lembretes da Evania: vencidos, vencem hoje, vencem na semana).
alter table hg_expenses
  add column if not exists exige_nota_fiscal boolean not null default true,
  add column if not exists prazo_contratacao date;

comment on column hg_expenses.exige_nota_fiscal is
  'Se o fornecedor deve emitir NF para os dados de faturamento (hg_contratacao_config).';
comment on column hg_expenses.prazo_contratacao is
  'Data-limite para fechar a contratação. Alimenta os lembretes de contratação da Evania.';

-- Itens já marcados como contratado/pago antes da fusão Contratos+Comprovantes
-- não geraram registro em hg_contracts. Backfill (1 contrato por despesa).
insert into hg_contracts (expense_id, titulo, supplier_id, valor, status)
select e.id,
       e.descricao,
       e.supplier_id,
       coalesce(e.valor_total_cents, 0) / 100.0,
       'rascunho'
from hg_expenses e
where e.deleted_at is null
  and e.gratuito = false
  and e.estado in ('contratado', 'pago')
  and not exists (
    select 1 from hg_contracts c
    where c.expense_id = e.id and c.deleted_at is null
  );
