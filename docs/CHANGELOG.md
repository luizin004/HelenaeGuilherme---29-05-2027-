# CHANGELOG

Formato: agrupado por fase de trabalho. Datas relativas à sessão de desenvolvimento.

## [Fase 22] Construção das pendências do backlog
Todas as 8 pendências de construção da matriz v2 foram entregues.
### RSVP — grupos familiares e prazo (spec regra 35 + prazo)
- Banco: `hg_rsvp_group(token)` e `hg_rsvp_group_confirm(token, confirmações, msg, transporte)`
  (SECURITY DEFINER, grant anon/authenticated). O prazo (`rsvp_prazo`) é validado no banco —
  respostas após 30/03/2027 levantam `prazo encerrado`. Exercitado no banco (lookup ordenado
  adultos→crianças, confirmação mista, contagem) com limpeza dos dados de teste.
- `/rsvp/[token]` mostra o grupo inteiro e coleta resposta por integrante; bloqueia após o prazo.
- Reabertura administrativa em `/admin/conteudo` (grava `rsvp_prazo` + justificativa auditada).
### Presentes (separados das finanças)
- CRUD em `/admin/presentes` (criar via `parseBRLToCents`, status, exclusão lógica);
  página pública oculta soft-deletados/adquiridos.
### Financeiro — parcelas na UI
- `/admin/parcelas`: gerar cronograma (motor `buildSchedule`, fechamento exato),
  marcar pago/estornar (sem mexer no vencimento), renegociar versionando o cronograma
  anterior em `hg_expense_schedule_versions` (snapshot + motivo, auditado).
### Público — rotas dedicadas
- `/duvidas`, `/programacao`, `/privacidade` (LGPD) e `/termos`, com casca reutilizável e
  navegação no rodapé. Sem inventar dados: horários finos marcados como aproximados.
### Check-in — leitura por câmera
- `QrScanner` com `BarcodeDetector` nativo (sem dependência nova) + fallback; extrai o token
  de URLs `/rsvp/<token>`; mantém o fluxo offline (cache + fila).
### Convidados — edição/mesa/exclusão
- `ConvidadoActions`: editar nome/contato/mesa/criança + exclusão lógica; colunas Mesa/Ações;
  `listGuests`/`getGuestStats` passam a ocultar soft-deletados.
### Docs
- `PRODUCTION_CHECKLIST.md` (go-live) e `WEDDING_DAY_CHECKLIST.md` (operação do dia).
### Verificação
- **Lint ✔ · typecheck ✔ · 25 unit ✔ · 7 e2e (Chromium real) ✔ · build 25 rotas ✔**

## [Fase 21] Varredura completa + hardening de segurança
### Segurança (achados dos advisors do Supabase — corrigidos e PROVADOS)
- **CRÍTICO corrigido:** políticas de gestão usavam `using(true)` p/ qualquer
  `authenticated` — os 11 usuários do outro sistema do projeto compartilhado podiam
  acessar dados do casamento via API. Agora restritas a **membros de `hg_profiles`**
  (função `hg_is_member()` SECURITY DEFINER). Prova por impersonação de JWT:
  não-membro vê 0 despesas; admin vê 24. Storage (bucket privado) idem.
- `hg_set_atualizado_em` com `search_path` fixo (advisor 0011).
- **Security headers** em todas as rotas (X-Frame-Options DENY, nosniff,
  Referrer-Policy, Permissions-Policy, HSTS) — verificados em runtime.
### Correções / melhorias
- **Webhook Asaas idempotente** (spec §9): tabela `hg_webhook_events` (payload
  armazenado + dedup por `event_key`); duplicado retorna 200 sem reprocessar;
  503 sem service_role (antes falhava silenciosamente).
- **Valor mínimo de presente R$ 300** validado no servidor (spec) + validação de método.
- Check-in registra `registrado_por`/`check_in_por` + auditoria.
- `/rsvp/[token]` valida formato UUID antes de consultar (evita erro de cast).
- Código morto removido (`validations/rsvp.ts`) e dependências órfãs
  (`react-hook-form`, `@hookform/resolvers`) desinstaladas.
### Verificação (tudo re-executado)
- **Lint ✔ (primeira execução — zero erros) · typecheck ✔ · 25 unit ✔ · 6 e2e ✔ · build ✔**

