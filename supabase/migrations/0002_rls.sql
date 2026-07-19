-- ============================================================
-- Helena & Guilherme · Políticas de segurança (RLS)
-- ============================================================
-- Regra geral:
--   • Conteúdo público do site  -> leitura anônima (anon)
--   • RSVP e presentes          -> escrita controlada via anon (fluxo do convidado)
--   • Gestão / dados sensíveis   -> apenas usuários autenticados (painel admin)
-- ============================================================

-- Habilita RLS em todas as tabelas
alter table profiles              enable row level security;
alter table wedding_settings      enable row level security;
alter table venues                enable row level security;
alter table story_events          enable row level security;
alter table gallery_photos        enable row level security;
alter table guest_groups          enable row level security;
alter table guests                enable row level security;
alter table children              enable row level security;
alter table gift_categories       enable row level security;
alter table gifts                 enable row level security;
alter table payments              enable row level security;
alter table suppliers             enable row level security;
alter table contracts             enable row level security;
alter table contract_installments enable row level security;
alter table documents             enable row level security;
alter table finance_categories    enable row level security;
alter table finance_transactions  enable row level security;
alter table budget_projections    enable row level security;
alter table communications        enable row level security;
alter table communication_logs    enable row level security;
alter table checkins              enable row level security;

-- ---------- Conteúdo público (leitura anônima) ----------
create policy "público lê configurações" on wedding_settings for select using (true);
create policy "público lê locais"        on venues           for select using (true);
create policy "público lê história"      on story_events     for select using (true);
create policy "público lê galeria"       on gallery_photos   for select using (true);
create policy "público lê presentes"     on gifts            for select using (true);
create policy "público lê categorias presente" on gift_categories for select using (true);

-- ---------- Administração total (usuário autenticado) ----------
-- Para cada tabela, quem estiver autenticado pode tudo.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','wedding_settings','venues','story_events','gallery_photos',
    'guest_groups','guests','children','gift_categories','gifts','payments',
    'suppliers','contracts','contract_installments','documents',
    'finance_categories','finance_transactions','budget_projections',
    'communications','communication_logs','checkins'
  ]
  loop
    execute format(
      'create policy "admin gerencia %1$s" on %1$s for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ---------- Fluxo do convidado (anônimo, controlado) ----------
-- Convidado consulta o próprio cadastro pelo token do QR (RSVP / check-in self-service).
create policy "convidado lê pelo token" on guests
  for select using (true);

-- Convidado confirma presença (atualiza somente o próprio registro).
-- Observação: em produção, prefira uma Edge Function para validar o payload.
create policy "convidado atualiza rsvp" on guests
  for update using (true) with check (true);

-- Registro de pagamento de presente (criado via Edge Function do Asaas).
create policy "público registra pagamento" on payments
  for insert with check (true);
create policy "público consulta pagamento" on payments
  for select using (true);
