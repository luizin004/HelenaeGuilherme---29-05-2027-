# ACCEPTANCE_CHECKLIST — Critérios de conclusão

O sistema só é considerado concluído quando **todos** os itens abaixo estiverem ✅.
Estado atual honesto (não declarar pronto antecipadamente).

| # | Critério | Estado |
|---|----------|--------|
| 1 | Requisitos rastreados (matriz sem item sem status) | 🔶 matriz criada |
| 2 | Migrations completas | 🔶 0001–0003 (schema fin. em cents pendente de 0003) |
| 3 | Permissões implementadas (7 perfis) | ⬜ |
| 4 | Políticas RLS em todas as tabelas | 🔶 0002 (rever após 0003) |
| 5 | Rotas protegidas | 🔶 middleware ok; authz por perfil ⬜ |
| 6 | Módulos integrados | 🔶 |
| 7 | Fluxos críticos testados | ⬜ (sem suíte de testes ainda) |
| 8 | Documentos privados | ⬜ |
| 9 | Segredos não expostos | ✅ (env, service_role server-only) |
| 10 | Backups documentados | 🔶 `DISASTER_RECOVERY.md` |
| 11 | Restauração documentada | 🔶 |
| 12 | Aplicação gera build | ✅ |
| 13 | Análise de tipos passa | ✅ |
| 14 | Lint passa | 🔶 |
| 15 | Testes locais passam | ⬜ |
| 16 | Pendências externas documentadas | ✅ `PENDING_DECISIONS.md` |
| 17 | Manual administrativo | ⬜ `ADMIN_MANUAL.md` |
| 18 | Manual técnico | 🔶 `ARCHITECTURE.md` + docs |
| 19 | Checklist de produção | ⬜ `PRODUCTION_CHECKLIST.md` |
| 20 | Checklist do casamento | ⬜ `WEDDING_DAY_CHECKLIST.md` |
| 21 | Plano de contingência | 🔶 `DISASTER_RECOVERY.md` |
| 22 | Matriz de requisitos atualizada | ✅ |

**Conclusão real:** o projeto está em **construção progressiva**. Esta sessão entregou
fundação + governança + dados reais; as etapas 3–14 seguem conforme o plano, com os
bloqueios externos catalogados.
