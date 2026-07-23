-- Gestão de padrinhos, casais e produção de caixas/convites.
-- Tudo ADITIVO (if not exists) — preserva dados e o módulo de padrinhos já em uso.

-- 1) Papel do convidado no casamento (independente de família/grupo).
--    Compatível com eh_crianca/faixa_etaria já existentes.
alter table hg_guests add column if not exists papel text not null default 'convidado';

-- 2) Grupo de convite: nome para impressão, tipo, kit, contato principal, ordem, soft-delete.
alter table hg_guest_groups add column if not exists nome_impressao text;
alter table hg_guest_groups add column if not exists tipo text not null default 'familiar';
alter table hg_guest_groups add column if not exists kit text;
alter table hg_guest_groups add column if not exists contato_principal_id uuid references hg_guests(id) on delete set null;
alter table hg_guest_groups add column if not exists ordem integer not null default 0;
alter table hg_guest_groups add column if not exists deleted_at timestamptz;

-- 3) Padrinho: caixa individual (confirmada explicitamente) e status de entrega.
alter table hg_wedding_party add column if not exists caixa_individual boolean not null default false;
alter table hg_wedding_party add column if not exists entrega_status text not null default 'pendente';

-- 4) Par/casal de padrinhos: produção da caixa + soft-delete (desvincular preserva pessoas).
alter table hg_wedding_party_pairs add column if not exists caixas integer not null default 1;
alter table hg_wedding_party_pairs add column if not exists convites_grandes integer not null default 1;
alter table hg_wedding_party_pairs add column if not exists convites_pequenos integer not null default 0;
alter table hg_wedding_party_pairs add column if not exists status_producao text not null default 'pendente';
alter table hg_wedding_party_pairs add column if not exists status_entrega text not null default 'pendente';
alter table hg_wedding_party_pairs add column if not exists deleted_at timestamptz;
