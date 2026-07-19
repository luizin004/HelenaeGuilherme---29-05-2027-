# ADMIN_MANUAL — Painel dos noivos

## Acesso
- **URL:** `/admin` (redireciona para `/admin/login` se não autenticado).
- **Primeiro administrador (criado):**
  - E-mail: `guilherme.moura@oralaligner.com.br`
  - Senha temporária: **`Casamento@2027`** → **troque no primeiro acesso**
    (Supabase → Authentication → Users, ou implementaremos "alterar senha" no painel).
- Só usuários cadastrados em `hg_profiles` acessam o painel (papéis: `admin`, `noivos`,
  `financeiro`, `cerimonial`, `conteudo`, `recepcao`, `visualizacao`).

## Autorização (importante)
O banco fica no projeto Supabase "Sistema De Orçamentos", que tem **outros usuários**
(sistema odontológico). O painel do casamento **bloqueia** qualquer usuário que não
esteja em `hg_profiles` — mesmo que ele consiga logar no Supabase. Isso é verificado no
servidor (`app/admin/(panel)/layout.tsx`).

## Criar mais administradores
1. Supabase → Authentication → **Add user** (e-mail + senha).
2. Inserir o perfil:
   ```sql
   insert into hg_profiles (id, nome, email, papel)
   select id, 'Nome', email, 'financeiro' from auth.users where email='pessoa@email.com';
   ```
   (papel conforme a função — ver `PERMISSIONS.md`.)

## Módulos do painel
- **Dashboard** — visão geral (dias, convidados, presentes, orçamento).
- **Convidados** — lista, status, QR (importação e QR em construção).
- **Financeiro** — lançamentos reais da planilha (24 itens), estados e valores.
- **Check-in** — validação por token no dia (recepção).

## Segurança
- Dados de convidados/financeiro só para autenticado (RLS). Conteúdo público do site é
  o único legível anonimamente. Ver `SECURITY.md`.
