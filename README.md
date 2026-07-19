# 🤍 Helena & Guilherme · 29.05.2027

Plataforma de **gestão do casamento** de Helena e Guilherme — mais que um site:
a central de organização e operação do grande dia.

Identidade visual: monograma **HG** em bronze/champanhe sobre off-white.

## 🎨 Paleta (extraída do monograma)

| Token | Cor | Uso |
|-------|-----|-----|
| Bronze | `#8a7359` | Primária |
| Bronze escuro | `#5c4a38` | Títulos, rodapé |
| Bronze profundo | `#45372a` | Sidebar admin |
| Champanhe | `#c9b79c` | Detalhes, destaques |
| Off-white | `#faf8f3` | Fundo |
| Creme | `#f0ebe2` | Seções alternadas |
| Tinta | `#3a3129` | Texto |

## 🗂️ Estrutura

```
.
├── index.html              # Site público (convidados)
├── assets/logo.svg         # Monograma HG
├── css/
│   ├── styles.css          # Design system + site público
│   └── admin.css           # Painel administrativo
├── js/
│   ├── main.js             # Site público (contagem, RSVP, animações)
│   ├── admin.js            # Layout compartilhado do painel
│   └── supabase.js         # Config do cliente Supabase
├── admin/
│   ├── index.html          # Dashboard
│   ├── convidados.html     # Lista de convidados + QR
│   ├── financeiro.html     # Controle financeiro + projeção
│   └── checkin.html        # Check-in do dia
└── supabase/
    ├── migrations/
    │   ├── 0001_init.sql   # Todas as tabelas (21 tabelas)
    │   └── 0002_rls.sql    # Políticas de segurança
    └── functions/
        └── asaas-payment/  # Edge Function de pagamento (Asaas)
```

## 🧩 Módulos (escopo)

**Site público (convidados)**
- ✅ História do casal · informações · rota até os locais (Google Maps)
- ✅ Confirmação de presença (RSVP) · espaço infantil
- ✅ Lista de presentes · estrutura de pagamento via Asaas
- 🔜 QR Code individual por convidado

**Painel administrativo**
- ✅ Dashboard · lista de convidados · financeiro · check-in (telas)
- 🔜 Fornecedores · contratos · projeção mensal · documentos · comunicação
- 🔜 Pagamentos (Asaas) · relatórios

## 🗄️ Banco de dados

O schema (`supabase/migrations/0001_init.sql`) cobre os 18 módulos com **21 tabelas**:
perfis, configurações, locais, história, galeria, grupos, convidados, crianças,
categorias e itens de presente, pagamentos, fornecedores, contratos, parcelas,
documentos, categorias e lançamentos financeiros, projeção mensal, comunicações,
logs e check-ins.

## 🚀 Como visualizar

```bash
python3 -m http.server 8000
# Site:   http://localhost:8000
# Painel: http://localhost:8000/admin/
```

## 🔌 Ativar o backend (Supabase + Asaas)

1. Criar projeto no Supabase e rodar as migrations (`supabase db push`).
2. Preencher `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `js/supabase.js`.
3. Configurar os segredos do Asaas e publicar a Edge Function `asaas-payment`.
4. Publicar o frontend (ex.: Vercel) — opcionalmente com domínio próprio.

## 🗺️ Roadmap por fases

- [x] **Fase 1 — Fundação:** identidade visual, site público, schema completo, shell do admin
- [ ] **Fase 2 — Convidados:** CRUD, RSVP conectado, geração de QR Code
- [ ] **Fase 3 — Presentes & Asaas:** checkout PIX/cartão e webhook de confirmação
- [ ] **Fase 4 — Gestão:** financeiro, fornecedores, contratos, projeção, documentos
- [ ] **Fase 5 — Operação:** comunicação e check-in por câmera no dia
- [ ] **Fase 6 — Deploy:** autenticação, publicação e domínio

---

Feito com carinho. Nos vemos lá 🤍
