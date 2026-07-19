# IMPLEMENTATION_PLAN — Plano de execução

Execução autônoma e progressiva. Cada etapa registra objetivo, dependências, banco,
rotas, serviços, componentes, permissões, testes, riscos e critérios de aceite.
Progresso marcado com ✅ (feito) · 🔶 (parcial) · ⬜ (pendente) · 🚧 (bloqueado).

---

### Etapa 1 — Fundação técnica e arquitetura · 🔶
- **Objetivo:** base Next.js/TS/Tailwind/Supabase, camadas, erros, logs, tema.
- **Feito:** app App Router, TS estrito, Tailwind (design tokens), Supabase (3 clientes),
  middleware, build de produção passando.
- **Falta:** `app/error.tsx`, `app/not-found.tsx`, `loading.tsx`, `lib/logger.ts`,
  Zod + React Hook Form, Prettier, separação `features/domain/services/repositories`.
- **Aceite:** `npm run build` + `typecheck` + `lint` passam; páginas de erro/404 existem.

### Etapa 2 — Banco, auth, perfis e permissões · 🔶
- **Objetivo:** schema completo (centavos, soft-delete, auditoria), 7 perfis, permissões, RLS.
- **Banco:** `0003_*` (money cents, audit_log, permissions, soft-delete); rever RLS.
- **Rotas:** `/admin/login` ✅; guardas de permissão ⬜.
- **Aceite:** RLS testada; perfil recepção sem acesso a financeiro/documentos.

### Etapa 3 — Gestão financeira · ⬜ (dados 🚧 PEND-003)
- **Objetivo:** despesas, parcelas, responsáveis, centros, projeção, regras 1–12.
- **Testes:** R$1.893,50 em 6x fecha exato; soma de responsáveis fecha desembolso.
- **Risco:** invenção de dados — mitigado por PEND-003 (seed não populado).

### Etapa 4 — Fornecedores, contratos, cortesias, documentos · ⬜
### Etapa 5 — Convidados, grupos, importações · 🔶 (listagem ✅)
### Etapa 6 — RSVP, crianças, restrições, acessibilidade, transporte · 🔶 (RSVP grava ✅)
### Etapa 7 — QR Codes, check-in, offline · 🔶 (token+check-in ✅; offline ⬜)
### Etapa 8 — Site público, identidade, CMS · 🔶 (home ✅; CMS ⬜)
### Etapa 9 — Locais, rota, programação, cardápio, atrações, plano de chuva · 🚧 (PEND-002)
### Etapa 10 — Lista de presentes e pedidos · 🔶 (UI ✅)
### Etapa 11 — Asaas, pagamentos, webhooks, conciliação · 🔶 (rotas ✅; 🚧 PEND-005)
### Etapa 12 — Comunicação e notificações · ⬜ (🚧 PEND-006)
### Etapa 13 — Auditoria, backups, logs, contingência · ⬜
### Etapa 14 — Segurança, desempenho, acessibilidade · 🔶
### Etapa 15 — Homologação, produção, documentação, entrega · 🔶 (docs em progresso)

---

## Ordem de execução autônoma
1→2→3→(4,5 em paralelo lógico)→6→7→8→9→10→11→12→13→14→15.
Etapas com dados bloqueados (3, 9) têm **estrutura implementada** e **seed/dados
pendentes** documentados; não travam as demais.

## Critério global de conclusão
Ver `ACCEPTANCE_CHECKLIST.md` (22 itens da definição de pronto do projeto).
