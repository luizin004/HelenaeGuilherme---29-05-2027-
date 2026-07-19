# Arquitetura — Plataforma Helena & Guilherme

## Visão geral

Aplicação **Next.js 14 (App Router) + TypeScript + Supabase**, dividida em duas
superfícies sobre o mesmo banco:

- **Site público** (`/`, `/presentes`) — Server Components com dados do Supabase e
  fallback estático quando o backend não está configurado.
- **Painel administrativo** (`/admin/*`) — protegido por autenticação Supabase.

```
Navegador ──▶ Next.js (SSR + Route Handlers) ──▶ Supabase (Postgres + Auth + Storage)
                         │
                         └─▶ Asaas (cobranças Pix/cartão) ──▶ webhook ──▶ payments
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Front-end | Next.js 14, React 18, Tailwind CSS |
| Back-end | Route Handlers + Server Actions (Node runtime) |
| Banco | PostgreSQL (Supabase) |
| Auth | Supabase Auth (e-mail/senha) + middleware |
| Segurança | Row Level Security por tabela |
| Pagamentos | Asaas (Pix, cartão, boleto) |
| Deploy | Vercel + Supabase |

## Estrutura de pastas

```
app/
  layout.tsx                # fontes (Cormorant/Jost) + metadata
  page.tsx                  # home pública (SSR)
  presentes/page.tsx        # lista de presentes
  actions/                  # Server Actions (rsvp, checkin, auth)
  admin/
    login/page.tsx          # autenticação
    (panel)/                # grupo protegido: layout com sidebar
      page.tsx              # dashboard
      convidados/page.tsx
      financeiro/page.tsx
      checkin/page.tsx
  api/asaas/
    create/route.ts         # cria cobrança
    webhook/route.ts        # confirma pagamento
components/public/*         # Hero, Countdown, Story, Details, ...
components/admin/*          # Sidebar, UI (Kpi, Panel, Badge)
lib/
  supabase/                 # client (browser), server, admin (service role), middleware
  data.ts, admin-data.ts    # consultas com fallback
  asaas.ts                  # cliente da API do Asaas
  database.types.ts         # tipos do banco
middleware.ts               # sessão + proteção /admin
supabase/migrations/        # 0001_init.sql, 0002_rls.sql
```

## Modelo de segurança

- **RLS habilitada** em todas as tabelas (`0002_rls.sql`).
  - Conteúdo público (settings, venues, story, gallery, gifts): leitura anônima.
  - Dados de gestão: apenas `authenticated`.
  - Pagamentos: inserção via service role (webhook/route), sem exposição da chave.
- **Três clientes Supabase** com privilégios distintos:
  - `client.ts` (anon, browser) · `server.ts` (anon, cookies/SSR) · `admin.ts` (service role, server-only).
- **Middleware** renova a sessão e redireciona `/admin/*` não autenticado para o login.
- **Webhook do Asaas** validado por token (`ASAAS_WEBHOOK_TOKEN`).

## LGPD

- Dados pessoais (convidados) só acessíveis autenticado.
- `service_role` nunca chega ao client (apenas em Route Handlers/Server).
- Base para consentimento e minimização; retenção a definir com os noivos.

## Modo demonstração

Sem variáveis do Supabase, o site roda com conteúdo de exemplo e o painel abre em
"modo demonstração" — permite validar UI/UX antes de ligar o backend.
