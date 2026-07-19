-- ============================================================
-- Helena & Guilherme · Migration 0004
-- Central de relacionamento e comunicação + Padrinhos/Madrinhas
-- ------------------------------------------------------------
-- Convenções (iguais ao banco vivo): tabelas prefixadas com hg_,
-- RLS "for all to authenticated using (hg_is_member())".
-- Nada aqui envia mensagem: o envio depende de canal validado (provedor).
-- Nenhum dado pessoal é inventado; tudo é preenchido pelos noivos/Evania.
-- ============================================================

-- ---------- 0. Gatilho de atualizado_em (idempotente) ----------
create or replace function hg_touch_updated() returns trigger
language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

-- ============================================================
-- 1. RELACIONAMENTO / PERFIL DE COMUNICAÇÃO
-- ============================================================

-- Segmentos de relacionamento (§4). Proximidade fica SEPARADA do parentesco.
create table if not exists hg_relationship_types (
  id        uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('parentesco','amizade','profissional','proximidade')),
  chave     text not null,
  nome      text not null,
  ordem     int not null default 0,
  ativo     boolean not null default true,
  unique (categoria, chave)
);

-- Perfil individual de comunicação do convidado (§3). 1:1 com hg_guests.
-- Pode herdar o contexto da família e sobrescrever campo a campo.
create table if not exists hg_guest_comm_profiles (
  guest_id            uuid primary key references hg_guests(id) on delete cascade,
  nome_preferido      text,
  apelido_autorizado  text,
  papel               text,          -- convidado | padrinho | madrinha | familia ...
  lado                text,          -- helena | guilherme | ambos
  -- Relacionamento
  parentesco          text,
  relacao_helena      text,
  relacao_guilherme   text,
  relacao_ambos       text,
  proximidade         text,          -- muito_proximo | proximo | conhecido ...
  convivencia         text,
  tempo_relacionamento text,
  historia_autorizada text,
  assuntos_permitidos text,
  assuntos_proibidos  text,
  -- Comunicação
  tom                 text,
  formalidade         text,
  emocao              text,
  humor               text,
  tamanho             text,          -- curto | medio | longo
  tratamento          text,          -- voce | senhor | senhora ...
  canal_preferido     text,          -- whatsapp | email | audio
  horario_preferido   text,
  cidade_partida      text,
  precisa_hospedagem  boolean,
  -- Consentimento / preferências (§ consentimento)
  aceita_whatsapp     boolean not null default true,
  aceita_email        boolean not null default true,
  aceita_audio        boolean not null default true,
  aceita_personalizada boolean not null default true,
  aceita_lembretes    boolean not null default true,
  opt_out             boolean not null default false,
  -- Herança
  herdar_familia      boolean not null default true,
  observacao          text,
  atualizado_em       timestamptz not null default now()
);
drop trigger if exists trg_hg_guest_comm_prof_upd on hg_guest_comm_profiles;
create trigger trg_hg_guest_comm_prof_upd before update on hg_guest_comm_profiles
  for each row execute function hg_touch_updated();

-- Contexto de comunicação da família (herdável pelos membros).
create table if not exists hg_family_comm_context (
  group_id            uuid primary key references hg_guest_groups(id) on delete cascade,
  tom                 text,
  formalidade         text,
  tratamento          text,
  assuntos_permitidos text,
  assuntos_proibidos  text,
  historia_autorizada text,
  observacao          text,
  atualizado_em       timestamptz not null default now()
);
drop trigger if exists trg_hg_family_comm_ctx_upd on hg_family_comm_context;
create trigger trg_hg_family_comm_ctx_upd before update on hg_family_comm_context
  for each row execute function hg_touch_updated();

-- ============================================================
-- 2. PADRINHOS / MADRINHAS
-- ============================================================

