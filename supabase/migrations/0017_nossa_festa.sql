-- "Nossa Festa" — álbum colaborativo dos convidados.
--
-- Ideia: o fotógrafo registra o roteiro; os convidados registram o que só eles
-- viram. Cada pessoa manda as fotos que tirou, com o nome dela junto, e a
-- galeria pública mostra as aprovadas com o crédito de quem clicou.
--
-- Regras de segurança adotadas (mesmo padrão dos recados, migration 0016):
--   • o convidado NUNCA escreve direto na tabela — só pela função abaixo;
--   • o arquivo sobe para `hg-festa/pendentes/…`, que ninguém anônimo lê;
--   • ao aprovar, o painel MOVE o arquivo para `hg-festa/aprovadas/…`, único
--     prefixo com leitura liberada. Nada aparece no site sem moderação.
--   • o contato de quem enviou fica na tabela, mas jamais sai numa consulta
--     pública: a função `hg_festa_publico()` não devolve esse campo.

-- ---------- 1. Fotos ----------
create table if not exists hg_festa_fotos (
  id            uuid primary key default gen_random_uuid(),
  lote          uuid not null,              -- agrupa os arquivos de um mesmo envio
  autor         text not null,              -- crédito exibido na galeria
  contato       text,                       -- privado (WhatsApp/e-mail para agradecer)
  legenda       text,
  arquivo_path  text not null,              -- caminho no bucket privado
  mime          text,
  tamanho_bytes bigint,
  origem        text not null default 'site' check (origem in ('site','whatsapp','noivos')),
  status        text not null default 'pendente' check (status in ('pendente','aprovada','recusada')),
  destaque      boolean not null default false,
  ordem         int not null default 0,
  moderado_em   timestamptz,
  moderado_por  uuid,
  deleted_at    timestamptz,
  criado_em     timestamptz not null default now(),
  constraint hg_festa_fotos_autor_check check (coalesce(btrim(autor), '') <> ''),
  constraint hg_festa_fotos_path_check check (coalesce(btrim(arquivo_path), '') <> '')
);

create index if not exists hg_festa_fotos_status_idx on hg_festa_fotos (status, criado_em desc);
create index if not exists hg_festa_fotos_lote_idx on hg_festa_fotos (lote);

alter table hg_festa_fotos enable row level security;
drop policy if exists "hg membro hg_festa_fotos" on hg_festa_fotos;
create policy "hg membro hg_festa_fotos" on hg_festa_fotos
  for all to authenticated using (hg_is_member()) with check (hg_is_member());

-- ---------- 2. Configuração da aba ----------
-- WhatsApp fica NULO até os noivos informarem o número no painel: o site só
-- mostra o botão quando existe número de verdade (nada inventado aqui).
create table if not exists hg_festa_config (
  id                int primary key default 1 check (id = 1),
  aberto            boolean not null default true,
  whatsapp_numero   text,     -- só dígitos, com DDI. Ex.: 5531999999999
  whatsapp_mensagem text,
  chamada           text,
  agradecimento     text,
  atualizado_em     timestamptz not null default now()
);

insert into hg_festa_config (id, whatsapp_mensagem, chamada, agradecimento)
values (
  1,
  'Oi! Estas são as fotos que tirei no casamento da Helena e do Guilherme 💛',
  'A festa foi de vocês também. Mandem as fotos que vocês tiraram — aquelas que o fotógrafo não pegou.',
  'Obrigado por guardar esse momento com a gente 💛 Assim que a gente olhar com carinho, sua foto entra na galeria.'
)
on conflict (id) do nothing;

alter table hg_festa_config enable row level security;
drop policy if exists "hg membro hg_festa_config" on hg_festa_config;
create policy "hg membro hg_festa_config" on hg_festa_config
  for all to authenticated using (hg_is_member()) with check (hg_is_member());

