# REQUIREMENTS_MATRIX — Rastreamento de requisitos

Status: `não iniciado` · `em desenvolvimento` · `implementado` · `testado` ·
`bloqueado` · `não aplicável`.
Regra: um requisito só é `testado` com evidência de teste executado.
Atualizado a cada etapa (ver `CHANGELOG.md`).

**Legenda de prioridade:** P0 (crítico) · P1 (alto) · P2 (médio) · P3 (baixo).

| ID | Requisito | Módulo | Pri | Status | Arquivo/Serviço | Tabela | Teste | Obs |
|----|-----------|--------|-----|--------|-----------------|--------|-------|-----|
| R-001 | Stack Next.js+TS+Tailwind+Supabase | Fundação | P0 | implementado | `package.json`, `app/`, `tailwind.config.ts` | — | — | Build OK |
| R-002 | TypeScript estrito + aliases | Fundação | P0 | implementado | `tsconfig.json` | — | — | `strict:true` |
| R-003 | Lint + formatação | Fundação | P1 | em desenvolvimento | `.eslintrc.json` | — | — | Prettier a adicionar |
| R-004 | Tratamento global de erros + 404 + loading | Fundação | P1 | em desenvolvimento | `app/error.tsx`, `app/not-found.tsx` | — | — | Etapa 1 |
| R-005 | Logging estruturado | Fundação | P1 | em desenvolvimento | `lib/logger.ts` | — | — | Etapa 1 |
| R-006 | Camada Supabase (browser/server/service) + middleware | Fundação | P0 | implementado | `lib/supabase/*`, `middleware.ts` | — | — | |
| R-010 | Migrations versionadas | Banco | P0 | implementado | `supabase/migrations/*` | todas | — | 0001–0003 |
| R-011 | Dinheiro em centavos (bigint) | Banco | P0 | em desenvolvimento | `0003_*.sql` | finance_* | R-FIN-teste | Migrando |
| R-012 | UUID, FK, índices, timestamps, soft-delete, auditoria | Banco | P0 | em desenvolvimento | `0003_*.sql` | todas | — | |
| R-013 | RLS em todas as tabelas | Segurança | P0 | implementado | `0002_rls.sql` | todas | — | Rever pós-0003 |
| R-014 | Dicionário de dados + diagrama | Banco | P1 | em desenvolvimento | `docs/DATABASE.md`, `DATA_DICTIONARY.md` | — | — | |
| R-020 | Supabase Auth (login/logout/recuperação) | Auth | P0 | implementado | `app/admin/login`, `app/actions/auth.ts` | profiles | — | 2FA/rate-limit pend. |
| R-021 | Perfis e permissões (7 perfis) | Auth | P0 | não iniciado | `lib/authz/*` | profiles, permissions | — | Etapa 2 |
| R-022 | Proteção de rotas (UI+servidor+banco) | Segurança | P0 | em desenvolvimento | `middleware.ts`, RLS | — | — | Falta camada authz |
| R-023 | Reautenticação p/ ações críticas, rate limiting, 2FA | Segurança | P1 | não iniciado | — | — | — | Etapa 5 |
| R-024 | Processo do 1º administrador | Auth | P1 | em desenvolvimento | `docs/DEPLOYMENT.md`, `scripts/` | — | — | |
| R-030 | Módulo financeiro (estados, responsáveis, centros) | Financeiro | P0 | não iniciado | `features/finance/*` | finance_* | R-FIN-* | Etapa 3 |
| R-031 | Parcelas/entrada/renegociação/gratuito | Financeiro | P0 | não iniciado | — | — | — | Regras 1–12 |
| R-032 | Projeção mensal jul/2026–mai/2027 | Financeiro | P1 | não iniciado | — | budget_projections | — | |
| R-033 | Seed financeiro idempotente | Financeiro | P0 | **bloqueado** | `supabase/seed/*` | — | — | PEND-003 |
| R-034 | Teste R$1.893,50 em 6x fecha exato | Financeiro | P0 | não iniciado | `tests/finance/*` | — | R-FIN-round | Etapa 3 |
| R-040 | Fornecedores, contratos, cortesias, documentos | Gestão | P1 | não iniciado | `features/*` | suppliers... | — | Etapa 4 |
| R-050 | Convidados, grupos, importação CSV/XLSX | Convidados | P0 | em desenvolvimento | `features/guests/*` | guests, guest_groups | — | Listagem OK |
| R-051 | Sem busca pública ampla / sem acompanhante livre | Convidados | P0 | não iniciado | — | — | — | Regra 35/36 |
| R-060 | RSVP (fluxo completo + prazo configurável) | RSVP | P0 | em desenvolvimento | `app/actions/rsvp.ts`, `components/public/Rsvp.tsx` | guests | — | Grava; falta validação por código |
| R-061 | Crianças (campos + check-in/out monitor) | Crianças | P1 | não iniciado | — | children | — | Etapa 6 |
| R-062 | Transporte (opções, sem compartilhar telefone) | Transporte | P2 | não iniciado | — | — | — | Etapa 6 |
| R-070 | QR Code (token seguro, uso único, status) | QR | P0 | em desenvolvimento | `app/actions/checkin.ts` | guests, checkins | — | Token no schema; geração pend. |
| R-071 | Check-in (manual, grupo, recepção) | Check-in | P0 | em desenvolvimento | `app/admin/(panel)/checkin` | checkins | — | Valida token |
| R-072 | Operação offline (IndexedDB + fila) | Offline | P1 | não iniciado | — | — | — | Etapa 7 |
| R-080 | Site público (rotas + home + fuso SP) | Público | P0 | em desenvolvimento | `app/page.tsx`, `components/public/*` | — | — | Home OK; faltam rotas |
| R-081 | Contagem regressiva + mensagem pós-evento | Público | P1 | em desenvolvimento | `components/public/Countdown.tsx` | — | — | Falta mensagem pós |
| R-082 | CMS (rascunho/publicação/histórico) | CMS | P1 | não iniciado | — | content_* | — | Etapa 8 |
| R-090 | Locais/rota/programação/cardápio/atrações/plano de chuva | Público | P2 | bloqueado | — | venues | — | PEND-002 |
| R-100 | Lista de presentes (mín. R$300, categorias, coletivo) | Presentes | P1 | em desenvolvimento | `app/presentes` | gifts | — | UI ok; regras pend. |
| R-110 | Asaas (Pix/cartão/boleto) + checkout | Pagamentos | P0 | em desenvolvimento | `app/api/asaas/create` | payments | — | Rota pronta; PEND-005 |
| R-111 | Webhook validado + idempotência + conciliação | Pagamentos | P0 | em desenvolvimento | `app/api/asaas/webhook` | payments | — | Falta idempotência/dedup store |
| R-120 | Comunicação (modelos, canais, logs) | Comunicação | P2 | não iniciado | — | communications | — | Etapa 12 / PEND-006 |
| R-130 | Documentos privados (storage, URL assinada) | Documentos | P1 | não iniciado | — | documents | — | Etapa 13 |
| R-131 | Auditoria (quem/quando/antes/depois) | Auditoria | P0 | não iniciado | — | audit_log | — | Etapa 13 |
| R-132 | Backups + ponto de restauração | Backups | P1 | não iniciado | `docs/DISASTER_RECOVERY.md` | — | — | |
| R-140 | Segurança OWASP + LGPD | Segurança | P0 | em desenvolvimento | `docs/SECURITY.md` | — | — | RLS ok; demais Etapa 14 |
| R-150 | Testes (unit/integ/e2e) | Qualidade | P0 | não iniciado | `tests/`, `e2e/` | — | — | Etapa 15 |
| R-160 | Acessibilidade WCAG + desempenho | Qualidade | P1 | em desenvolvimento | — | — | — | Reduced-motion ok |
| R-170 | CI/CD (lint/types/test/build/migrations) | DevOps | P1 | não iniciado | `.github/workflows/*` | — | — | Etapa 17 |
| R-180 | Documentação completa (manuais + checklists) | Docs | P0 | em desenvolvimento | `docs/*` | — | — | Em progresso |

> **Nenhum requisito foi descartado.** Itens `bloqueado` estão em `PENDING_DECISIONS.md`.
> Este é o documento vivo de rastreamento — atualizado ao fim de cada etapa.