## [Fases 7–14] Módulos do sistema (construídos + validados por build/testes/SQL)
> Runtime app↔Supabase NÃO exercitado (egress do sandbox bloqueia o host — PEND-009).
> Validação real de runtime pendente de deploy.
- **Fase 7** — Financeiro real: 24 itens da planilha (centavos), cronogramas que fecham exato, tela de lançamentos.
- **Fase 8** — 1º admin criado + autorização do painel (só `hg_profiles` acessa; bloqueia os outros usuários do projeto compartilhado).
- **Fase 9** — RSVP por token seguro (`SECURITY DEFINER`) + `/rsvp/[token]`; cadastro de convidados + QR Code.
- **Fase 10** — Fornecedores (CRUD) + importação de convidados em massa (parser testado).
- **Fase 11** — Classificação de despesas (centro de custo + responsável).
- **Fase 12** — Contratos (CRUD ligado a fornecedores) + CMS (editar história do site).
- **Fase 13** — Trilha de auditoria (`hg_audit_log`) nas ações críticas + tela.
- **Fase 14** — Resumo financeiro por responsável e por centro de custo.
- **Descoberta (Fase 9):** o sandbox bloqueia o Supabase (egress 403) — validações de runtime só no deploy. Correção honesta registrada.

## [Fase 6] Backend real provisionado (isolado + RLS) + importação de convidados
### Adicionado
- Schema do casamento aplicado no Supabase existente com **prefixo `hg_`** (28 tabelas,
  RLS em todas), no projeto "Sistema De Orçamentos" — isolado, sem colisão. PEND-004 resolvido.
- Seed real: locais de Itabira, 6 centros de custo, 4 responsáveis, 20 permissões.
- App ligado ao banco: `.from()` prefixado; `.env.local` (fora do git); auth ativa validada.
- `domain/guests/import.ts` + 6 testes (CSV/colar, mapeamento, deduplicação).
### Segurança
- Removidas políticas anônimas amplas em `hg_guests`/`hg_payments` (protege PII/financeiro —
  regra 36 / LGPD). Anon lê apenas conteúdo público do site.
### Achado (banco existente do cliente)
- O projeto "guilherme.moura's Project" tem **71 tabelas com RLS desativado** (não é do
  casamento) — reportado ao cliente para revisão separada.

## [Fase 4] Motor financeiro testado + schema v2 + testes
### Adicionado
- `domain/money.ts` (centavos), `domain/finance/installments.ts` (fechamento exato,
  gratuito, vencimento, divisão por responsáveis), `domain/qr.ts` (token seguro).
- Suíte Vitest: **19 testes passando**, incluindo o obrigatório
  **R$ 1.893,50 em 6× = R$ 1.893,50** exato.
- Migration `0003_finance_audit_authz.sql`: financeiro em centavos, `audit_log`,
  soft-delete, 7 perfis + `role_permissions`, renegociação versionada.
- `docs/FINANCIAL_RULES.md`, `docs/DATABASE.md`.
### Corrigido
- `parseBRLToCents` interpretava "1893.50" (formato US) como milhar — bug pego por
  teste e corrigido (trata BR e US).

## [Fase 3] Governança de requisitos + dados reais + paleta natural
### Adicionado
- `docs/PROJECT_SPEC.md` consolidado a partir das mensagens do cliente (PEND-001).
- Governança: `REQUIREMENTS_MATRIX`, `IMPLEMENTATION_PLAN`, `DECISIONS`,
  `PENDING_DECISIONS`, `PROJECT_CONTEXT`, `CHANGELOG`.
- Dados reais do evento aplicados (data 29/05/2027 15h, fuso SP, locais em Itabira-MG,
  RSVP até 30/03/2027, traje, conceito "O início do nosso maior projeto").
- Paleta natural (off-white/areia/bege + verde-oliva/musgo + marrom + dourado fosco).
### Diagnóstico
- Identificado bloqueio PEND-001 (PROJECT_SPEC.md ausente) e PEND-002/003/005 (dados
  de mapa, seed financeiro e credenciais). Nada foi inventado.

## [Fase 2] Migração para Next.js + TypeScript + Supabase
### Adicionado
- App Next.js 14 (App Router), TS estrito, Tailwind com design tokens.
- Camada Supabase (browser/server/service-role) + middleware de sessão e proteção /admin.
- Site público SSR (Hero, Countdown, Story, Details, Gallery, Kids, Gifts, RSVP, Footer).
- RSVP grava no banco via Server Action; página `/presentes`.
- Painel: login, dashboard, convidados, financeiro, check-in.
- API Asaas: criar cobrança + webhook.
- Build de produção e type-check passando.
### Removido
- Scaffold estático (HTML/CSS/JS) substituído pela aplicação.

## [Fase 1] Identidade + schema inicial
- Monograma HG, rebrand, schema inicial (21 tabelas) + RLS.

## [Fase 0] Preparação do campo
- Estrutura inicial do site de casamento.