create table if not exists hg_wedding_party (
  id             uuid primary key default gen_random_uuid(),
  guest_id       uuid references hg_guests(id) on delete set null,  -- vínculo opcional
  nome           text not null,
  papel          text not null default 'padrinho' check (papel in ('padrinho','madrinha')),
  lado           text check (lado in ('helena','guilherme','ambos') or lado is null),
  telefone       text,
  instagram      text,
  cidade         text,
  relacao        text,          -- relação com o casal (texto autorizado)
  status         text not null default 'convidado'
                 check (status in ('convidado','confirmado','recusado','pendente')),
  traje_status   text not null default 'pendente'
                 check (traje_status in ('pendente','medidas_solicitadas','medidas_recebidas','confirmado')),
  medidas        jsonb,
  ensaio_status  text not null default 'pendente'
                 check (ensaio_status in ('pendente','convidado','confirmado','ausente')),
  hospedagem_status text not null default 'nao_precisa'
                 check (hospedagem_status in ('nao_precisa','pendente','resolvida')),
  transporte_status text not null default 'nao_precisa'
                 check (transporte_status in ('nao_precisa','pendente','resolvido')),
  observacao     text,
  ordem          int not null default 0,
  deleted_at     timestamptz,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index if not exists idx_hg_party_status on hg_wedding_party(status);
drop trigger if exists trg_hg_party_upd on hg_wedding_party;
create trigger trg_hg_party_upd before update on hg_wedding_party
  for each row execute function hg_touch_updated();

-- Duplas / casais de padrinhos.
create table if not exists hg_wedding_party_pairs (
  id         uuid primary key default gen_random_uuid(),
  nome       text,
  member_a   uuid references hg_wedding_party(id) on delete cascade,
  member_b   uuid references hg_wedding_party(id) on delete cascade,
  tipo       text not null default 'dupla' check (tipo in ('dupla','casal')),
  observacao text,
  criado_em  timestamptz not null default now()
);

-- Grupos de padrinhos.
create table if not exists hg_wedding_party_groups (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  descricao  text,
  criado_em  timestamptz not null default now()
);
create table if not exists hg_wedding_party_group_members (
  group_id  uuid not null references hg_wedding_party_groups(id) on delete cascade,
  member_id uuid not null references hg_wedding_party(id) on delete cascade,
  primary key (group_id, member_id)
);

-- Compromissos (traje, medidas, reunião, ensaio, chegada...). member_id NULL = todos.
create table if not exists hg_wedding_party_commitments (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid references hg_wedding_party(id) on delete cascade,
  tipo       text not null,        -- traje | medidas | reuniao_noivos | reuniao_cerimonial | ensaio | chegada | outro
  titulo     text not null,
  quando     timestamptz,
  local      text,
  status     text not null default 'aberto' check (status in ('aberto','confirmado','concluido','cancelado')),
  observacao text,
  criado_em  timestamptz not null default now()
);
create index if not exists idx_hg_party_commit_quando on hg_wedding_party_commitments(quando);

-- Tarefas dos padrinhos.
create table if not exists hg_wedding_party_tasks (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references hg_wedding_party(id) on delete cascade,
  titulo      text not null,
  descricao   text,
  responsavel text,
  status      text not null default 'aberta' check (status in ('aberta','em_andamento','concluida','cancelada')),
  prioridade  text not null default 'normal' check (prioridade in ('baixa','normal','alta','urgente')),
  prazo       date,
  criado_em   timestamptz not null default now()
);

-- ============================================================
-- 3. ESTÚDIO DE PROMPTS (IA) — versionado (§9, §27)
-- ============================================================

create table if not exists hg_ai_prompts (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  nome                text not null,
  descricao           text,
  categoria           text,
  modulo              text,          -- comunicacao | padrinhos | ...
  tipo_mensagem       text,          -- convite | lembrete | agradecimento | roteiro_audio ...
  publico             text,
  momento             text,          -- fase da jornada
  status              text not null default 'rascunho' check (status in ('rascunho','publicado','arquivado')),
  versao_publicada_id uuid,          -- FK adicionada depois (referência circular)
  criado_por          uuid references hg_profiles(id) on delete set null,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);
drop trigger if exists trg_hg_ai_prompts_upd on hg_ai_prompts;
create trigger trg_hg_ai_prompts_upd before update on hg_ai_prompts
  for each row execute function hg_touch_updated();

create table if not exists hg_ai_prompt_versions (
  id                  uuid primary key default gen_random_uuid(),
  prompt_id           uuid not null references hg_ai_prompts(id) on delete cascade,
  versao              int not null,
  identidade          text,
  objetivo            text,
  contexto_permitido  jsonb not null default '[]'::jsonb,   -- categorias de dados liberadas
  contexto_proibido   jsonb not null default '[]'::jsonb,
  regras              text,
  formato             text,
  tom                 text,
  call_to_action      text,
  tamanho_min         int,
  tamanho_max         int,
  variaveis_permitidas jsonb not null default '[]'::jsonb,
  variaveis_proibidas  jsonb not null default '[]'::jsonb,
  exemplos            jsonb not null default '[]'::jsonb,
  contraexemplos      jsonb not null default '[]'::jsonb,
  output_schema       text,
  model_settings      jsonb not null default '{}'::jsonb,
  fallback            text,
  status              text not null default 'rascunho' check (status in ('rascunho','publicado','arquivado')),
  criado_por          uuid references hg_profiles(id) on delete set null,
  aprovado_por        uuid references hg_profiles(id) on delete set null,
  publicado_em        timestamptz,
  criado_em           timestamptz not null default now(),
  unique (prompt_id, versao)
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname='hg_ai_prompts_versao_fk') then
    alter table hg_ai_prompts
      add constraint hg_ai_prompts_versao_fk
      foreign key (versao_publicada_id) references hg_ai_prompt_versions(id) on delete set null;
  end if;
end $$;

create table if not exists hg_ai_prompt_tests (
  id                 uuid primary key default gen_random_uuid(),
  prompt_version_id  uuid references hg_ai_prompt_versions(id) on delete cascade,
  entrada            jsonb,             -- dados (mascarados) usados no teste
  contexto_enviado   jsonb,             -- o que foi de fato enviado à IA (sem sensíveis)
  contexto_removido  jsonb,             -- categorias removidas por privacidade
  saida              text,
  avaliacao          jsonb,             -- {pessoal, natural, correto, inventou, ...}
  criado_por         uuid references hg_profiles(id) on delete set null,
  criado_em          timestamptz not null default now()
);

-- Logs de geração — NUNCA guardam conteúdo sensível, só categorias e metadados.
create table if not exists hg_ai_generation_logs (
  id                 uuid primary key default gen_random_uuid(),
  prompt_version_id  uuid references hg_ai_prompt_versions(id) on delete set null,
  provider           text,
  model              text,
  categorias_contexto jsonb,
  tokens_entrada     int,
  tokens_saida       int,
  status             text,
  erro               text,
  criado_em          timestamptz not null default now()
);

-- ============================================================
-- 4. JORNADAS E FASES (§5, §6, §7)
-- ============================================================

create table if not exists hg_comm_journeys (
  id                uuid primary key default gen_random_uuid(),
  chave             text unique not null,
  nome              text not null,
  objetivo          text,
  publico           text,            -- convidados | padrinhos | familias | outra_cidade ...
  canais            text not null default 'whatsapp',
  aprovacao         text not null default 'evania',
  limite_freq_dias  int not null default 2,
  ativa             boolean not null default true,
  ordem             int not null default 0,
  criado_em         timestamptz not null default now()
);

create table if not exists hg_comm_journey_stages (
  id               uuid primary key default gen_random_uuid(),
  journey_id       uuid not null references hg_comm_journeys(id) on delete cascade,
  ordem            int not null default 0,
  fase             int,             -- 1..7 (aquecimento)
  nome             text not null,
  objetivo         text,
  tipo_mensagem    text,
  gatilho          text,            -- descrição do gatilho/condição
  intervalo_min_dias int not null default 0,
  canal            text not null default 'whatsapp',
  aprovacao        text not null default 'evania',
  prompt_id        uuid references hg_ai_prompts(id) on delete set null,
  audio_id         uuid,            -- FK adicionada após hg_audio_assets
  ativa            boolean not null default true
);

-- ============================================================
-- 5. CENTRO DE ÁUDIOS (§13-§17)
-- ============================================================

create table if not exists hg_audio_assets (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  descricao     text,
  categoria     text,            -- convite | agradecimento | lembrete | padrinhos ...
  storage_path  text,            -- caminho no bucket privado hg-audios
  formato       text,
  duracao_seg   int,
  tamanho_bytes bigint,
  transcricao   text,
  transcricao_auto boolean not null default false,
  legenda       text,
  roteiro       text,
  gravado_por   text,
  aprovado_por  uuid references hg_profiles(id) on delete set null,
  publico       text,
  guest_id      uuid references hg_guests(id) on delete set null,
  group_id      uuid references hg_guest_groups(id) on delete set null,
  party_member_id uuid references hg_wedding_party(id) on delete set null,
  commitment_id uuid references hg_wedding_party_commitments(id) on delete set null,
  tipo_mensagem text,
  quick_reply   boolean not null default false,
  validade      date,
  status        text not null default 'rascunho'
                check (status in ('rascunho','gravado','em_revisao','aprovado','disponivel','agendado','utilizado','expirado','arquivado')),
  versao        int not null default 1,
  deleted_at    timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_hg_audio_status on hg_audio_assets(status);
drop trigger if exists trg_hg_audio_upd on hg_audio_assets;
create trigger trg_hg_audio_upd before update on hg_audio_assets
  for each row execute function hg_touch_updated();

create table if not exists hg_audio_versions (
  id            uuid primary key default gen_random_uuid(),
  audio_id      uuid not null references hg_audio_assets(id) on delete cascade,
  versao        int not null,
  storage_path  text,
  duracao_seg   int,
  tamanho_bytes bigint,
  criado_em     timestamptz not null default now(),
  unique (audio_id, versao)
);

-- Agora que hg_audio_assets existe, liga o áudio às fases da jornada.
do $$ begin
  if not exists (select 1 from pg_constraint where conname='hg_journey_stage_audio_fk') then
    alter table hg_comm_journey_stages
      add constraint hg_journey_stage_audio_fk
      foreign key (audio_id) references hg_audio_assets(id) on delete set null;
  end if;
end $$;

-- Respostas rápidas (texto ou áudio).
create table if not exists hg_quick_replies (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  categoria  text,
  tipo       text not null default 'texto' check (tipo in ('texto','audio')),
  corpo      text,
  audio_id   uuid references hg_audio_assets(id) on delete set null,
  ativa      boolean not null default true,
  criado_em  timestamptz not null default now()
);

-- ============================================================
-- 6. CAMPANHAS, MENSAGENS, ENTREGAS (§7, §26)
-- ============================================================

create table if not exists hg_comm_campaigns (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  tipo           text not null default 'manual' check (tipo in ('manual','programada','condicional')),
  journey_id     uuid references hg_comm_journeys(id) on delete set null,
  journey_stage_id uuid references hg_comm_journey_stages(id) on delete set null,
  canal          text not null default 'whatsapp',
  status         text not null default 'rascunho'
                 check (status in ('rascunho','revisao','aprovada','agendada','enviando','concluida','pausada','cancelada')),
  publico_filtros jsonb not null default '{}'::jsonb,
  corpo_modelo   text,
  prompt_id      uuid references hg_ai_prompts(id) on delete set null,
  audio_id       uuid references hg_audio_assets(id) on delete set null,
  aprovacao_tipo text not null default 'evania'
                 check (aprovacao_tipo in ('nenhuma','evania','um_noivo','dois_noivos','admin')),
  aprovado_por   uuid references hg_profiles(id) on delete set null,
  agendado_para  timestamptz,
  criado_por     uuid references hg_profiles(id) on delete set null,
  deleted_at     timestamptz,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
drop trigger if exists trg_hg_campaign_upd on hg_comm_campaigns;
create trigger trg_hg_campaign_upd before update on hg_comm_campaigns
  for each row execute function hg_touch_updated();

create table if not exists hg_comm_campaign_audiences (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references hg_comm_campaigns(id) on delete cascade,
  guest_id      uuid references hg_guests(id) on delete cascade,
  party_member_id uuid references hg_wedding_party(id) on delete cascade,
  incluido      boolean not null default true,
  motivo_exclusao text,
  unique (campaign_id, guest_id)
);

create table if not exists hg_comm_messages (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid references hg_comm_campaigns(id) on delete cascade,
  journey_stage_id   uuid references hg_comm_journey_stages(id) on delete set null,
  guest_id           uuid references hg_guests(id) on delete set null,
  party_member_id    uuid references hg_wedding_party(id) on delete set null,
  canal              text not null default 'whatsapp',
  corpo              text,
  origem             text not null default 'manual' check (origem in ('ia','manual','modelo','audio')),
  prompt_version_id  uuid references hg_ai_prompt_versions(id) on delete set null,
  audio_id           uuid references hg_audio_assets(id) on delete set null,
  status             text not null default 'rascunho'
                     check (status in ('rascunho','aguardando_aprovacao','aprovada','agendada','enviando','entregue','lida','falha','cancelada')),
  aprovado_por       uuid references hg_profiles(id) on delete set null,
  agendado_para      timestamptz,
  idem_key           text unique,   -- deduplicação/idempotência (§19)
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);
create index if not exists idx_hg_msg_status on hg_comm_messages(status);
drop trigger if exists trg_hg_msg_upd on hg_comm_messages;
create trigger trg_hg_msg_upd before update on hg_comm_messages
  for each row execute function hg_touch_updated();

create table if not exists hg_comm_message_versions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references hg_comm_messages(id) on delete cascade,
  versao      int not null,
  corpo       text,
  origem      text,
  criado_por  uuid references hg_profiles(id) on delete set null,
  criado_em   timestamptz not null default now(),
  unique (message_id, versao)
);

create table if not exists hg_comm_deliveries (
  id             uuid primary key default gen_random_uuid(),
  message_id     uuid not null references hg_comm_messages(id) on delete cascade,
  guest_id       uuid references hg_guests(id) on delete set null,
  canal          text not null default 'whatsapp',
  status         text not null default 'enfileirado'
                 check (status in ('enfileirado','enviado','entregue','lido','falha')),
  provider_msg_id text,
  erro           text,
  tentativa      int not null default 0,
  atualizado_em  timestamptz not null default now()
);
create index if not exists idx_hg_delivery_status on hg_comm_deliveries(status);

-- ============================================================
-- 7. CAIXA DE ENTRADA / THREADS / TAREFAS (§8, §21, §22)
-- ============================================================

create table if not exists hg_comm_threads (
  id         uuid primary key default gen_random_uuid(),
  guest_id   uuid references hg_guests(id) on delete set null,
  canal      text not null default 'whatsapp',
  assunto    text,
  status     text not null default 'aberta' check (status in ('aberta','resolvida','arquivada')),
  ultima_em  timestamptz not null default now(),
  criado_em  timestamptz not null default now()
);

create table if not exists hg_comm_inbound (
  id                uuid primary key default gen_random_uuid(),
  thread_id         uuid references hg_comm_threads(id) on delete set null,
  guest_id          uuid references hg_guests(id) on delete set null,
  telefone          text,
  canal             text not null default 'whatsapp',
  tipo              text not null default 'texto' check (tipo in ('texto','audio','imagem','documento')),
  corpo             text,
  media_path        text,           -- bucket privado
  transcricao       text,
  transcricao_auto  boolean not null default false,
  classificacao_sugerida text,      -- sugestão da IA (NÃO altera dados críticos)
  classificacao     text,           -- confirmada por humano
  lida              boolean not null default false,
  atribuido_para    text,
  resolvido         boolean not null default false,
  provider_msg_id   text unique,    -- idempotência de webhook
  criado_em         timestamptz not null default now()
);
create index if not exists idx_hg_inbound_lida on hg_comm_inbound(lida);

create table if not exists hg_comm_tasks (
  id          uuid primary key default gen_random_uuid(),
  origem      text not null default 'manual' check (origem in ('inbound','campanha','manual')),
  inbound_id  uuid references hg_comm_inbound(id) on delete set null,
  guest_id    uuid references hg_guests(id) on delete set null,
  titulo      text not null,
  descricao   text,
  categoria   text,
  responsavel text,
  status      text not null default 'aberta' check (status in ('aberta','em_andamento','concluida','cancelada')),
  prioridade  text not null default 'normal' check (prioridade in ('baixa','normal','alta','urgente')),
  prazo       date,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_hg_tasks_status on hg_comm_tasks(status);

-- ============================================================
-- 8. WHATSAPP OFICIAL (§18) — sem credenciais aqui (usar env/cofre)
-- ============================================================

create table if not exists hg_whatsapp_channels (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null default 'WhatsApp oficial',
  numero           text,
  pais             text default 'BR',
  ddd              text,
  display_name     text,
  responsavel      text default 'Evania',
  provedor         text,            -- cloud_api | outro (referência; credencial fica em env)
  ambiente         text not null default 'producao' check (ambiente in ('sandbox','producao')),
  status           text not null default 'pendente' check (status in ('pendente','validando','ativo','erro')),
  horario_inicio   time not null default '08:00',
  horario_fim      time not null default '20:00',
  limite_diario    int not null default 500,
  limite_por_pessoa int not null default 3,
  assinatura       text,
  ultima_validacao timestamptz,
  ultimo_envio     timestamptz,
  ultimo_erro      text,
  ativo            boolean not null default false,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);
drop trigger if exists trg_hg_wa_upd on hg_whatsapp_channels;
create trigger trg_hg_wa_upd before update on hg_whatsapp_channels
  for each row execute function hg_touch_updated();

-- ============================================================
-- 9. RLS — membro autenticado gerencia tudo (padrão hg_is_member())
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'hg_relationship_types','hg_guest_comm_profiles','hg_family_comm_context',
    'hg_wedding_party','hg_wedding_party_pairs','hg_wedding_party_groups',
    'hg_wedding_party_group_members','hg_wedding_party_commitments','hg_wedding_party_tasks',
    'hg_ai_prompts','hg_ai_prompt_versions','hg_ai_prompt_tests','hg_ai_generation_logs',
    'hg_comm_journeys','hg_comm_journey_stages',
    'hg_audio_assets','hg_audio_versions','hg_quick_replies',
    'hg_comm_campaigns','hg_comm_campaign_audiences','hg_comm_messages',
    'hg_comm_message_versions','hg_comm_deliveries',
    'hg_comm_threads','hg_comm_inbound','hg_comm_tasks','hg_whatsapp_channels'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'drop policy if exists "hg membro %1$s" on %1$s;', t
    );
    execute format(
      'create policy "hg membro %1$s" on %1$s for all to authenticated using (hg_is_member()) with check (hg_is_member());',
      t
    );
  end loop;
end $$;

-- ============================================================
-- 10. SEEDS (segmentos, jornadas, fases, prompt inicial, WhatsApp)
-- ============================================================

-- Segmentos de relacionamento (§4)
insert into hg_relationship_types (categoria, chave, nome, ordem) values
  ('parentesco','pai','Pai',1),('parentesco','mae','Mãe',2),
  ('parentesco','irmao','Irmão',3),('parentesco','irma','Irmã',4),
  ('parentesco','primo','Primo',5),('parentesco','prima','Prima',6),
  ('parentesco','tio','Tio',7),('parentesco','tia','Tia',8),
  ('parentesco','avo_m','Avô',9),('parentesco','avo_f','Avó',10),
  ('parentesco','sobrinho','Sobrinho',11),('parentesco','sobrinha','Sobrinha',12),
  ('parentesco','cunhado','Cunhado',13),('parentesco','cunhada','Cunhada',14),
  ('parentesco','padrinho','Padrinho',15),('parentesco','madrinha','Madrinha',16),
  ('parentesco','outro','Outro',17),
  ('amizade','amigo_muito_proximo','Amigo muito próximo',1),
  ('amizade','amiga_muito_proxima','Amiga muito próxima',2),
  ('amizade','amigo_proximo','Amigo próximo',3),
  ('amizade','amiga_proxima','Amiga próxima',4),
  ('amizade','amigo_infancia','Amigo de infância',5),
  ('amizade','amiga_infancia','Amiga de infância',6),
  ('amizade','amigo_muitos_anos','Amigo de muitos anos',7),
  ('amizade','amiga_muitos_anos','Amiga de muitos anos',8),
  ('amizade','amigo_familia','Amigo da família',9),
  ('amizade','amiga_familia','Amiga da família',10),
  ('amizade','amigo_trabalho','Amigo do trabalho',11),
  ('amizade','amiga_trabalho','Amiga do trabalho',12),
  ('amizade','amigo_faculdade','Amigo da faculdade',13),
  ('amizade','amiga_faculdade','Amiga da faculdade',14),
  ('amizade','amigo','Amigo',15),('amizade','amiga','Amiga',16),
  ('amizade','conhecido','Conhecido',17),('amizade','conhecida','Conhecida',18),
  ('profissional','colega','Colega',1),('profissional','socio','Sócio',2),
  ('profissional','socia','Sócia',3),('profissional','parceiro','Parceiro',4),
  ('profissional','parceira','Parceira',5),('profissional','cliente','Cliente',6),
  ('profissional','fornecedor','Fornecedor',7),('profissional','prof_outro','Outro',8),
  ('proximidade','muito_proximo','Muito próximo(a)',1),
  ('proximidade','proximo','Próximo(a)',2),
  ('proximidade','medio','Convivência média',3),
  ('proximidade','distante','Pouca convivência',4),
  ('proximidade','conhecido','Conhecido(a)',5)
on conflict (categoria, chave) do nothing;

-- Jornadas iniciais (§5-§7) — editáveis, sem datas hardcoded
insert into hg_comm_journeys (chave, nome, objetivo, publico, aprovacao, limite_freq_dias, ordem) values
  ('convidados','Convidados','Aquecer, convidar e confirmar presença','convidados','evania',2,1),
  ('padrinhos','Padrinhos e madrinhas','Conduzir a jornada dos padrinhos até o dia','padrinhos','dois_noivos',2,2),
  ('familias','Famílias','Comunicar a família de forma acolhedora','familias','evania',3,3),
  ('outra_cidade','Convidados de outra cidade','Ajudar com viagem e hospedagem','outra_cidade','evania',3,4)
on conflict (chave) do nothing;

-- Fases de aquecimento (§5) na jornada de convidados
do $$
declare jid uuid;
begin
  select id into jid from hg_comm_journeys where chave='convidados';
  if jid is not null and not exists (select 1 from hg_comm_journey_stages where journey_id=jid) then
    insert into hg_comm_journey_stages (journey_id, ordem, fase, nome, objetivo, tipo_mensagem, intervalo_min_dias) values
      (jid,1,1,'Conexão','Apresentar o casamento e reforçar a importância da pessoa','convite',0),
      (jid,2,2,'Envolvimento','Fazer o convidado se sentir parte da construção','bastidores',7),
      (jid,3,3,'Decisão','Estimular a confirmação de presença (RSVP)','rsvp',7),
      (jid,4,4,'Planejamento','Ajudar a organizar viagem e participação','planejamento',7),
      (jid,5,5,'Preparação final','Reduzir dúvidas e evitar atrasos','preparacao',3),
      (jid,6,6,'Dia do casamento','Orientar sem gerar excesso de mensagens','dia',1),
      (jid,7,7,'Pós-evento','Agradecer e preservar a relação','agradecimento',1);
  end if;
end $$;

-- Prompt inicial (§11) com uma versão publicada
do $$
declare pid uuid; vid uuid;
begin
  if not exists (select 1 from hg_ai_prompts where slug='mensagem-personalizada-convidado') then
    insert into hg_ai_prompts (slug, nome, descricao, categoria, modulo, tipo_mensagem, publico, momento, status)
    values ('mensagem-personalizada-convidado','Mensagem personalizada para convidado',
            'Gera um rascunho humano e pessoal a partir de dados autorizados.',
            'mensagem','comunicacao','personalizada','convidados','conexao','publicado')
    returning id into pid;

    insert into hg_ai_prompt_versions (
      prompt_id, versao, identidade, objetivo, contexto_permitido, contexto_proibido,
      regras, formato, tom, call_to_action, tamanho_min, tamanho_max,
      variaveis_permitidas, status, publicado_em
    ) values (
      pid, 1,
      'Você é um redator especializado em comunicação humana para casamentos.',
      'Criar uma mensagem personalizada para {{primeiro_nome}}.',
      '["nome","primeiro_nome","familia","papel","parentesco","proximidade","cidade","fase_jornada","canal"]'::jsonb,
      '["financeiro","valor_presente","observacoes_internas","tokens","documentos","dados_saude","credenciais","dados_de_outras_familias"]'::jsonb,
      'Use somente informações fornecidas. Mencione o nome naturalmente, sem repetir. Não invente fatos, intimidade, apelidos, datas ou compromissos. Não exponha dados privados. Não mencione presentes sem autorização. Não pressione. Não pareça mensagem automática nem publicidade.',
      'Mensagem de WhatsApp, tamanho curto a médio, com uma chamada para ação quando fizer sentido.',
      'afetuoso, elegante e acolhedor',
      'Convidar para acompanhar o site do casamento e confirmar presença quando o RSVP abrir.',
      200, 600,
      '["primeiro_nome","nome","familia","papel","parentesco","proximidade","cidade","fase_jornada"]'::jsonb,
      'publicado', now()
    ) returning id into vid;

    update hg_ai_prompts set versao_publicada_id=vid where id=pid;
  end if;
end $$;

-- Roteiro de áudio (§15)
do $$
declare pid uuid; vid uuid;
begin
  if not exists (select 1 from hg_ai_prompts where slug='roteiro-audio-padrinho') then
    insert into hg_ai_prompts (slug, nome, descricao, categoria, modulo, tipo_mensagem, publico, momento, status)
    values ('roteiro-audio-padrinho','Roteiro de áudio para padrinho/madrinha',
            'Gera SOMENTE o roteiro textual para uma pessoa real gravar o áudio.',
            'roteiro','comunicacao','roteiro_audio','padrinhos','conexao','publicado')
    returning id into pid;
    insert into hg_ai_prompt_versions (prompt_id, versao, identidade, objetivo, contexto_permitido, contexto_proibido, regras, formato, tom, status, publicado_em)
    values (pid,1,
      'Você é um roteirista de mensagens afetivas para casamentos.',
      'Criar um roteiro curto para uma pessoa real gravar um áudio para {{primeiro_nome}}.',
      '["primeiro_nome","papel","relacao","cidade","fase_jornada"]'::jsonb,
      '["financeiro","valor_presente","observacoes_internas","tokens","documentos","credenciais"]'::jsonb,
      'Gere apenas o roteiro textual. Não invente histórias nem intimidade. A gravação será feita por uma pessoa real. Não use clonagem de voz.',
      'Roteiro de áudio de 20 a 40 segundos, com pontos obrigatórios e chamada para ação.',
      'natural e caloroso','publicado', now())
    returning id into vid;
    update hg_ai_prompts set versao_publicada_id=vid where id=pid;
  end if;
end $$;

-- Canal WhatsApp oficial (uma linha, pendente de configuração)
insert into hg_whatsapp_channels (nome, responsavel, status, ativo)
select 'WhatsApp oficial','Evania','pendente',false
where not exists (select 1 from hg_whatsapp_channels);

-- ============================================================
-- 11. PERMISSÕES DO MÓDULO (papel Evania + permissões novas)
-- ============================================================
-- Amplia os papéis para incluir 'evania' (responsável operacional).
alter table hg_profiles drop constraint if exists hg_profiles_papel_check;
alter table hg_profiles add constraint hg_profiles_papel_check
  check (papel in ('admin','noivos','financeiro','cerimonial','conteudo','recepcao','visualizacao','evania'));

insert into hg_role_permissions (papel, permissao) values
  ('evania','comunicacao_visualizar'),('evania','comunicacao_criar'),('evania','comunicacao_editar'),
  ('evania','comunicacao_agendar'),('evania','comunicacao_responder'),('evania','comunicacao_tarefas'),
  ('evania','padrinhos_visualizar'),('evania','padrinhos_editar'),
  ('evania','audio_gravar'),('evania','audio_enviar'),('evania','campanha_pausar'),
  ('noivos','comunicacao_aprovar'),('noivos','prompt_publicar'),('noivos','audio_aprovar'),
  ('cerimonial','comunicacao_operacional'),
  ('conteudo','comunicacao_modelos')
on conflict do nothing;
