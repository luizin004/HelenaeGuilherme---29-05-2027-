# REQUIREMENTS_MATRIX — Rastreamento de requisitos (v2 — pós-varredura)

Status: `não iniciado` · `em desenvolvimento` · `implementado` · `testado` · `bloqueado` · `não aplicável`.
`testado` só com evidência executada. Bloqueios externos: ver `PENDING_DECISIONS.md`.

## Os 32 módulos do briefing — visão geral

| # | Módulo | Status | Evidência / Falta |
|---|--------|--------|-------------------|
| 1 | Site público | **testado** | 6 e2e em Chromium real; dados reais; paleta natural. Faltam rotas dedicadas (dúvidas, privacidade, termos, programação) — ver R-080b |
| 2 | Área individual do convidado | implementado | `/rsvp/[token]` + RPC validado no banco. Falta: fluxo de grupo/acompanhantes autorizados |
| 3 | Painel administrativo | implementado | 10 módulos, autorização por membro (provada por JWT) |
| 4 | Serviços internos | implementado | actions/domínio/repositórios separados |
| 5 | Gestão financeira | **testado** | Motor em centavos (R$1.893,50÷6 exato); 24 itens reais. Falta: UI de parcelas/pagamento de parcela/renegociação |
| 6 | Gestão de convidados | implementado | Cadastro + importação em massa (testada) + QR. Falta: edição/mesa/grupos na UI |
| 7 | Grupos familiares | em desenvolvimento | Tabela existe; sem UI/fluxo |
| 8 | RSVP | implementado | Por token, sem busca pública; transporte incluso. Falta: enforcement do prazo 30/03/2027; crianças/restrições no fluxo público |
| 9 | Crianças | implementado | Painel /admin/infantil (alergias, responsável). Falta: check-in/out da criança com monitor |
| 10 | Transporte | **testado** | RPC grava transporte (validado no banco) |
| 11 | QR Codes | **testado** | Token opaco (testes) + geração de imagem. Falta: ciclo completo (bloquear/substituir/regenerar) |
| 12 | Check-in | implementado | Por token + registrado_por + auditoria. Falta: leitura por câmera; check-in por grupo |
| 13 | Operação offline | implementado | Cache local + fila de sincronização (check-in). Sync real: valida no deploy |
| 14 | CMS | implementado | História + hashtag editáveis refletem no site. Falta: fotos/locais/cardápio/dúvidas; rascunho/histórico |
| 15 | Lista de presentes | em desenvolvimento | Página pública ok; falta CRUD de presentes no painel + regras (coletivo/quantidade) |
| 16 | Pedidos | em desenvolvimento | hg_payments modela; falta fluxo de pedido interno completo |
| 17 | Pagamentos Asaas | **bloqueado (externo)** | Rotas prontas (mín. R$300, métodos validados); sem credenciais (PEND-005) |
| 18 | Webhooks | implementado | **Idempotente** (payload + dedup); validação real pende credencial |
| 19 | Conciliação | não iniciado | Taxa/líquido dependem de dados reais do Asaas |
| 20 | Fornecedores | implementado | CRUD + tela |
| 21 | Contratos | implementado | CRUD ligado a fornecedores. Falta: parcelas de contrato na UI |
| 22 | Cortesias | **testado** | `gratuito` sem parcela (teste unitário) + 2 itens reais (Convite VIP, Terno) |
| 23 | Documentos | implementado | Bucket privado + URL assinada + membro-only. Falta: validação tipo/tamanho no upload |
| 24 | Comunicação | implementado | Modelos/rascunhos + logs. Envio real: PEND-006 (provedor) |
| 25 | Notificações | **bloqueado (externo)** | Depende de provedor (PEND-006) |
| 26 | Auditoria | implementado | hg_audit_log + wire em 7 ações + tela |
| 27 | Backups | em desenvolvimento | Documentado (DR); ponto de restauração automatizado pendente |
| 28 | Monitoramento | em desenvolvimento | Logger estruturado; sem alertas |
| 29 | Segurança | **testado** | RLS por membro (provada por impersonação JWT), headers em runtime, tokens seguros |
| 30 | Publicação | **bloqueado (externo)** | Vercel sem permissão (PEND-008); app deploy-ready |
| 31 | Documentação | em desenvolvimento | 15 docs criados; faltam DATA_DICTIONARY, PERMISSIONS, TESTING, DEPLOYMENT, OPERATIONS, WEDDING_DAY/PRODUCTION_CHECKLIST completos |
| 32 | Plano de contingência | em desenvolvimento | Esboço em DISASTER_RECOVERY; consolidar |

## Contagem honesta
- **Testado (evidência executada): 6** · **Implementado: 14** · **Em desenvolvimento: 8**
- **Bloqueado por dependência EXTERNA: 3** (Asaas, provedor de mensagens, permissão Vercel)
- **Não iniciado: 1** (conciliação — depende do Asaas)

## Verificações executadas (Fase 21)
Lint ✔ · Typecheck ✔ · 25 unitários ✔ · **6 e2e (Chromium real) ✔** · Build (18 rotas) ✔ ·
Headers de segurança em runtime ✔ · RLS provada por impersonação ✔

## Top pendências de CONSTRUÇÃO (ordenadas por valor)
1. **Grupos familiares + acompanhantes autorizados** no RSVP (regra 35 da spec)
2. **Prazo do RSVP** (30/03/2027): bloqueio público + reabertura administrativa com justificativa
3. **CRUD de presentes no painel** (hoje a lista pública usa exemplos)
4. **Parcelas na UI financeira** (pagar parcela, renegociar com versionamento — motor já pronto)
5. **Rotas públicas dedicadas**: dúvidas, privacidade (LGPD), termos, programação
6. **Leitura de QR por câmera** no check-in
7. **Edição/exclusão lógica de convidados + mesa** na UI
8. Docs restantes (checklists de produção e do dia do casamento)
