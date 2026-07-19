# REQUIREMENTS_MATRIX — Rastreamento de requisitos (v3 — construção das pendências)

Status: `não iniciado` · `em desenvolvimento` · `implementado` · `testado` · `bloqueado` · `não aplicável`.
`testado` só com evidência executada. Bloqueios externos: ver `PENDING_DECISIONS.md`.

## Os 32 módulos do briefing — visão geral

| # | Módulo | Status | Evidência / Falta |
|---|--------|--------|-------------------|
| 1 | Site público | **testado** | 7 e2e em Chromium real; dados reais; paleta natural; **rotas dedicadas** (dúvidas, programação, privacidade/LGPD, termos) |
| 2 | Área individual do convidado | implementado | `/rsvp/[token]` com **fluxo de grupo** (todos os integrantes) + RPC validado no banco |
| 3 | Painel administrativo | implementado | 10 módulos, autorização por membro (provada por JWT) |
| 4 | Serviços internos | implementado | actions/domínio/repositórios separados |
| 5 | Gestão financeira | **testado** | Motor em centavos (R$1.893,50÷6 exato); 24 itens reais. **UI de parcelas**: gerar/pagar/estornar + renegociação versionada |
| 6 | Gestão de convidados | implementado | Cadastro + importação em massa (testada) + QR + **edição/mesa/exclusão lógica na UI** |
| 7 | Grupos familiares | implementado | `hg_rsvp_group`/`hg_rsvp_group_confirm` (validados no banco) + fluxo público de grupo |
| 8 | RSVP | implementado | Por token, sem busca pública; transporte incluso; **prazo 30/03/2027 aplicado** (bloqueio público + reabertura administrativa auditada) |
| 9 | Crianças | implementado | Painel /admin/infantil (alergias, responsável). Falta: check-in/out da criança com monitor |
| 10 | Transporte | **testado** | RPC grava transporte (validado no banco) |
| 11 | QR Codes | **testado** | Token opaco (testes) + geração de imagem + **leitura por câmera**. Falta: ciclo completo (bloquear/substituir/regenerar) |
| 12 | Check-in | implementado | Por token + registrado_por + auditoria + **scanner de câmera** (BarcodeDetector) |
| 13 | Operação offline | implementado | Cache local + fila de sincronização (check-in). Sync real: valida no deploy |
| 14 | CMS | implementado | História + hashtag editáveis refletem no site. Falta: fotos/locais/cardápio/dúvidas; rascunho/histórico |
| 15 | Lista de presentes | implementado | Página pública + **CRUD no painel** (criar/status/exclusão lógica); regras coletivo/quantidade parciais |
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
| 31 | Documentação | implementado | 17 docs; **PRODUCTION_CHECKLIST + WEDDING_DAY_CHECKLIST** adicionados. Opcionais: DATA_DICTIONARY, PERMISSIONS, TESTING detalhados |
| 32 | Plano de contingência | em desenvolvimento | Esboço em DISASTER_RECOVERY; consolidar |

## Fase 24 — cobertura total do construível (51 rotas)
Público: **A festa** (cardápio+atrações), **/como-chegar** (rota do mapa), **/cerimonia**,
**/recepcao**. RSVP: **Instagram** + **restrição por integrante**. Painel:
**Grupos familiares**, **Transporte**, **regenerar QR**, **Locais & mapa** (coordenadas →
Maps/Waze/QR), **Plano de chuva**, **Usuários & acesso**. Financeiro completo (Dashboard,
Orçamento, Cotações, Contas a pagar/pagas, Calendário, Parcelas, Projeção, Fluxo de caixa,
Aportes, Reembolsos, Cortesias, Relatórios, Comprovantes, Centros de custo, Categorias,
Divisão, Responsáveis) + **Evania** (agenda/diagnósticos/mensagem/config).
Pendências reais: **credenciais** (Asaas, WhatsApp/e-mail, IA), **dados** (coordenadas do
portão, fotos, valores), **deploy Vercel** e **RBAC granular** (depende de Auth).

## Contagem honesta
- **Testado (evidência executada): 6** · **Implementado: 19** · **Em desenvolvimento: 3**
- **Bloqueado por dependência EXTERNA: 3** (Asaas, provedor de mensagens, permissão Vercel)
- **Não iniciado: 1** (conciliação — depende do Asaas)
- Em desenvolvimento restantes: pedidos internos (16), backups automatizados (27), monitoramento/alertas (28)

## Verificações executadas (Fase 22)
Lint ✔ · Typecheck ✔ · 25 unitários ✔ · **7 e2e (Chromium real) ✔** · Build (25 rotas) ✔ ·
Headers de segurança em runtime ✔ · RLS provada por impersonação ✔ ·
Funções de grupo RSVP exercitadas no banco (lookup ordenado, confirmação mista, prazo) ✔

## Top pendências de CONSTRUÇÃO — CONCLUÍDAS na Fase 22
1. ✅ **Grupos familiares + acompanhantes** no RSVP (regra 35)
2. ✅ **Prazo do RSVP** (30/03/2027): bloqueio público + reabertura administrativa auditada
3. ✅ **CRUD de presentes no painel**
4. ✅ **Parcelas na UI financeira** (pagar/estornar + renegociação versionada)
5. ✅ **Rotas públicas dedicadas**: dúvidas, privacidade (LGPD), termos, programação
6. ✅ **Leitura de QR por câmera** no check-in
7. ✅ **Edição/exclusão lógica de convidados + mesa** na UI
8. ✅ Docs: `PRODUCTION_CHECKLIST.md` + `WEDDING_DAY_CHECKLIST.md`

## Pendências remanescentes (dependência externa ou fora do escopo imediato)
- Asaas (chaves) · provedor de mensagens · permissão de deploy na Vercel — `PENDING_DECISIONS.md`
- Pedidos internos completos, conciliação, backups automatizados, alertas de monitoramento
- Regras avançadas de presentes (cota coletiva/quantidade), ciclo completo de QR (revogar/regenerar)
