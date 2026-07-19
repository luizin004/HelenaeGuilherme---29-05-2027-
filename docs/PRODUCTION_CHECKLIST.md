# PRODUCTION_CHECKLIST — Publicação e go-live

Checklist para colocar o sistema no ar com segurança. Itens marcados **[externo]**
dependem de credenciais/ações fora deste repositório.

## 1. Variáveis de ambiente (Vercel → Project Settings → Environment Variables)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://wjsbyahzwdupsmopygkg.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave anon do projeto
- [ ] `NEXT_PUBLIC_SITE_URL` = URL pública final (ex.: `https://helenaeguilherme.com.br`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = service role (somente server) — **necessária para o webhook Asaas**
- [ ] `ASAAS_API_KEY` / `ASAAS_WEBHOOK_TOKEN` **[externo]** — quando a conta Asaas existir (PEND-005)

> Nunca commitar `.env.local`. O `NEXT_PUBLIC_SITE_URL` alimenta o link do convite
> e o QR — se estiver errado, os QR Codes apontam para o host errado.

## 2. Banco de dados (Supabase)
- [ ] 28 tabelas `hg_` presentes com RLS **habilitado** (conferir em `list_tables`)
- [ ] Advisors sem alertas de segurança críticos (`get_advisors` → security)
- [ ] `hg_wedding_settings.rsvp_prazo` = `2027-03-30T23:59:59-03:00` (ajustável no painel)
- [ ] Bucket privado `hg-documentos` com `public=false`
- [ ] Usuário admin criado em `hg_profiles` (só membros acessam `/admin`)

## 3. Deploy (Vercel)
- [ ] Importar o repositório na conta do cliente (o sandbox não tem permissão — PEND-008)
- [ ] Framework preset: **Next.js** · Build: `next build` · Node 18+
- [ ] Deploy do branch de produção; conferir as 25 rotas no build
- [ ] Configurar domínio + HTTPS

## 4. Verificação pós-deploy (roteiro em runtime — o que NÃO pôde ser testado no sandbox)
- [ ] Login pelo formulário → sessão → leitura autenticada do painel
- [ ] Cadastrar 1 convidado → gerar QR → abrir `/rsvp/<token>`
- [ ] RSVP em grupo grava status/transporte/mensagem no banco
- [ ] Após `rsvp_prazo`, o formulário público bloqueia; reabertura pelo painel funciona
- [ ] Check-in por câmera lê o QR e registra `check_in_em` + `check_in_por`
- [ ] Check-in offline: desligar rede, registrar chegada, religar → fila sincroniza
- [ ] Upload de documento no bucket privado + URL assinada abre para membro
- [ ] Presente cadastrado no painel aparece em `/presentes`
- [ ] Parcelas: gerar cronograma, marcar pago, renegociar (versão incrementa)
- [ ] **[externo]** Webhook Asaas: pagamento sandbox → evento idempotente (duplicado não reprocessa)

## 5. Segurança (revalidar em produção)
- [ ] Headers presentes (X-Frame-Options, nosniff, Referrer-Policy, HSTS) — `curl -I`
- [ ] Anônimo lê só conteúdo público; financeiro/convidados/auditoria invisíveis
- [ ] Nenhuma chave de service role exposta no bundle do cliente

## 6. Conteúdo
- [ ] História e hashtag revisadas no CMS (`/admin/conteudo`)
- [ ] Locais/horário conferidos (Igreja N. S. da Piedade 15h · Sítio Rancho das Águas)
- [ ] Lista de presentes real cadastrada (remover exemplos)

## Pendências externas conhecidas
Asaas (chaves), provedor de e-mail/WhatsApp, coordenadas de mapa dos locais,
permissão de deploy na Vercel — ver `PENDING_DECISIONS.md`.
