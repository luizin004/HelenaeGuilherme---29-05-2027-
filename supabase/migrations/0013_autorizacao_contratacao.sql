-- Aprovação de orçamento / autorização de contratação:
--  1. dados fixos dos contratantes e de faturamento (nota fiscal), preenchidos
--     uma única vez e reaproveitados em todo documento emitido;
--  2. campos por contrato para numerar e datar a autorização emitida;
--  3. documento e endereço do fornecedor (para qualificar o contratado).

-- ---------- 1. Dados de contratação (linha única, id = 1) ----------
create table if not exists hg_contratacao_config (
  id                    int primary key default 1 check (id = 1),
  -- Contratantes (os noivos)
  contratante_nome      text,
  contratante_documento text,
  contratante_rg        text,
  contratante_email     text,
  contratante_telefone  text,
  contratante2_nome     text,
  contratante2_documento text,
  -- Endereço dos contratantes
  endereco              text,
  cidade                text,
  uf                    text,
  cep                   text,
  -- Dados para emissão da nota fiscal
  nf_destinatario       text,
  nf_documento          text,
  nf_ie                 text,
  nf_im                 text,
  nf_endereco           text,
  nf_email              text,
  nf_observacoes        text,
  -- Texto padrão repetido em toda autorização
  condicoes_gerais      text,
  atualizado_em         timestamptz not null default now()
);

insert into hg_contratacao_config (id) values (1) on conflict (id) do nothing;

-- ---------- 2. Autorização emitida por contrato ----------
alter table hg_contracts
  add column if not exists escopo                text,
  add column if not exists autorizacao_seq       int,
  add column if not exists autorizacao_emitida_em timestamptz;

create unique index if not exists hg_contracts_autorizacao_seq_key
  on hg_contracts (autorizacao_seq)
  where autorizacao_seq is not null;

-- ---------- 3. Qualificação do fornecedor (contratado) ----------
alter table hg_suppliers
  add column if not exists documento text,
  add column if not exists endereco  text;

-- ---------- 4. RLS ----------
alter table hg_contratacao_config enable row level security;
drop policy if exists "hg membro hg_contratacao_config" on hg_contratacao_config;
create policy "hg membro hg_contratacao_config" on hg_contratacao_config
  for all to authenticated using (hg_is_member()) with check (hg_is_member());
