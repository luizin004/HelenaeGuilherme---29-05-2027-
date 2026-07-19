# 🤍 Helena & Guilherme · 29.05.2027

Plataforma de **gestão do casamento** de Helena e Guilherme — site público para os
convidados **+** central de organização e operação (painel dos noivos).

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Supabase (Postgres + Auth) · Asaas.

## 🚀 Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha as chaves (ou deixe vazio p/ modo demonstração)
npm run dev                  # http://localhost:3000
```

- Site público: `http://localhost:3000`
- Painel: `http://localhost:3000/admin` (login em `/admin/login`)

> Sem chaves do Supabase, tudo roda em **modo demonstração** com dados de exemplo.

## 🗄️ Banco de dados

```bash
# Via Supabase CLI (recomendado)
supabase db push        # aplica supabase/migrations/*.sql
```

O schema (`supabase/migrations/0001_init.sql`) tem **21 tabelas** cobrindo os 18
módulos; `0002_rls.sql` aplica as políticas de segurança (RLS).

## 🎨 Identidade

Paleta bronze/champanhe extraída do monograma **HG** (`public/logo.svg`).
Tokens em `tailwind.config.ts`; tipografia Cormorant Garamond + Jost.

## 📦 Estrutura

Ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para o detalhamento completo.

## ✅ Status por módulo

| Módulo | Estado |
|--------|--------|
| Site público (história, info, rota, galeria, infantil) | ✅ |
| RSVP (grava no banco) | ✅ |
| Autenticação + painel protegido | ✅ |
| Dashboard · Convidados · Financeiro · Check-in | ✅ telas + leitura |
| Lista de presentes (pública) | ✅ UI |
| Pagamento Asaas (criar cobrança + webhook) | ✅ API |
| QR Code por convidado | 🔜 geração |
| Fornecedores · Contratos · Documentos · Comunicação · Projeção | 🔜 CRUD |

## 🗺️ Roadmap

- [x] **Fase 1** — Fundação: arquitetura, design system, schema
- [x] **Fase 2** — App Next.js: site público SSR, auth, painel, RSVP, API Asaas
- [ ] **Fase 3** — Convidados: CRUD completo + geração/leitura de QR Code
- [ ] **Fase 4** — Gestão: financeiro, fornecedores, contratos, projeção, documentos
- [ ] **Fase 5** — Comunicação + check-in por câmera
- [ ] **Fase 6** — Testes, acessibilidade, deploy em produção

---

Feito com carinho. Nos vemos lá 🤍
