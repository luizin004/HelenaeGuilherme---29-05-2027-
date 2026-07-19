-- ============================================================
-- Helena & Guilherme · Migration 0003
-- Financeiro em CENTAVOS + auditoria + soft-delete + perfis/permissões
-- Corrige o modelo financeiro (PROJECT_SPEC §6). Não popula valores (PEND-003).
-- ============================================================

-- ---------- 1. Perfis e permissões ----------
-- Amplia os papéis para os 7 perfis do briefing.
alter table profiles drop constraint if exists profiles_papel_check;
alter table profiles add constraint profiles_papel_check
  check (papel in ('admin','noivos','financeiro','cerimonial','conteudo','recepcao','visualizacao'));

create table if not exists role_permissions (
  papel      text not null,
  permissao  text not null,
  primary key (papel, permissao)
);
comment on table role_permissions is 'Permissões por papel (autorização por camada de dados).';

-- Permissões conhecidas (PROJECT_SPEC §5): visualizar, criar, editar, aprovar,
-- cancelar, arquivar, exportar, anexar, admin_users, admin_permissoes,
-- config_integracoes, registrar_pagamento, ver_auditoria, checkin, dados_pessoais.
insert into role_permissions (papel, permissao) values
  ('admin','*'),
  ('noivos','visualizar'),('noivos','criar'),('noivos','editar'),('noivos','aprovar'),('noivos','exportar'),
  ('financeiro','visualizar'),('financeiro','criar'),('financeiro','editar'),('financeiro','registrar_pagamento'),('financeiro','exportar'),('financeiro','anexar'),
  ('cerimonial','visualizar'),('cerimonial','criar'),('cerimonial','editar'),
  ('conteudo','visualizar'),('conteudo','editar'),
  ('recepcao','checkin'),('recepcao','visualizar'),
  ('visualizacao','visualizar')
on conflict do nothing;

-- ---------- 2. Auditoria (PROJECT_SPEC §10 / regra 21) ----------
create table if not exists audit_log (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid references profiles(id) on delete set null,
  modulo       text not null,
  acao         text not null,          -- create | update | delete | approve | pay | export ...
  registro     text,                   -- tabela:id
  valor_anterior jsonb,
  valor_novo   jsonb,
  justificativa text,
  ip           inet,
  user_agent   text,
  criado_em    timestamptz not null default now()
);
create index if not exists idx_audit_modulo on audit_log(modulo, criado_em);

-- ---------- 3. Soft-delete / arquivamento (regras 13-20) ----------
alter table guests               add column if not exists deleted_at timestamptz;
alter table gifts                add column if not exists deleted_at timestamptz;
alter table payments             add column if not exists deleted_at timestamptz;
alter table suppliers            add column if not exists deleted_at timestamptz;
alter table contracts            add column if not exists deleted_at timestamptz;
alter table documents            add column if not exists deleted_at timestamptz;

-- ---------- 4. Modelo financeiro em CENTAVOS ----------
-- Substitui o financeiro de 0001 (numeric) pelo modelo em centavos inteiros.

create table if not exists cost_centers (
  id     uuid primary key default gen_random_uuid(),
  chave  text unique not null,   -- cerimonia | recepcao | noivos | convidados | estrutura | administrativo
  nome   text not null,
  ordem  int default 0
);
insert into cost_centers (chave, nome, ordem) values
  ('cerimonia','Cerimônia',1),('recepcao','Recepção',2),('noivos','Noivos',3),
  ('convidados','Convidados',4),('estrutura','Estrutura',5),('administrativo','Administrativo',6)
on conflict (chave) do nothing;

-- Responsáveis pelo pagamento (≠ centro de custo). Fornecidos pela spec.
create table if not exists payers (
  id     uuid primary key default gen_random_uuid(),
  chave  text unique not null,   -- helena | guilherme | toninho | gratuito
  nome   text not null,
  gratuito boolean not null default false
);
insert into payers (chave, nome, gratuito) values
  ('helena','Helena',false),('guilherme','Guilherme',false),
  ('toninho','Toninho',false),('gratuito','Gratuito',true)
on conflict (chave) do nothing;

create table if not exists expenses (
  id             uuid primary key default gen_random_uuid(),
  descricao      text not null,
  supplier_id    uuid references suppliers(id) on delete set null,
  cost_center_id uuid references cost_centers(id) on delete set null,
  -- Estados (PROJECT_SPEC §6): orçado, cotado, aprovado, contratado, previsto, pago...
  estado         text not null default 'previsto'
                 check (estado in ('orcado','cotado','aprovado','contratado','previsto','pago','vencido','realizado','gratuito')),
  gratuito       boolean not null default false,
  -- Dinheiro em CENTAVOS. Valor desconhecido = NULL (regra 11), nunca 0.
  valor_total_cents bigint check (valor_total_cents is null or valor_total_cents >= 0),
  observacao     text,
  created_by     uuid references profiles(id) on delete set null,
  updated_by     uuid references profiles(id) on delete set null,
  deleted_at     timestamptz,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index if not exists idx_expenses_estado on expenses(estado);

-- Parcelas em centavos. A soma deve fechar o total (validado em domain/finance).
create table if not exists expense_installments (
  id           uuid primary key default gen_random_uuid(),
  expense_id   uuid not null references expenses(id) on delete cascade,
  numero       int not null,
  valor_cents  bigint not null check (valor_cents >= 0),
  vencimento   date,                     -- NULL = não vencível (regra 5)
  pago         boolean not null default false,
  pago_em      date,
  is_entrada   boolean not null default false  -- entrada faz parte do cronograma (regra 3)
);
create index if not exists idx_inst_venc on expense_installments(vencimento);

-- Divisão por responsáveis (a soma deve fechar o desembolso — regra 2).
create table if not exists expense_payer_splits (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references expenses(id) on delete cascade,
  payer_id    uuid not null references payers(id) on delete restrict,
  valor_cents bigint not null check (valor_cents >= 0),
  unique (expense_id, payer_id)
);

-- Renegociação preserva o cronograma anterior (regra 6): versionamento por versão.
create table if not exists expense_schedule_versions (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references expenses(id) on delete cascade,
  versao      int not null,
  snapshot    jsonb not null,           -- cópia das parcelas no momento da renegociação
  motivo      text,
  criado_em   timestamptz not null default now(),
  unique (expense_id, versao)
);

-- ---------- 5. RLS nas novas tabelas ----------
alter table role_permissions          enable row level security;
alter table audit_log                 enable row level security;
alter table cost_centers              enable row level security;
alter table payers                    enable row level security;
alter table expenses                  enable row level security;
alter table expense_installments      enable row level security;
alter table expense_payer_splits      enable row level security;
alter table expense_schedule_versions enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'role_permissions','audit_log','cost_centers','payers','expenses',
    'expense_installments','expense_payer_splits','expense_schedule_versions'
  ]
  loop
    execute format(
      'create policy "admin gerencia %1$s" on %1$s for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ---------- 6. Trigger de atualizado_em ----------
drop trigger if exists trg_expenses_upd on expenses;
create trigger trg_expenses_upd before update on expenses
  for each row execute function set_atualizado_em();
