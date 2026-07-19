-- ============================================================
-- Helena & Guilherme · 29.05.2027
-- Schema completo da plataforma de gestão do casamento
-- PostgreSQL / Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 0. PERFIS / ACESSO ADMINISTRATIVO
-- ============================================================

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text unique,
  papel       text not null default 'admin' check (papel in ('admin', 'organizador', 'recepcao')),
  criado_em   timestamptz not null default now()
);
comment on table profiles is 'Usuários do painel administrativo (noivos, organização, recepção).';

-- ============================================================
-- 1. CONFIGURAÇÃO GERAL DO SITE / CASAMENTO
-- ============================================================

create table if not exists wedding_settings (
  id              int primary key default 1 check (id = 1), -- singleton
  noiva           text not null default 'Helena',
  noivo           text not null default 'Guilherme',
  data_casamento  timestamptz not null default '2027-05-29T16:00:00-03:00',
  hashtag         text,
  historia        text,               -- texto "Nossa história"
  cor_primaria    text default '#8a7359',
  atualizado_em   timestamptz not null default now()
);

-- Locais (cerimônia, recepção) — para exibição e rota
create table if not exists venues (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('cerimonia', 'recepcao', 'outro')),
  nome        text not null,
  endereco    text,
  cidade      text,
  horario     text,
  latitude    numeric(9,6),
  longitude   numeric(9,6),
  maps_url    text,
  ordem       int default 0
);
comment on table venues is 'Locais do evento com coordenadas para rota até o local.';

-- Linha do tempo "Nossa história"
create table if not exists story_events (
  id      uuid primary key default gen_random_uuid(),
  ano     text,
  titulo  text not null,
  descricao text,
  ordem   int default 0
);

-- Galeria de fotos do site público
create table if not exists gallery_photos (
  id        uuid primary key default gen_random_uuid(),
  url       text not null,
  legenda   text,
  ordem     int default 0,
  criado_em timestamptz not null default now()
);

-- ============================================================
-- 2. CONVIDADOS · RSVP · QR CODE · ESPAÇO INFANTIL
-- ============================================================

-- Grupo/família de convite (um convite pode ter vários convidados)
create table if not exists guest_groups (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,               -- ex.: "Família Silva"
  lado         text check (lado in ('noiva', 'noivo', 'ambos')),
  max_convidados int default 1,
  observacao   text,
  criado_em    timestamptz not null default now()
);

