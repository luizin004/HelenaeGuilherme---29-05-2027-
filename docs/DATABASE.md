# DATABASE — Esquema do banco

PostgreSQL (Supabase). Migrations versionadas em `supabase/migrations/`.
Convenções: UUID (`gen_random_uuid()`), timestamps, RLS habilitada, dinheiro em
**centavos (`bigint`)** no modelo financeiro, exclusão lógica (`deleted_at`).

## Migrations
| Arquivo | Conteúdo |
|---------|----------|
| `0001_init.sql` | 21 tabelas base (configurações, locais, história, galeria, convidados, grupos, crianças, presentes, pagamentos, fornecedores, contratos, parcelas, documentos, financeiro inicial, comunicação, check-in). |
| `0002_rls.sql` | Políticas RLS (público lê conteúdo; `authenticated` gerencia; fluxo do convidado). |
| `0003_finance_audit_authz.sql` | Perfis/permissões (7 papéis), `audit_log`, soft-delete, **financeiro em centavos** (`cost_centers`, `payers`, `expenses`, `expense_installments`, `expense_payer_splits`, `expense_schedule_versions`). |

## Diagrama textual (financeiro — modelo corrente)
```
cost_centers ──┐
               ├─< expenses >─┬─< expense_installments
payers <──────┐│             ├─< expense_payer_splits >── payers
suppliers <───┘│             └─< expense_schedule_versions (renegociação)
              profiles (created_by/updated_by)
audit_log >── profiles
```

## Convidados / RSVP / check-in
```
guest_groups ──< guests ──< children
                    │
                    ├── qr_token (token opaco, sem PII)
                    └──< checkins
```

## Presentes / pagamentos (SEPARADO do financeiro do casamento)
```
gift_categories ──< gifts ──< payments (Asaas: pix/cartão/boleto, idempotência)
```

## Segurança
- RLS em todas as tabelas (0002 + 0003).
- Conteúdo público: leitura anônima. Dados de gestão: `authenticated`.
- Papéis em `profiles.papel`; permissões em `role_permissions`.
- `service_role` apenas no servidor (webhooks/conciliação).

## Aplicar
```bash
supabase db push        # aplica todas as migrations em ordem
```
> Ainda não aplicado a um projeto real — **PEND-004** (provisionar Supabase).
> Dicionário detalhado: `DATA_DICTIONARY.md` (em construção).
