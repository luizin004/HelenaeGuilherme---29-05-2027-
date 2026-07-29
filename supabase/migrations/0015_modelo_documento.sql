-- Modelo editável do documento de autorização/aprovação de orçamento.
-- Os DADOS continuam vindo do sistema (casal, evento, fornecedor, parcelas,
-- nota fiscal); aqui ficam só os TEXTOS e a composição visual, para os noivos
-- ajustarem o layout sem quebrar o documento.
create table if not exists hg_documento_modelo (
  id                     int primary key default 1 check (id = 1),
  -- Textos (aceitam marcadores: {{noivos}}, {{data}}, {{fornecedor}}, ...)
  cabecalho_titulo       text,
  cabecalho_legenda      text,
  titulo                 text,
  declaracao             text,
  rodape                 text,
  assinatura_1           text,
  assinatura_2           text,
  -- Rótulos das seções
  rotulo_contratantes    text,
  rotulo_contratado      text,
  rotulo_objeto          text,
  rotulo_pagamento       text,
  rotulo_nota_fiscal     text,
  rotulo_observacoes     text,
  -- Blocos visíveis
  mostrar_monograma      boolean not null default true,
  mostrar_evento         boolean not null default true,
  mostrar_objeto         boolean not null default true,
  mostrar_nota_fiscal    boolean not null default true,
  mostrar_declaracao     boolean not null default true,
  mostrar_assinaturas    boolean not null default true,
  mostrar_rodape         boolean not null default true,
  -- Aparência (token da paleta do casamento: gold | olive | moss)
  cor_destaque           text not null default 'gold',
  atualizado_em          timestamptz not null default now()
);

insert into hg_documento_modelo (id) values (1) on conflict (id) do nothing;

alter table hg_documento_modelo enable row level security;
drop policy if exists "hg membro hg_documento_modelo" on hg_documento_modelo;
create policy "hg membro hg_documento_modelo" on hg_documento_modelo
  for all to authenticated using (hg_is_member()) with check (hg_is_member());
