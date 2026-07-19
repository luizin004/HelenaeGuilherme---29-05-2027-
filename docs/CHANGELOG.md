# CHANGELOG

Formato: agrupado por fase de trabalho. Datas relativas à sessão de desenvolvimento.

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
