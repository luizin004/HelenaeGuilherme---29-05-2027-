# PROJECT_SPEC — Plataforma de Casamento · Helena & Guilherme

> **Origem deste documento.** O arquivo `docs/PROJECT_SPEC.md` referenciado no
> briefing **não existia no repositório** no início da execução (ver
> `docs/PENDING_DECISIONS.md` → PEND-001). Este arquivo **consolida os requisitos
> exatamente como fornecidos pelo cliente** nas mensagens do projeto. Nenhum dado
> foi inventado. Onde uma informação necessária não foi fornecida, está marcada
> como **PENDENTE** e catalogada em `PENDING_DECISIONS.md` — nunca preenchida com
> suposição.

---

## 1. Dados do evento (confirmados)

| Campo | Valor |
|-------|-------|
| Casal | **Helena & Guilherme** |
| Conceito | **"O início do nosso maior projeto"** |
| Data | **29 de maio de 2027** |
| Horário | **15h** |
| Fuso horário | **America/Sao_Paulo** |
| Prazo inicial do RSVP | **30 de março de 2027** (configurável) |
| Traje | **Esporte fino completo** |
| Cerimônia | **Igreja Nossa Senhora da Piedade**, Campestre, **Itabira — MG** |
| Recepção | **Sítio Rancho das Águas**, Itabira — MG (sentido João Monlevade) |

### Coordenadas / links de mapa
**PENDENTE** (PEND-002). Não inventar. Enquanto ausente, o painel exibe
"Localização digital pendente" e o site usa busca por nome no Maps.

---

## 2. Conceito e narrativa

Helena e Guilherme construíram juntos: sonhos, negócios, experiências, desafios,
conquistas, planos, uma casa, um futuro. Agora iniciam a construção da própria
**família**. A metáfora de **construção** deve ser **emocional, elegante e
sofisticada** — nunca literal (sem obra, capacete, concreto, ferramentas,
engenharia pesada, planta baixa técnica).

---

## 3. Identidade visual

- Base: **off-white, areia, bege**
- Primárias: **verde-oliva, verde-musgo**
- Acentos: **marrom amadeirado, dourado fosco**
- Elementos: linhas arquitetônicas discretas, formas orgânicas, vegetação,
  texturas naturais, **monograma H & G**, data **29 · 05 · 2027**

**Decisão de design (DEC-004):** o monograma HG fornecido é marrom amadeirado —
tratado como acento "marrom amadeirado". As **verdes (oliva/musgo)** passam a ser
as cores **primárias**; marrom e dourado fosco como **acentos**.

---

## 4. Superfícies

### 4.1 Site público — emocional, elegante, rápido, responsivo, pessoal
Rotas: início, nossa história, cerimônia, recepção, rota, programação, traje,
gastronomia, atrações, espaço infantil, RSVP, presentes, dúvidas, privacidade,
termos.

**Home:** Helena & Guilherme · "O início do nosso maior projeto" · 29/05/2027 ·
horário · local · fotografia · monograma · contagem regressiva (fuso SP) ·
confirmação · presentes · nossa história · traje · resumo dos locais.
Após o casamento, a contagem é substituída por mensagem configurável.

### 4.2 Área individual do convidado
Identificação por telefone/código, integrantes autorizados, RSVP, QR Code.

### 4.3 Painel administrativo — simples, visual, organizado, seguro
Para usuários **não técnicos**. Não pode parecer ERP, planilha antiga, template
genérico ou e-commerce frio.

---

## 5. Módulos (escopo integral)

1. site público · 2. área do convidado · 3. painel admin · 4. serviços internos ·
5. gestão financeira · 6. gestão de convidados · 7. grupos familiares · 8. RSVP ·
9. crianças · 10. transporte · 11. QR Codes · 12. check-in · 13. operação offline ·
14. CMS · 15. lista de presentes · 16. pedidos · 17. pagamentos Asaas · 18. Webhooks ·
19. conciliação · 20. fornecedores · 21. contratos · 22. cortesias · 23. documentos ·
24. comunicação · 25. notificações · 26. auditoria · 27. backups · 28. monitoramento ·
29. segurança · 30. publicação · 31. documentação · 32. plano de contingência.

---

## 6. Regras financeiras (invioláveis)

Estados separados: orçado, cotado, aprovado, contratado, previsto, pago, vencido,
realizado, projetado, gratuito.

**Responsáveis pelo pagamento** (≠ centro de custo): Helena, Guilherme, **Toninho**, Gratuito.
**Centros de custo:** cerimônia, recepção, noivos, convidados, estrutura, administrativo.

