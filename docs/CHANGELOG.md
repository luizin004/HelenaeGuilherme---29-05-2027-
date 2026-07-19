# CHANGELOG

Formato: agrupado por fase de trabalho. Datas relativas à sessão de desenvolvimento.

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
