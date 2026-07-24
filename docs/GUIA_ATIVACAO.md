# Guia de ativação — Helena & Guilherme + Rancho das Águas

Tudo está **construído e no branch**. Para colocar no ar e ir ligando as peças,
siga na ordem. Os 3 primeiros passos deixam o site **público e funcional**; os
demais são opcionais/quando você tiver cada peça.

---

## Passo 1 — Publicar na Vercel (deixa tudo no ar)
1. Entre na Vercel e **importe o repositório** (conta sua — a do ambiente não tem permissão).
2. Framework: **Next.js** (detecta sozinho).
3. Em **Settings → Environment Variables**, adicione (Production e Preview):

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wjsbyahzwdupsmopygkg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(chave anon já enviada no chat)* |
| `NEXT_PUBLIC_SITE_URL` | a URL final da Vercel (ou seu domínio) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (Reveal) |

4. **Deploy**. Depois, teste o login em `/admin`:
   - e-mail `guilherme.moura@oralaligner.com.br` · senha `102030@g`

> Sem isso, o site não fica público (e o app só conversa com o Supabase depois do deploy).

---

## Passo 2 — Subir as fotos (aparecem sozinhas)
Coloque os arquivos nas pastas, com estes nomes, e faça commit (redeploy automático):

**`public/rancho/`** — `aerea-deck.jpg` · `panoramica.jpg` · `lago-vertical.jpg` ·
`aerea-montanhas.jpg` · `vista-geral.jpg` · `noite-deck.jpg` · `noite-bar.jpg` · `crianca-correndo.jpg`

**`public/images/hoteis/`** — `it-itabira-hotel.jpg` · `premium-executive-hotel.jpg` ·
`hotel-domus-itabira.jpg` · `hotel-job.webp`

Até subir, os espaços mostram um gradiente da paleta (não quebra). O **vídeo do Rancho já funciona**.

---

## Passo 3 — Cadastrar a coordenada do Rancho
Painel → **Locais & mapa** → *Sítio Rancho das Águas* → preencher **latitude/longitude**
(ou colar o **link do Google Maps**) → salvar.
→ Ativa os botões **Maps/Waze** e o QR de localização no site do casamento e no `/rancho`.

---

## Passo 4 — Preencher o financeiro (quando quiser)
Não é obrigatório para o site funcionar. Fluxo sugerido no painel:
**Montar orçamento** (marca os itens) → **Financeiro** (informa valores) →
**Cotações** (compara e contrata) → **Parcelas/Projeção/Fluxo de caixa**.

---

## Passo 5 — Ligar pagamentos de presentes (Asaas) — opcional/depois
1. Criar conta no **Asaas**; pegar a **API key** e definir um **token de webhook**.
2. Adicionar variáveis na Vercel: `ASAAS_BASE_URL`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`.
3. No painel do Asaas, apontar o webhook para `https://SEU-SITE/api/asaas/webhook`.
4. Testar no **sandbox** antes de produção.
→ Ativa o botão **"Presentear"** e a conciliação.

---

## Passo 6 — Ligar a Evania (envio automático) — depois
- Precisa de **provedor de WhatsApp/e-mail** (ex.: WhatsApp Cloud API, Resend) e **chave de IA**.
- Hoje a Evania já monta a **agenda** e a **mensagem pronta** para você copiar no grupo.
- Configuração em Painel → **Evania**.

---

## Quem fornece o quê
- **Você:** fotos, coordenada do Rancho, valores reais das despesas.
- **Terceiros:** Asaas (pagamento), WhatsApp/e-mail (envio), IA (leitura de comprovantes).

## O que já funciona hoje (após o Passo 1)
Site do casamento (RSVP em grupo, presentes, dúvidas, programação, cerimônia,
recepção, como chegar, hospedagem, espaço infantil) · Painel completo (convidados,
grupos, transporte, check-in, financeiro completo, Evania, leads) · Site comercial
do Rancho (`/rancho`) com vídeo, galeria e captação de leads.
