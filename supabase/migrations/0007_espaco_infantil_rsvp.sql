-- Espaço infantil preenchido no RSVP/check-in do convidado.
-- O convidado (anônimo, via token) declara quem usará o espaço infantil,
-- o nome da criança e o RESPONSÁVEL pela criança na festa (texto livre).
-- Esses registros alimentam automaticamente a tela admin de Espaço infantil.

-- 1) Responsável pela criança NA FESTA (nome livre — o adulto que a acompanha).
--    Diferente de responsavel_id (pagador/financeiro). Preenchido pelo próprio
--    convidado no RSVP.
alter table hg_children add column if not exists responsavel_festa text;

-- 2) Função SECURITY DEFINER: o convidado grava crianças pelo token do convite,
--    sem acesso direto à tabela (mesma proteção LGPD do restante do RSVP).
--    É idempotente: cada envio substitui as crianças que ESTE convidado havia
--    declarado antes (guest_id = dono do token), sem tocar nos cadastros do painel.
create or replace function public.hg_rsvp_kids(p_token uuid, p_criancas jsonb)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_guest uuid; v_aberto boolean; v_count int := 0;
        item jsonb; v_nome text; v_resp text; v_obs text; v_idade int;
begin
  select id into v_guest
    from hg_guests where qr_token = p_token and deleted_at is null;
  if v_guest is null then raise exception 'convite nao encontrado'; end if;

  select (now() <= coalesce(rsvp_prazo, now() + interval '100 years'))
    into v_aberto from hg_wedding_settings where id = 1;
  if not coalesce(v_aberto, true) then raise exception 'prazo encerrado'; end if;

  -- Substitui a declaração anterior deste convidado (evita duplicar ao reenviar).
  update hg_children set deleted_at = now()
   where guest_id = v_guest and deleted_at is null;

  for item in select * from jsonb_array_elements(p_criancas) loop
    v_nome := btrim(coalesce(item->>'nome', ''));
    if v_nome = '' then continue; end if;
    v_resp := nullif(btrim(coalesce(item->>'responsavel', '')), '');
    v_obs  := nullif(btrim(coalesce(item->>'observacoes', '')), '');
    begin
      v_idade := nullif(item->>'idade', '')::int;
    exception when others then
      v_idade := null;
    end;
    insert into hg_children (nome, idade, observacoes, responsavel_festa, usara_espaco, guest_id)
      values (v_nome, v_idade, v_obs, v_resp, true, v_guest);
    v_count := v_count + 1;
  end loop;
  return v_count;
end
$function$;

grant execute on function public.hg_rsvp_kids(uuid, jsonb) to anon, authenticated;
