# WEDDING_DAY_CHECKLIST — Operação do dia do casamento

29/05/2027 · Cerimônia 15h · Igreja Nossa Senhora da Piedade (Campestre, Itabira-MG)
Recepção: Sítio Rancho das Águas (sentido João Monlevade).

Guia prático para quem vai operar o check-in e o painel no dia. Escrito para ser
usado no celular, mesmo com internet instável.

## Véspera
- [ ] Conferir a lista de confirmados no painel (`/admin/convidados`) e mesas atribuídas
- [ ] Fechar o `rsvp_prazo` se ainda estiver aberto (evita mudanças de última hora)
- [ ] Testar o login no aparelho que fará o check-in
- [ ] Abrir `/admin/checkin` no aparelho **com internet** ao menos uma vez — isso baixa a
      lista para o cache local (funciona offline depois)
- [ ] Carregar o(s) aparelho(s) e levar carregador/power bank

## Chegada ao local (antes dos convidados)
- [ ] Abrir `/admin/checkin` e confirmar o contador `0/total presentes`
- [ ] Permitir o acesso à **câmera** quando o navegador pedir (botão "Escanear com a câmera")
- [ ] Se a internet do local for ruim, não tem problema: o indicador mostra **○ Offline**
      e as chegadas entram numa fila que sincroniza sozinha quando a conexão voltar

## Durante o check-in
- [ ] Apontar a câmera para o QR do convite; ao ler, aparece "✓ Bem-vindo(a), Nome!"
- [ ] Sem câmera? Digitar o código no campo (funciona com leitor USB também)
- [ ] "Código não encontrado": convidado sem convite — encaminhar aos noivos/cerimonialista
- [ ] "já fez check-in": duplicado, seguir em frente
- [ ] Acompanhar o contador de presentes e o selo **"N a sincronizar"**

## Espaço infantil
- [ ] Conferir em `/admin/infantil` as crianças e **restrições alimentares/alergias**
- [ ] Passar a lista de alergias para o monitor e para a cozinha/buffet
- [ ] Definir o responsável por cada criança na entrega/retirada

## Se algo der errado
- **Aparelho sem internet o tempo todo:** o check-in continua funcionando; ao final,
  conectar a uma rede e tocar em "Sincronizar pendentes agora".
- **Aparelho descarregou / trocar de celular:** no novo aparelho, abrir `/admin/checkin`
  **com internet** para baixar a lista; quem já chegou aparece como presente.
- **Fila não sincroniza:** manter o app aberto com internet; a fila tenta sozinha.
  Não apagar o app durante o evento (a fila fica no armazenamento local).
- **Dúvida de convidado sobre presente/pagamento:** direcionar para `/presentes`.

## Depois da festa
- [ ] Garantir que a fila de check-in sincronizou (selo "a sincronizar" zerado)
- [ ] Conferir o total de presentes no painel
- [ ] Exportar/guardar os dados relevantes (a critério dos noivos)

> Lembrete de privacidade: os dados dos convidados são pessoais (LGPD). Não compartilhar
> listas fora da organização do casamento.
