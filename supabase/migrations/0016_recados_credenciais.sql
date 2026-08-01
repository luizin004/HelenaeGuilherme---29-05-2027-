-- Recados dos convidados + credenciais (QR) do grupo.
--
-- Ideia central do evento: ao confirmar presença, o convidado já vê o convite
-- de todo o grupo (check-in), recebe o QR de entrada e pode deixar um recado
-- para os noivos — por escrito, em áudio ou em vídeo.

-- ---------- 1. Recados ----------
create table if not exists hg_recados (
  id           uuid primary key default gen_random_uuid(),
  guest_id     uuid references hg_guests(id) on delete set null,
  group_id     uuid,
  autor        text not null,
  tipo         text not null check (tipo in ('texto','audio','video')),
  mensagem     text,
  arquivo_url  text,          -- caminho no bucket privado (não é URL pública)
  mime         text,
  duracao_seg  int,
  destaque     boolean not null default false,
  lido_em      timestamptz,
  deleted_at   timestamptz,
  criado_em    timestamptz not null default now(),
  -- Recado é ou texto, ou mídia: nunca vazio dos dois lados.
  constraint hg_recados_conteudo_check check (
    (tipo = 'texto' and coalesce(btrim(mensagem), '') <> '')
    or (tipo in ('audio','video') and coalesce(btrim(arquivo_url), '') <> '')
  )
);

create index if not exists hg_recados_guest_idx on hg_recados (guest_id);
create index if not exists hg_recados_criado_idx on hg_recados (criado_em desc);

alter table hg_recados enable row level security;
drop policy if exists "hg membro hg_recados" on hg_recados;
create policy "hg membro hg_recados" on hg_recados
  for all to authenticated using (hg_is_member()) with check (hg_is_member());
-- O convidado NÃO escreve direto na tabela: só pela função abaixo.

-- ---------- 2. Registrar recado pelo token do convite ----------
create or replace function hg_rsvp_recado(
  p_token     uuid,
  p_tipo      text,
  p_mensagem  text default null,
  p_arquivo   text default null,
  p_mime      text default null,
  p_duracao   int  default null
) returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_guest uuid; v_group uuid; v_nome text; v_id uuid;
begin
  if p_tipo not in ('texto','audio','video') then
    raise exception 'tipo invalido';
  end if;

  select id, group_id, nome into v_guest, v_group, v_nome
    from hg_guests where qr_token = p_token and deleted_at is null;
  if v_guest is null then raise exception 'convite inexistente'; end if;

  -- Mesma regra do constraint, validada antes para dar erro claro.
  if p_tipo = 'texto' and coalesce(btrim(p_mensagem), '') = '' then
    raise exception 'recado vazio';
  end if;
  if p_tipo in ('audio','video') and coalesce(btrim(p_arquivo), '') = '' then
    raise exception 'arquivo ausente';
  end if;

  insert into hg_recados (guest_id, group_id, autor, tipo, mensagem, arquivo_url, mime, duracao_seg)
  values (v_guest, v_group, v_nome, p_tipo, nullif(btrim(p_mensagem), ''), nullif(btrim(p_arquivo), ''), p_mime, p_duracao)
  returning id into v_id;

  return v_id;
end $$;

grant execute on function hg_rsvp_recado(uuid, text, text, text, text, int) to anon, authenticated;

-- ---------- 3. Credenciais (QR) do grupo ----------
-- Devolve o token de entrada de cada integrante já confirmado, para o
-- convidado ver/imprimir o convite de todo o grupo depois do check.
create or replace function hg_rsvp_credenciais(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_group uuid; v_guest uuid; v_result jsonb;
begin
  select group_id, id into v_group, v_guest
    from hg_guests where qr_token = p_token and deleted_at is null;
  if v_guest is null then return null; end if;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id', g.id, 'nome', g.nome, 'status', g.status,
             'eh_crianca', g.eh_crianca, 'qr_token', g.qr_token, 'mesa', g.mesa
           ) order by g.eh_crianca, g.nome), '[]'::jsonb)
    into v_result
    from hg_guests g
   where g.deleted_at is null
     and g.status = 'confirmado'
     and ((v_group is not null and g.group_id = v_group) or (v_group is null and g.id = v_guest));

  return v_result;
end $$;

grant execute on function hg_rsvp_credenciais(uuid) to anon, authenticated;

-- ---------- 4. Bucket dos recados ----------
-- Convidado ENVIA (insert) mas não lê nada; só os noivos ouvem/assistem.
insert into storage.buckets (id, name, public)
values ('hg-recados', 'hg-recados', false)
on conflict (id) do nothing;

drop policy if exists "hg recados envio publico" on storage.objects;
create policy "hg recados envio publico" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'hg-recados');

drop policy if exists "hg recados leitura membro" on storage.objects;
create policy "hg recados leitura membro" on storage.objects
  for select to authenticated using (bucket_id = 'hg-recados' and hg_is_member());

drop policy if exists "hg recados delete membro" on storage.objects;
create policy "hg recados delete membro" on storage.objects
  for delete to authenticated using (bucket_id = 'hg-recados' and hg_is_member());
