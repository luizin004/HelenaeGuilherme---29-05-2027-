# VALIDATION — Relatório de validação

> **Atualização (Fase 22):** pendências do backlog construídas (RSVP em grupo + prazo,
> presentes CRUD, parcelas na UI, rotas públicas, QR por câmera, edição de convidados).
> lint (zero erros), 25 unitários, **7 e2e em Chromium real**, **build com 25 rotas**,
> headers de segurança verificados em runtime. Funções de grupo RSVP exercitadas no banco.
> RLS endurecida: gestão restrita a **membros** (`hg_is_member()`); prova por
> impersonação de JWT — usuário autenticado de outro sistema vê **0** registros do
> casamento; admin vê tudo. Webhook Asaas agora **idempotente** com payload armazenado.

Fechamento da validação até onde o ambiente de desenvolvimento permite.
**Limite conhecido (PEND-009):** o sandbox bloqueia o egress ao host do Supabase, então
a integração **app↔Supabase em runtime** só pode ser exercitada no **deploy**. Todas as
demais camadas foram validadas aqui.

## 1. Qualidade de código ✅
| Verificação | Comando | Resultado |
|-------------|---------|-----------|
| Testes automatizados | `npm test` (Vitest) | **25/25 passando** |
| Análise de tipos | `tsc --noEmit` | **OK** |
| Build de produção | `next build` | **Compilado, 25 rotas** |

Testes cobrem: dinheiro em centavos, **parcelamento com fechamento exato**
(R$ 1.893,50 em 6× = R$ 1.893,50), item gratuito sem parcela, parcela sem vencimento,
divisão por responsáveis, token de QR seguro, e importação de convidados (parse/dedupe).

## 2. Banco de dados ✅ (via SQL/MCP)
| Item | Evidência |
|------|-----------|
| Tabelas isoladas `hg_` | **28 tabelas**, todas com RLS |
| Seed financeiro real | **24 despesas**; 3 cronogramas fecham exato (`fecha_exato=true`) |
| Responsáveis / centros | 4 responsáveis · 6 centros · 20 permissões |
| Admin | 1 perfil admin; login emite token (auth/v1/token 200) |
| Storage | bucket privado `hg-documentos` (public=false) + policies escopadas |

## 3. Segurança / RLS ✅ (impersonando papéis no banco)
Prova definitiva de que o modelo de acesso funciona (há 24 despesas no banco):

| Papel | `hg_venues` (público) | `hg_expenses` (financeiro) | `hg_guests` | `hg_audit_log` |
|-------|----------------------:|---------------------------:|------------:|---------------:|
| **anon** | 2 (lê) | **0 (bloqueado)** | 0 (bloqueado) | 0 (bloqueado) |
| **authenticated** | — | **24 (vê)** | vê | vê |

→ Conteúdo público legível por qualquer um; **dados sensíveis (financeiro, convidados,
auditoria) invisíveis ao anônimo** e acessíveis apenas autenticado. LGPD / regra 36 atendidas.

## 4. Fluxos validados no banco ✅
- **RSVP por token** (`hg_rsvp_lookup` / `hg_rsvp_confirm`): anon executa; confirmação
  altera `status`→confirmado, grava `respondeu_em` e mensagem.
- **Autorização do painel**: apenas usuários em `hg_profiles` acessam `/admin`
  (checagem no servidor) — os demais usuários do projeto compartilhado ficam de fora.

## 5. NÃO validado aqui (requer deploy) ⏳
Implementado e com build OK, mas **nunca exercitado em runtime** por causa do egress:
- Login pelo formulário → sessão → leitura autenticada no painel
- RSVP gravando pela interface `/rsvp/[token]`
- Geração/leitura de QR na tela · upload de documentos (Storage) · check-in pela interface

**Como fechar 100%:** publicar na Vercel (import do repo + variáveis de `.env.example`).
Roteiro de teste pós-deploy em `README.md` / `ADMIN_MANUAL.md`.

## 6. Pendências externas (não bloqueiam o que está pronto)
Asaas (chaves), provedor de e-mail/WhatsApp, coordenadas dos locais, seed de
responsáveis/vencimentos por item — ver `PENDING_DECISIONS.md`.
