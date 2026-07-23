-- "Humor nunca deve ser ligado apenas pela categoria — precisa estar autorizado"
-- (regra de segurança do temperamento por vínculo). Sinal explícito e separado
-- do texto livre de humor, para o motor de temperamento nunca supor autorização.
alter table hg_guest_comm_profiles add column if not exists humor_autorizado boolean not null default false;
