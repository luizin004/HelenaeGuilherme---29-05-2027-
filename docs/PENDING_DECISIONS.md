# PENDING_DECISIONS — Bloqueios e decisões pendentes

Cada pendência tem: identificador, descrição, motivo, impacto, responsável pela
resolução, solução temporária, procedimento para concluir, módulo afetado.
**Todo `TODO` no código referencia um ID desta lista.**

---

## PEND-001 · Arquivo `docs/PROJECT_SPEC.md` original ausente
- **Descrição:** o briefing indica que `docs/PROJECT_SPEC.md` contém os requisitos
  integrais, mas o arquivo **não estava no repositório**.
- **Motivo:** não fornecido / não versionado.
- **Impacto:** ALTO — bloqueia dados exatos (financeiro, coordenadas, rotas públicas
  detalhadas, cardápio, atrações).
- **Responsável:** cliente (Helena/Guilherme/Toninho).
- **Solução temporária:** `PROJECT_SPEC.md` foi **consolidado** a partir das mensagens
  do cliente; itens sem dado ficam PENDENTES (não inventados).
- **Procedimento:** enviar o arquivo original ou colar o conteúdo; será mesclado e a
  matriz de requisitos, atualizada.
- **Módulo:** todos.

## PEND-002 · Coordenadas e links de mapa dos locais
- **Descrição:** endereços textuais fornecidos (Igreja N. S. da Piedade – Campestre,
  Itabira-MG; Sítio Rancho das Águas – Itabira-MG, sentido João Monlevade), mas **sem
  latitude/longitude nem link oficial** do Google Maps.
- **Motivo:** não fornecidos.
- **Impacto:** MÉDIO — rota exata / pin no mapa.
- **Responsável:** cliente.
- **Solução temporária:** botão "Ver rota" usa busca por nome; painel exibe
  **"Localização digital pendente"**. Campos `latitude`/`longitude`/`maps_url` nulos.
- **Procedimento:** informar coordenadas ou colar o link do Maps de cada local.
- **Módulo:** locais/rota, CMS.

## PEND-003 · Seed financeiro (valores, vencimentos, responsáveis)
- **Descrição:** fornecedores/itens citados (fotógrafo, cerimonialista, salão Jessyca
  Cardoso, Churrasco do Guh, Convite VIP, churrasqueiro de domingo, vestido, terno do
  Guilherme, tenda Q30), **sem os valores, datas de vencimento e responsável por item**.
- **Motivo:** dependem do PROJECT_SPEC.md original (PEND-001).
- **Impacto:** ALTO — regras 2–9 proíbem inventar valores/vencimentos/responsáveis.
- **Responsável:** cliente / financeiro (Toninho).
- **Solução temporária:** schema financeiro completo (centavos, parcelas, responsáveis,
  centros de custo, cortesias) implementado; **seed não populado**. Nenhum valor
  fabricado. Teste de arredondamento (R$ 1.893,50 em 6x) implementado com dado sintético
  de teste isolado (não vai para produção).
- **Procedimento:** fornecer planilha/lista com item, valor (R$), responsável,
  vencimento(s), centro de custo, gratuito (sim/não); será convertida em seed idempotente.
- **Módulo:** financeiro.

## PEND-004 · Backend Supabase — ✅ RESOLVIDO
- **Solução aplicada:** por decisão do cliente (reusar projeto existente, sem custo novo),
  as tabelas do casamento foram criadas com **prefixo `hg_`** e **RLS em todas** no projeto
  **"Sistema De Orçamentos"** (`wjsbyahzwdupsmopygkg`, org OralAligner, região sa-east-1).
  Isolamento por nomenclatura → **zero colisão** com as tabelas existentes.
- **Validado:** 28 tabelas `hg_`, 28/28 com RLS; anon lê apenas conteúdo público;
  convidados/pagamentos/financeiro só autenticado; app conecta em runtime (auth ativa).
- **Pendente do cliente:** `SUPABASE_SERVICE_ROLE_KEY` (para webhook Asaas/conciliação) —
  copiar de Supabase → Settings → API e colocar em `.env.local` / variáveis da hospedagem.
- **Nota:** `.env.local` (com a chave anon) fica fora do git; em produção, configurar as
  variáveis na Vercel.

## PEND-005 · Credenciais Asaas (sandbox e produção)
- **Descrição:** `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` não fornecidos.
- **Impacto:** MÉDIO — checkout de presentes inativo até configurar.
- **Solução temporária:** rotas `create`/`webhook` implementadas com idempotência e
  validação; retornam 503 quando não configurado. **Integração NÃO validada** (sem chave).
- **Procedimento:** fornecer chave sandbox → validar fluxo → repetir em produção.
- **Módulo:** presentes/pagamentos.

## PEND-006 · Canais de comunicação (e-mail/WhatsApp)
- **Descrição:** provedor de e-mail e API de WhatsApp não definidos.
- **Impacto:** MÉDIO — envio real de mensagens/notificações.
- **Solução temporária:** modelos e logs modelados; envio desativado sem configuração.
- **Procedimento:** definir provedor (ex.: Resend, WhatsApp Cloud API) e chaves.
- **Módulo:** comunicação/notificações.

## PEND-007 · Domínio de produção
- **Descrição:** domínio próprio (ex.: helenaeguilherme.com.br) não informado.
- **Impacto:** BAIXO.
- **Solução temporária:** `NEXT_PUBLIC_SITE_URL` via env; usa URL da Vercel por padrão.
- **Procedimento:** informar domínio; apontar DNS na Vercel.
- **Módulo:** deploy.

## PEND-008 · Publicação na Vercel (permissão)
- **Descrição:** conta Vercel conectada **sem permissão de criar projeto** (403) no time
  "Luiz Otávio's projects" (SAML).
- **Impacto:** MÉDIO — impede deploy automatizado.
- **Solução temporária:** app pronto para deploy; documentado em `DEPLOYMENT.md`.
- **Procedimento:** liberar criação de projeto / autorizar SSO da integração.
- **Módulo:** deploy.
