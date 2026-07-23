-- Importação assistida de convidados em uma TRANSAÇÃO única (a função é atômica).
-- Cria grupos de convite, convidados (com papel) e sincroniza padrinhos.
-- Dedup por nome (case-insensitive) entre convidados ativos. Casais NÃO são
-- vinculados aqui — ficam como sugestão para "A vincular".
create or replace function public.hg_import_convidados(p_grupos jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  g jsonb; m jsonb; v_group uuid; v_guest uuid;
  v_grupos int := 0; v_pessoas int := 0; v_padrinhos int := 0; v_dups int := 0;
  v_nome text; v_papel text; v_existe boolean; v_add int;
begin
  for g in select * from jsonb_array_elements(p_grupos) loop
    insert into hg_guest_groups (nome, nome_impressao, tipo, kit)
      values (nullif(g->>'nomeImpressao',''), nullif(g->>'nomeImpressao',''), coalesce(g->>'tipo','familiar'), nullif(g->>'kit',''))
      returning id into v_group;
    v_add := 0;

    for m in select * from jsonb_array_elements(g->'membros') loop
      v_nome := btrim(coalesce(m->>'nome',''));
      if v_nome = '' then continue; end if;
      select exists(select 1 from hg_guests where lower(nome) = lower(v_nome) and deleted_at is null) into v_existe;
      if v_existe then v_dups := v_dups + 1; continue; end if;

      v_papel := coalesce(m->>'papel','convidado');
      insert into hg_guests (nome, papel, group_id, eh_crianca)
        values (v_nome, v_papel, v_group, false)
        returning id into v_guest;
      v_pessoas := v_pessoas + 1;
      v_add := v_add + 1;

      if v_papel in ('padrinho','madrinha') then
        insert into hg_wedding_party (guest_id, nome, papel) values (v_guest, v_nome, v_papel);
        v_padrinhos := v_padrinhos + 1;
      end if;
    end loop;

    if v_add = 0 then
      delete from hg_guest_groups where id = v_group; -- grupo ficou vazio (tudo duplicado)
    else
      v_grupos := v_grupos + 1;
    end if;
  end loop;

  return jsonb_build_object('grupos', v_grupos, 'pessoas', v_pessoas, 'padrinhos', v_padrinhos, 'duplicados', v_dups);
end
$function$;

grant execute on function public.hg_import_convidados(jsonb) to authenticated;