create table if not exists guests (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid references guest_groups(id) on delete set null,
  nome          text not null,
  email         text,
  telefone      text,
  eh_crianca    boolean not null default false,
  faixa_etaria  text,                        -- ex.: "adulto", "0-3", "4-10"
  lado          text check (lado in ('noiva', 'noivo', 'ambos')),
  -- RSVP
  status        text not null default 'pendente'
                check (status in ('pendente', 'confirmado', 'recusado')),
  respondeu_em  timestamptz,
  mensagem      text,                        -- recado para os noivos
  restricao_alimentar text,
  -- QR Code individual
  qr_token      uuid not null default gen_random_uuid() unique,
  -- Alocação de mesa
  mesa          text,
  -- Check-in
  check_in_em   timestamptz,
  check_in_por  uuid references profiles(id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on column guests.qr_token is 'Token único usado para gerar o QR Code individual e o check-in.';
create index if not exists idx_guests_status on guests(status);
create index if not exists idx_guests_group on guests(group_id);

-- Espaço infantil — crianças cadastradas para o dia
create table if not exists children (
  id             uuid primary key default gen_random_uuid(),
  guest_id       uuid references guests(id) on delete cascade,      -- criança (se for convidada)
  responsavel_id uuid references guests(id) on delete set null,     -- responsável
  nome           text not null,
  idade          int,
  observacoes    text,                        -- alergias, cuidados especiais
  usara_espaco   boolean not null default true,
  criado_em      timestamptz not null default now()
);
comment on table children is 'Crianças para o espaço infantil monitorado.';

-- ============================================================
-- 3. LISTA DE PRESENTES · PAGAMENTOS (ASAAS)
-- ============================================================

create table if not exists gift_categories (
  id     uuid primary key default gen_random_uuid(),
  nome   text not null,
  ordem  int default 0
);

create table if not exists gifts (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references gift_categories(id) on delete set null,
  nome         text not null,
  descricao    text,
  imagem_url   text,
  preco        numeric(12,2) not null default 0,
  permite_cota boolean not null default false,   -- presente dividido em cotas
  quantidade   int default 1,
  status       text not null default 'disponivel'
               check (status in ('disponivel', 'reservado', 'adquirido')),
  ordem        int default 0,
  criado_em    timestamptz not null default now()
);
create index if not exists idx_gifts_status on gifts(status);

-- Pagamentos via Asaas (presentes, cotas, contribuições)
create table if not exists payments (
  id                uuid primary key default gen_random_uuid(),
  gift_id           uuid references gifts(id) on delete set null,
  guest_id          uuid references guests(id) on delete set null,
  -- Dados do pagador (mesmo sem cadastro de convidado)
  pagador_nome      text,
  pagador_email     text,
  pagador_telefone  text,
  mensagem          text,
  -- Valores
  valor             numeric(12,2) not null,
  metodo            text check (metodo in ('pix', 'cartao', 'boleto')),
  -- Integração Asaas
  provedor          text not null default 'asaas',
  asaas_payment_id  text unique,
  asaas_customer_id text,
  invoice_url       text,
  pix_qr_code       text,
  pix_copia_cola    text,
  status            text not null default 'pendente'
                    check (status in ('pendente', 'confirmado', 'recebido', 'estornado', 'cancelado', 'falhou')),
  pago_em           timestamptz,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
comment on table payments is 'Contribuições/pagamentos de presentes processados pelo Asaas.';
create index if not exists idx_payments_status on payments(status);
create index if not exists idx_payments_asaas on payments(asaas_payment_id);

-- ============================================================
-- 4. FORNECEDORES · CONTRATOS · DOCUMENTOS
-- ============================================================

create table if not exists suppliers (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  categoria    text,     -- buffet, foto, decoração, música, etc.
  contato_nome text,
  telefone     text,
  email        text,
  instagram    text,
  site         text,
  valor_total  numeric(12,2) default 0,
  status       text not null default 'prospeccao'
               check (status in ('prospeccao', 'negociando', 'contratado', 'concluido', 'cancelado')),
  observacoes  text,
  criado_em    timestamptz not null default now()
);

create table if not exists contracts (
  id             uuid primary key default gen_random_uuid(),
  supplier_id    uuid references suppliers(id) on delete set null,
  titulo         text not null,
  valor          numeric(12,2) not null default 0,
  data_assinatura date,
  data_evento    date,
  status         text not null default 'rascunho'
                 check (status in ('rascunho', 'pendente_assinatura', 'assinado', 'concluido', 'cancelado')),
  arquivo_url    text,
  observacoes    text,
  criado_em      timestamptz not null default now()
);

-- Parcelas do contrato (base para o financeiro e projeção)
create table if not exists contract_installments (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid references contracts(id) on delete cascade,
  numero       int,
  valor        numeric(12,2) not null,
  vencimento   date not null,
  pago         boolean not null default false,
  pago_em      date
);
create index if not exists idx_installments_venc on contract_installments(vencimento);

create table if not exists documents (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  categoria    text,   -- contrato, comprovante, certidão, RG, etc.
  arquivo_url  text not null,
  supplier_id  uuid references suppliers(id) on delete set null,
  contract_id  uuid references contracts(id) on delete set null,
  criado_em    timestamptz not null default now()
);

-- ============================================================
-- 5. CONTROLE FINANCEIRO · PROJEÇÃO MENSAL
-- ============================================================

create table if not exists finance_categories (
  id     uuid primary key default gen_random_uuid(),
  nome   text not null,
  tipo   text not null default 'despesa' check (tipo in ('despesa', 'receita')),
  cor    text
);

create table if not exists finance_transactions (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null check (tipo in ('despesa', 'receita')),
  category_id  uuid references finance_categories(id) on delete set null,
  supplier_id  uuid references suppliers(id) on delete set null,
  contract_id  uuid references contracts(id) on delete set null,
  descricao    text not null,
  valor        numeric(12,2) not null,
  data         date not null default current_date,
  status       text not null default 'previsto'
               check (status in ('previsto', 'pago', 'atrasado', 'cancelado')),
  criado_em    timestamptz not null default now()
);
create index if not exists idx_finance_data on finance_transactions(data);

-- Projeção mensal (orçado x realizado por mês)
create table if not exists budget_projections (
  id          uuid primary key default gen_random_uuid(),
  ano         int not null,
  mes         int not null check (mes between 1 and 12),
  orcado      numeric(12,2) not null default 0,
  realizado   numeric(12,2) not null default 0,
  observacao  text,
  unique (ano, mes)
);

-- ============================================================
-- 6. COMUNICAÇÃO
-- ============================================================

create table if not exists communications (
  id          uuid primary key default gen_random_uuid(),
  canal       text not null default 'email' check (canal in ('email', 'whatsapp', 'sms')),
  assunto     text,
  corpo       text not null,
  publico     text not null default 'todos'
              check (publico in ('todos', 'confirmados', 'pendentes', 'recusados', 'grupo')),
  group_id    uuid references guest_groups(id) on delete set null,
  agendado_para timestamptz,
  enviado_em  timestamptz,
  status      text not null default 'rascunho'
              check (status in ('rascunho', 'agendado', 'enviando', 'enviado', 'falhou')),
  criado_em   timestamptz not null default now()
);

create table if not exists communication_logs (
  id               uuid primary key default gen_random_uuid(),
  communication_id uuid references communications(id) on delete cascade,
  guest_id         uuid references guests(id) on delete set null,
  status           text not null default 'enfileirado'
                   check (status in ('enfileirado', 'enviado', 'entregue', 'falhou')),
  detalhe          text,
  criado_em        timestamptz not null default now()
);

-- ============================================================
-- 7. CHECK-IN NO DIA DO CASAMENTO
-- ============================================================

create table if not exists checkins (
  id          uuid primary key default gen_random_uuid(),
  guest_id    uuid not null references guests(id) on delete cascade,
  check_in_em timestamptz not null default now(),
  registrado_por uuid references profiles(id) on delete set null,
  observacao  text
);
create index if not exists idx_checkins_guest on checkins(guest_id);

-- ============================================================
-- 8. TRIGGERS DE atualizado_em
-- ============================================================

create or replace function set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

drop trigger if exists trg_guests_upd on guests;
create trigger trg_guests_upd before update on guests
  for each row execute function set_atualizado_em();

drop trigger if exists trg_payments_upd on payments;
create trigger trg_payments_upd before update on payments
  for each row execute function set_atualizado_em();

-- ============================================================
-- 9. SEED — dados iniciais
-- ============================================================

insert into wedding_settings (id) values (1) on conflict (id) do nothing;

insert into venues (tipo, nome, horario, ordem) values
  ('cerimonia', 'Local da cerimônia (a definir)', '16h00', 1),
  ('recepcao',  'Espaço da recepção (a definir)', '18h00', 2)
on conflict do nothing;

insert into story_events (ano, titulo, ordem) values
  ('2019', 'O primeiro encontro', 1),
  ('2022', 'Fomos morar juntos', 2),
  ('2025', 'O pedido de casamento', 3),
  ('2027', 'O grande dia', 4)
on conflict do nothing;
