# DECISIONS — Registro de decisões arquiteturais (ADR)

| ID | Decisão | Justificativa | Data |
|----|---------|---------------|------|
| DEC-001 | Next.js 14 App Router + TS + Tailwind + Supabase | Stack pedida; SSR + Server Actions + RLS atendem auth/segurança/LGPD | Fase 2 |
| DEC-002 | Três clientes Supabase (anon browser, anon server/cookies, service_role server-only) | Menor privilégio; service_role nunca no client | Fase 2 |
| DEC-003 | Modo demonstração quando faltam credenciais | Permite build/preview sem backend; nunca simula dado financeiro real | Fase 2 |
| DEC-004 | Verdes (oliva/musgo) como cor primária; marrom amadeirado + dourado fosco como acentos; monograma HG mantido | Concilia paleta natural da spec com o monograma marrom fornecido | Fase 3 |
| DEC-005 | Dinheiro em **centavos inteiros (bigint)** | Regra 12; evita erro de ponto flutuante; garante fechamento exato de parcelas | Fase 3 |
| DEC-006 | **Exclusão lógica** (`deleted_at`/`archived_at`) e auditoria em tabelas sensíveis | Regras 13–21; preservar pagamentos, convidados, QR usados, contratos | Fase 3 |
| DEC-007 | Consolidar `PROJECT_SPEC.md` a partir das mensagens do cliente (arquivo original ausente) | Não bloquear todo o projeto; não inventar dados (PEND-001) | Fase 3 |
| DEC-008 | `PROJECT_SPEC.md` é fonte da verdade de requisitos; dados ausentes ficam PENDENTES, nunca preenchidos por suposição | Regras 2–10 | Fase 3 |
| DEC-009 | Confirmação de pagamento **apenas** por webhook validado / consulta ao Asaas | Regra 28/29; segurança financeira | Fase 2 |
| DEC-010 | Idempotência de webhook por `asaas_payment_id` único + tabela de eventos (a implementar) | Regras 30–32 | Etapa 11 |
