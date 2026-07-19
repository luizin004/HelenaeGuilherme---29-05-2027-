-- ============================================================
-- Helena & Guilherme · Migration 0005
-- Financeiro unificado: classificações + pagamentos parciais +
-- métodos de pagamento + contas financeiras + datas financeiras
-- ------------------------------------------------------------
-- Regras de segurança da migração:
--  • NADA antigo é apagado: hg_cost_centers, hg_finance_categories e os
--    campos categoria/cost_center_id continuam existindo até validação.
--  • Todos os vínculos são preservados via backfill.
--  • Dinheiro segue em CENTAVOS inteiros (bigint).
-- ============================================================

-- ---------- 1. Classificações financeiras (unifica centros de custo + categorias) ----------
create table if not exists hg_financial_classifications (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  descricao     text,
  parent_id     uuid references hg_financial_classifications(id) on delete set null,
  icone         text,
  cor           text,
  ordem         int not null default 0,
  ativo         boolean not null default true,
  orcamento_cents bigint check (orcamento_cents is null or orcamento_cents >= 0),
  -- rastreio da origem (auditoria da migração)
  legacy_cost_center_id uuid,
  legacy_categoria      text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
-- Dedupe por nome dentro do mesmo nível (case-insensitive).
create unique index if not exists uq_hg_fin_class_nome
  on hg_financial_classifications (lower(nome), coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));

drop trigger if exists trg_hg_fin_class_upd on hg_financial_classifications;
create trigger trg_hg_fin_class_upd before update on hg_financial_classifications
  for each row execute function hg_touch_updated();

-- 1a. Migra CENTROS DE CUSTO existentes (preserva cor, ordem, orçamento, ativo).
insert into hg_financial_classifications (nome, ordem, ativo, cor, orcamento_cents, legacy_cost_center_id)
select cc.nome, coalesce(cc.ordem, 0), coalesce(cc.ativo, true), cc.cor, cc.orcamento_cents, cc.id
from hg_cost_centers cc
where not exists (
  select 1 from hg_financial_classifications fc
  where lower(fc.nome) = lower(cc.nome) and fc.parent_id is null
);

-- 1b. Migra CATEGORIAS de texto usadas nas despesas (consolida por nome).
insert into hg_financial_classifications (nome, legacy_categoria, ordem)
select distinct on (lower(trim(e.categoria))) trim(e.categoria), trim(e.categoria), 100
from hg_expenses e
where e.categoria is not null and trim(e.categoria) <> ''
  and not exists (
    select 1 from hg_financial_classifications fc
    where lower(fc.nome) = lower(trim(e.categoria)) and fc.parent_id is null
  );

-- 1c. Migra a tabela hg_finance_categories (se houver linhas).
insert into hg_financial_classifications (nome, cor, ordem)
select fc0.nome, fc0.cor, 100
from hg_finance_categories fc0
where not exists (
  select 1 from hg_financial_classifications fc
  where lower(fc.nome) = lower(fc0.nome) and fc.parent_id is null
);

-- 1d. Seed de classificações comuns de casamento (só as que não existirem).
insert into hg_financial_classifications (nome, ordem)
select v.nome, v.ordem from (values
  ('Alimentação',10),('Bebidas',11),('Buffet',12),('Espaço',13),('Decoração',14),
  ('Fotografia',15),('Filmagem',16),('Cerimonial',17),('Música',18),('Vestuário',19),
  ('Beleza',20),('Convites',21),('Transporte',22),('Hospedagem',23),('Lua de mel',24),
  ('Presentes',25),('Marketing',26),('Outros',99)
) v(nome, ordem)
where not exists (
  select 1 from hg_financial_classifications fc
  where lower(fc.nome) = lower(v.nome) and fc.parent_id is null
);

-- ---------- 2. Novas colunas em despesas e parcelas ----------
alter table hg_expenses add column if not exists classification_id uuid references hg_financial_classifications(id) on delete set null;
alter table hg_expenses add column if not exists competencia date;        -- mês a que a despesa pertence
alter table hg_expenses add column if not exists data_contratacao date;   -- quando o serviço foi contratado
alter table hg_expense_installments add column if not exists previsao date; -- estimativa quando não há vencimento

-- 2a. Backfill de classification_id: primeiro pela categoria de texto, depois pelo centro de custo.
update hg_expenses e
set classification_id = fc.id
from hg_financial_classifications fc
where e.classification_id is null
  and e.categoria is not null and trim(e.categoria) <> ''
  and lower(fc.nome) = lower(trim(e.categoria)) and fc.parent_id is null;

