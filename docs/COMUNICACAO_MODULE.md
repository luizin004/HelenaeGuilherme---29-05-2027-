# Central de relacionamento e comunicação + Padrinhos

Módulo para acompanhar convidados, famílias, padrinhos e madrinhas em toda a
jornada do casamento. **Princípios inegociáveis:** nada é enviado sem canal
validado; nada de dado inventado (parentesco, história, apelido); toda mensagem
crítica passa por revisão humana; a IA só gera rascunhos.

## Arquitetura

- **Banco** — migration `supabase/migrations/0004_comunicacao_padrinhos.sql`
  (aplicada ao projeto vivo em duas partes: schema + seeds; bucket em
  `hg_0004_audio_bucket`). 27 tabelas novas, todas `hg_`-prefixadas, RLS
  `for all to authenticated using (hg_is_member())`.
- **Domínio puro** — `domain/comm/*` (sem I/O, 100% testável).
- **Camada de dados** — `lib/comm-data.ts` (reads tipados).
- **Ações** — `app/actions/padrinhos.ts`, `app/actions/comm.ts`.
- **Telas** — `app/admin/(panel)/comunicacao/*` e `.../padrinhos/*`.
- **Componentes** — `components/admin/comm/*`.

## Tabelas (grupos)

| Grupo | Tabelas |
|---|---|
| Relacionamento | `hg_relationship_types`, `hg_guest_comm_profiles`, `hg_family_comm_context` |
| Padrinhos | `hg_wedding_party`, `hg_wedding_party_pairs`, `hg_wedding_party_groups`, `hg_wedding_party_group_members`, `hg_wedding_party_commitments`, `hg_wedding_party_tasks` |
| Prompts (IA) | `hg_ai_prompts`, `hg_ai_prompt_versions`, `hg_ai_prompt_tests`, `hg_ai_generation_logs` |
| Jornadas | `hg_comm_journeys`, `hg_comm_journey_stages` |
| Áudios | `hg_audio_assets`, `hg_audio_versions`, `hg_quick_replies` (bucket privado `hg-audios`) |
| Campanhas/mensagens | `hg_comm_campaigns`, `hg_comm_campaign_audiences`, `hg_comm_messages`, `hg_comm_message_versions`, `hg_comm_deliveries` |
| Caixa de entrada | `hg_comm_threads`, `hg_comm_inbound`, `hg_comm_tasks` |
| Canal | `hg_whatsapp_channels` (credenciais só em env; webhooks reusam `hg_webhook_events`) |

## Rotas

`/admin/comunicacao` (visão geral) · `/evania` · `/calendario` · `/jornadas`
(+`/[id]`) · `/campanhas` · `/mensagens` · `/audios` (+`/novo`) ·
`/caixa-de-entrada` · `/respostas-rapidas` · `/prompts` (+`/[id]`) ·
`/aprovacoes` · `/relatorios` · `/admin/configuracoes/comunicacao/whatsapp`.
`/admin/padrinhos` (+`/[id]`) · `/duplas` · `/grupos` · `/compromissos` ·
`/trajes` · `/pendencias` · `/tarefas`.

## Regras de negócio (domínio)

- **`personalize.ts`** — primeiro nome; tratamento na ordem apelido→preferido→
  nome→neutro (sem inventar); saudação de família/dupla; substituição de
  variáveis com relatório de faltantes; detecção de repetição artificial do nome.
- **`sanitize.ts`** — envia à IA só o contexto permitido; remove sempre-proibidos
  (financeiro, valor de presente, observações internas, tokens, documentos,
  saúde, credenciais, dados de outras famílias); reporta o que foi removido.
- **`consent.ts`** — `podeEnviar()` verifica canal validado, opt-out, aprovação
  pendente, consentimento por canal, telefone válido, horário silencioso e
  limite de frequência; `minutosLocais()` usa `America/Sao_Paulo`.
- **`idempotency.ts`** — chave determinística por (origem, destinatário, canal,
  dia) + deduplicação de audiência (detecta pessoa em vários segmentos).
- **`profile.ts`** — herança de contexto família→indivíduo com sobrescrita.

## Permissões (papéis)

- **admin**: tudo. **noivos**: aprovar mensagens/áudios, publicar prompts,
  criar jornadas, relatórios. **evania**: visualizar/criar/editar/agendar/
  responder, gravar/enviar áudio, criar tarefas, pausar campanhas — **não**
  acessa credenciais, usuários, financeiro completo, tokens, nem publica prompts.
- Publicar prompt e aprovar áudio checam papel no servidor (`admin`/`noivos`).

## Validações e segurança

- WhatsApp "pendente de configuração" bloqueia envio; credenciais só em env.
- Áudios em bucket **privado** com URL assinada; sem clonagem de voz.
- Transcrição automática marcada como "revisar"; nunca decide sozinha.
- Classificação da IA na caixa de entrada é sugestão; não altera RSVP, padrinho,
  ingresso, pagamento ou consentimento.
- Prompts versionados: publicar não sobrescreve; a versão publicada é apontada.

## Construtores (lote 2)

- **Campanhas** — `/comunicacao/campanhas/nova` monta o público por filtros e
  materializa a audiência em `hg_comm_campaign_audiences` (dedup). `/[id]` mostra
  incluídos/excluídos com motivo e uma prévia de "prontos para envio" por pessoa
  (consentimento + telefone + janela). Aprovar exige noivos/admin.
- **Teste de prompt** — `/comunicacao/prompts/[id]/testar`: convidado mascarado,
  contexto enviado/removido, 3 variações locais (sem IA), salvar exemplo.
- **Perfis** — `/comunicacao/perfis` (+`/[guestId]`) edita `hg_guest_comm_profiles`.
- **Fases** — edição inline em `/comunicacao/jornadas/[id]`.

## Testes

`tests/comm/comunicacao.test.ts` (22) + `tests/comm/audience-draft.test.ts` (6)
— personalização, sanitização, envio, idempotência/dedup, herança, filtro de
audiência, rascunho local e o **cenário obrigatório Carlos** (§32). Suite total:
53 testes verdes.

## Pendências (dependem de terceiros)

- Envio real por WhatsApp (provedor + credenciais em env) e webhooks de status.
- Geração real por IA (chave do provedor) — hoje o contexto/estrutura já estão
  prontos e sanitizados.
- Transcrição automática de áudios recebidos (provedor de STT).
- Preenchimento dos dados reais: padrinhos, telefones, cidades, relações e
  perfis de comunicação (feito pelos noivos/Evania no painel).