Regras obrigatórias:
1. soma das parcelas fecha exatamente o total;
2. soma da divisão por responsáveis fecha exatamente o desembolso;
3. entrada faz parte do cronograma e não é somada duas vezes;
4. item gratuito não gera parcela nem saída de caixa;
5. parcela sem vencimento não é vencida;
6. renegociação não apaga o cronograma anterior;
7. pagamento não é apagado (exclusão lógica);
8. alterações críticas são auditadas;
9. **valor desconhecido ≠ zero** (fica nulo/pendente);
10. presentes **não** interferem no financeiro do casamento.

**Dinheiro:** armazenar em **centavos inteiros (bigint)** — nunca ponto flutuante.

**Projeção mensal:** julho/2026 → maio/2027 (período ampliável).

### Seed financeiro
Fornecedores/itens citados: fotógrafo, cerimonialista, salão **Jessyca Cardoso**,
**Churrasco do Guh**, **Convite VIP**, churrasqueiro de domingo, vestido de
casamento, terno do Guilherme, **tenda Q30**, itens pendentes.
**Valores, vencimentos e responsáveis por item: PENDENTE (PEND-003)** — dependem do
PROJECT_SPEC.md original. Estrutura pronta; seed não populado até o cliente fornecer.
Teste de arredondamento obrigatório fornecido: **R$ 1.893,50 em 6 parcelas fecha
exatamente R$ 1.893,50.**

---

## 7. Convidados, RSVP, crianças, transporte

- Convidados pré-cadastrados; grupos familiares; código do convite; link individual;
  acompanhantes **autorizados** (sem acompanhante livre); **sem busca pública ampla**.
- Importação CSV/XLSX/colar, mapeamento de colunas, duplicidade, desfazer, ponto de restauração.
- Fluxo RSVP: identificação → validação telefone/código → integrantes autorizados →
  confirmação individual → restrições → acessibilidade → transporte → crianças →
  mensagem → QR Code. Prazo configurável; após o prazo, bloqueio público + confirmação
  administrativa + reabertura com justificativa.
- Crianças: nome, idade, alergias, restrições, necessidade especial, responsável,
  telefone, autorização, observações; check-in/out com monitor. Usar **"Espaço
  acompanhado por monitores"** (nunca "segurança total").
- Transporte: carro / com outra pessoa / oferece vagas / precisa carona / transporte
  contratado / não definiu. **Não compartilhar telefones automaticamente.**

---

## 8. QR Code e check-in

QR contém **apenas token aleatório seguro** (sem nome/telefone/e-mail/CPF/ID
sequencial). Status: não gerado, ativo, utilizado, bloqueado, substituído, cancelado.
Uso único, bloqueio de duplicidade, histórico, invalidação, regeneração, check-in
manual, busca por nome, check-in por grupo, responsável, observações.
**Modo recepção** sem acesso a financeiro/documentos/presentes/integrações/tokens.
**Offline-first:** IndexedDB, fila de sincronização, prevenção de conflito, horário
local, sincronização posterior, indicação de pendências.

---

## 9. Presentes e Asaas

Módulo **separado** do orçamento. Valor mínimo **R$ 300,00**, valor livre acima,
categorias, anônimo, mensagem, coletivo, quantidade limitada/ilimitada.
Asaas: Pix, cartão, parcelamento, boleto. Fluxo: pedido interno → cobrança Asaas →
checkout → Webhook validado → **idempotência** → atualização → taxa → líquido →
conciliação → confirmação. **Nunca** confirmar por página de sucesso. Sandbox ≠
produção. Chaves nunca no navegador.

---

## 10. Comunicação, documentos, auditoria, backups, segurança, LGPD

Ver `SECURITY.md`, `OPERATIONS.md`, `DISASTER_RECOVERY.md`, `INTEGRATIONS.md`.
Resumo: modelos de mensagem (e-mail/WhatsApp/link), envio só com configuração;
documentos em storage privado com URL assinada; auditoria de finanças/pagamentos/
convidados/QR/importações/permissões/tokens/webhooks/documentos; backups + ponto de
restauração antes de operações críticas; RLS + validação servidor + rate limiting;
LGPD (consentimento, retenção, exclusão, anonimização). Instagram do convidado é
opcional e **não** usável para marketing sem novo consentimento.

---

## 11. Definição de pronto (por funcionalidade)

banco · migration · constraint · índice · RLS · tipo · schema (Zod) · validação ·
serviço · interface · permissão · auditoria · tratamento de erro · loading · estado
vazio · teste · documentação. **Interface isolada não conta como pronto.**