update hg_expenses e
set classification_id = fc.id
from hg_financial_classifications fc
where e.classification_id is null
  and e.cost_center_id is not null
  and fc.legacy_cost_center_id = e.cost_center_id;

-- ---------- 3. Métodos de pagamento ----------
create table if not exists hg_payment_methods (
  id     uuid primary key default gen_random_uuid(),
  chave  text unique not null,
  nome   text not null,
  ordem  int not null default 0,
  ativo  boolean not null default true
);
insert into hg_payment_methods (chave, nome, ordem) values
  ('pix','Pix',1),('dinheiro','Dinheiro',2),('transferencia','Transferência',3),
  ('boleto','Boleto',4),('cartao_credito','Cartão de crédito',5),('cartao_debito','Cartão de débito',6),
  ('cheque','Cheque',7),('financiamento','Financiamento',8),('permuta','Permuta',9),('outro','Outro',99)
on conflict (chave) do nothing;

-- ---------- 4. Contas financeiras ----------
create table if not exists hg_financial_accounts (
  id     uuid primary key default gen_random_uuid(),
  nome   text not null,
  tipo   text not null default 'conta' check (tipo in ('conta','carteira','cartao_credito','poupanca','outro')),
  saldo_inicial_cents bigint not null default 0,
  -- cartão de crédito (opcional)
  titular         text,
  dia_fechamento  int check (dia_fechamento between 1 and 31),
  dia_vencimento  int check (dia_vencimento between 1 and 31),
  ordem  int not null default 0,
  ativo  boolean not null default true,
  criado_em timestamptz not null default now()
);
insert into hg_financial_accounts (nome, tipo, ordem)
select 'Conta principal', 'conta', 1
where not exists (select 1 from hg_financial_accounts);

-- ---------- 5. Pagamentos (múltiplos e parciais por conta/parcela) ----------
create table if not exists hg_expense_payments (
  id             uuid primary key default gen_random_uuid(),
  expense_id     uuid not null references hg_expenses(id) on delete cascade,
  installment_id uuid references hg_expense_installments(id) on delete set null,
  valor_cents    bigint not null check (valor_cents > 0),
  data           date not null,
  metodo_id      uuid references hg_payment_methods(id) on delete set null,
  conta_id       uuid references hg_financial_accounts(id) on delete set null,
  responsavel    text,
  observacao     text,
  comprovante_id uuid references hg_comprovantes(id) on delete set null,
  estornado_em   timestamptz,          -- estorno preserva o histórico
  criado_por     uuid references hg_profiles(id) on delete set null,
  criado_em      timestamptz not null default now()
);

-- 5a. Backfill: parcelas já marcadas como pagas viram um pagamento integral.
insert into hg_expense_payments (expense_id, installment_id, valor_cents, data, observacao)
select i.expense_id, i.id, i.valor_cents, coalesce(i.pago_em, current_date),
       'Backfill automático (migração 0005) — parcela marcada como paga no modelo anterior.'
from hg_expense_installments i
where i.pago = true and i.valor_cents > 0
  and not exists (select 1 from hg_expense_payments p where p.installment_id = i.id);

-- ---------- 6. Índices de desempenho ----------
create index if not exists idx_hg_exp_class      on hg_expenses(classification_id);
create index if not exists idx_hg_exp_supplier   on hg_expenses(supplier_id);
create index if not exists idx_hg_exp_competencia on hg_expenses(competencia);
create index if not exists idx_hg_inst_expense   on hg_expense_installments(expense_id);
create index if not exists idx_hg_inst_previsao  on hg_expense_installments(previsao);
create index if not exists idx_hg_pay_expense    on hg_expense_payments(expense_id);
create index if not exists idx_hg_pay_data       on hg_expense_payments(data);
create index if not exists idx_hg_pay_installment on hg_expense_payments(installment_id);

-- ---------- 7. RLS ----------
do $$
declare t text;
begin
  foreach t in array array[
    'hg_financial_classifications','hg_payment_methods','hg_financial_accounts','hg_expense_payments'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "hg membro %1$s" on %1$s;', t);
    execute format('create policy "hg membro %1$s" on %1$s for all to authenticated using (hg_is_member()) with check (hg_is_member());', t);
  end loop;
end $$;

-- ---------- 8. Aposentadoria (sem exclusão) ----------
comment on table hg_budget_projections is 'LEGADO — projeção manual substituída pelo cálculo automático (0005). Não usar.';
comment on table hg_cost_centers is 'LEGADO — migrado para hg_financial_classifications (0005). Mantido até validação.';
comment on table hg_finance_categories is 'LEGADO — migrado para hg_financial_classifications (0005). Mantido até validação.';
