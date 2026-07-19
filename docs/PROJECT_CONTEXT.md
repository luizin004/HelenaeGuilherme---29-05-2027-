# PROJECT_CONTEXT — Contexto do projeto

## O que é
Plataforma única para o casamento de **Helena & Guilherme** (29/05/2027, 15h, Itabira-MG):
site público para convidados + central de organização e operação (painel dos noivos).
Conceito: **"O início do nosso maior projeto"** — a metáfora de construção (de uma vida,
de uma família), tratada de forma emocional e elegante, jamais literal.

## Público
- **Convidados:** acessam site público e área individual (RSVP, QR, presentes).
- **Noivos e organização:** painel administrativo (não técnico) — finanças, convidados,
  fornecedores, comunicação, check-in.
- **Recepção (dia do evento):** modo simplificado de check-in, sem dados sensíveis.

## Estado atual (resumo honesto)
- **Funciona hoje:** app Next.js com build de produção passando; site público SSR com os
  **dados reais** do evento; RSVP gravando no banco; painel com login, dashboard,
  convidados, financeiro (leitura) e check-in por token; API Asaas (criar cobrança +
  webhook) pronta para receber chaves.
- **Modo demonstração** ativo enquanto o Supabase de produção não é provisionado (PEND-004).
- **Não implementado ainda:** perfis/permissões granulares, CRUD financeiro completo,
  fornecedores/contratos/documentos, importação de convidados, geração de QR, offline,
  CMS, comunicação, auditoria/backups, testes automatizados, CI/CD. Ver matriz e plano.

## Restrições inegociáveis (do briefing)
- Não inventar dados (valores, vencimentos, responsáveis, fornecedores, endereços,
  coordenadas). Valor desconhecido ≠ zero.
- Dinheiro em centavos; presentes separados do orçamento; exclusão lógica; auditoria.
- Pagamento confirmado só por webhook validado. QR sem dado pessoal. Sem busca pública
  ampla de convidados. Segurança em UI + servidor + banco.

## Fonte da verdade
`docs/PROJECT_SPEC.md` (consolidado). Lacunas em `docs/PENDING_DECISIONS.md`.
Rastreamento em `docs/REQUIREMENTS_MATRIX.md`.