-- ---------- 3. Envio pelo convidado ----------
-- p_arquivos: [{ "path": "pendentes/<lote>/x.jpg", "mime": "image/jpeg", "tamanho": 12345 }, …]
create or replace function hg_festa_enviar(
  p_autor    text,
  p_contato  text,
  p_legenda  text,
  p_arquivos jsonb
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_lote   uuid := gen_random_uuid();
  v_autor  text := nullif(btrim(p_autor), '');
  v_total  int  := 0;
  v_item   jsonb;
  v_path   text;
  v_mime   text;
  v_tam    bigint;
  v_aberto boolean;
begin
  select aberto into v_aberto from hg_festa_config where id = 1;
  if coalesce(v_aberto, true) = false then
    raise exception 'envios encerrados';
  end if;

  if v_autor is null then raise exception 'autor obrigatorio'; end if;
  if p_arquivos is null or jsonb_typeof(p_arquivos) <> 'array' then
    raise exception 'nenhuma foto enviada';
  end if;
  if jsonb_array_length(p_arquivos) = 0 then raise exception 'nenhuma foto enviada'; end if;
  if jsonb_array_length(p_arquivos) > 15 then raise exception 'maximo de 15 fotos por envio'; end if;

  for v_item in select * from jsonb_array_elements(p_arquivos) loop
    v_path := nullif(btrim(v_item ->> 'path'), '');
    v_mime := lower(coalesce(v_item ->> 'mime', ''));
    v_tam  := coalesce((v_item ->> 'tamanho')::bigint, 0);

    if v_path is null then raise exception 'arquivo sem caminho'; end if;
    -- O convidado só pode registrar o que subiu para a área de moderação.
    if v_path not like 'pendentes/%' then raise exception 'caminho invalido'; end if;
    if v_mime not in ('image/jpeg', 'image/jpg', 'image/png', 'image/webp') then
      raise exception 'formato nao aceito';
    end if;
    if v_tam > 15 * 1024 * 1024 then raise exception 'arquivo acima de 15 MB'; end if;

    insert into hg_festa_fotos (lote, autor, contato, legenda, arquivo_path, mime, tamanho_bytes, ordem)
    values (v_lote, v_autor, nullif(btrim(p_contato), ''), nullif(btrim(p_legenda), ''),
            v_path, v_mime, nullif(v_tam, 0), v_total);
    v_total := v_total + 1;
  end loop;

  return jsonb_build_object('lote', v_lote, 'total', v_total);
end $$;

grant execute on function hg_festa_enviar(text, text, text, jsonb) to anon, authenticated;

-- ---------- 4. Leitura pública (só o que foi aprovado) ----------
create or replace function hg_festa_publico()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_cfg hg_festa_config%rowtype; v_fotos jsonb;
begin
  select * into v_cfg from hg_festa_config where id = 1;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id', f.id, 'autor', f.autor, 'legenda', f.legenda,
             'arquivo_path', f.arquivo_path, 'criado_em', f.criado_em,
             'destaque', f.destaque
           ) order by f.destaque desc, f.criado_em desc), '[]'::jsonb)
    into v_fotos
    from hg_festa_fotos f
   where f.deleted_at is null and f.status = 'aprovada';

  return jsonb_build_object(
    'aberto', coalesce(v_cfg.aberto, true),
    'whatsapp_numero', v_cfg.whatsapp_numero,
    'whatsapp_mensagem', v_cfg.whatsapp_mensagem,
    'chamada', v_cfg.chamada,
    'agradecimento', v_cfg.agradecimento,
    'fotos', v_fotos
  );
end $$;

grant execute on function hg_festa_publico() to anon, authenticated;

-- ---------- 5. Bucket ----------
insert into storage.buckets (id, name, public)
values ('hg-festa', 'hg-festa', false)
on conflict (id) do nothing;

-- Convidado ENVIA para a fila de moderação e nada mais.
drop policy if exists "hg festa envio publico" on storage.objects;
create policy "hg festa envio publico" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'hg-festa' and (storage.foldername(name))[1] = 'pendentes');

-- Só o que foi movido para "aprovadas/" pode ser lido por quem visita o site.
drop policy if exists "hg festa leitura aprovadas" on storage.objects;
create policy "hg festa leitura aprovadas" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'hg-festa' and (storage.foldername(name))[1] = 'aprovadas');

drop policy if exists "hg festa leitura membro" on storage.objects;
create policy "hg festa leitura membro" on storage.objects
  for select to authenticated using (bucket_id = 'hg-festa' and hg_is_member());

drop policy if exists "hg festa update membro" on storage.objects;
create policy "hg festa update membro" on storage.objects
  for update to authenticated using (bucket_id = 'hg-festa' and hg_is_member());

drop policy if exists "hg festa delete membro" on storage.objects;
create policy "hg festa delete membro" on storage.objects
  for delete to authenticated using (bucket_id = 'hg-festa' and hg_is_member());
