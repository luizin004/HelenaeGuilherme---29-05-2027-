-- Temperamento automático pelo vínculo do convidado (comunicação).
-- Reaproveita as colunas já existentes de hg_guest_comm_profiles (parentesco,
-- proximidade, lado, tom, formalidade, emocao, humor, tamanho, tratamento) como
-- campos estruturados. Só o que é genuinamente novo entra aqui.

-- "Outro vínculo personalizado" — texto livre quando o tipo de vínculo não está
-- na lista controlada (parentesco guarda a chave, ex. 'outro').
alter table hg_guest_comm_profiles add column if not exists tipo_vinculo_outro text;

-- Sinal manual (não há data de nascimento no cadastro) para o modificador "pessoa idosa".
alter table hg_guest_comm_profiles add column if not exists pessoa_idosa boolean not null default false;

-- Modificador "situação sensível" (reduz humor, aumenta cuidado, exige aprovação).
alter table hg_guest_comm_profiles add column if not exists situacao_sensivel boolean not null default false;

-- Força aprovação humana mesmo quando o temperamento sugerido não exigiria.
alter table hg_guest_comm_profiles add column if not exists forcar_aprovacao boolean not null default false;

-- Perfil personalizado (true) vs. sugestão automática (false, padrão). Quando
-- true, o sistema não recalcula sozinho ao mudar vínculo/proximidade/papel —
-- avisa o operador e pergunta se quer recalcular.
alter table hg_guest_comm_profiles add column if not exists perfil_bloqueado boolean not null default false;
