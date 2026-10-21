# RAG · Fila de disparos, limites e cadência

## QUEM CONTROLA O QUÊ
- Mercúrio planeja a fila (cria DISPARO status Planejado).
- Controle libera (vira Pronto), respeitando limites, janelas e cadência.
- Executor envia (vira Enviado ou Erro).
- Nenhum papel pode pular etapa. Mercúrio nunca marca Pronto.
  Executor nunca executa o que não está Pronto.

## DUAS CATEGORIAS DE LEAD

A fila trata diferente quem é novo e quem já está na base. Isso é a
primeira coisa que o Hermes verifica antes de criar qualquer disparo.

### Lead NOVO (frio ou primeiro toque)
Regra dura. É onde o risco de queimar conta, número ou domínio mora.
- Sem interação prévia em nenhum canal.
- Não tem histórico de resposta.
- Entra na rampa (seção 3), respeita limites baixos nas primeiras semanas.
- WhatsApp exige interação prévia: sem ela, fica bloqueado (nunca
  dispara frio pelo WhatsApp).
- Um toque só por dia por lead, mesmo com contatos diferentes.

### Lead NA BASE (já respondeu, já conectou, já conversou)
Regra leve. O relacionamento já existe, o risco de spam é menor.
- Já tem `ultima_interacao` ou `linkedin_status = Conectado`.
- Pode ter mais de um toque no mesmo dia, se o contato responder.
- Não entra na rampa — o limite é o do canal, não o da semana.
- WhatsApp liberado (interação prévia existe).
- Resposta do contato acelera: Mercúrio pode responder na mesma janela,
  sem esperar o offset da cadência.

Regra de bolso: se o lead respondeu nos últimos 30 dias, é "base". Se
não respondeu nunca ou respondeu há mais de 90 dias, é "novo" para
efeitos de limite.

## REGRAS INVIOLÁVEIS DE FILA

F1 · Um toque por lead a cada 48h somando todos os contatos e canais.
     Vale para novo e para base (a base só pode ir mais rápido se o
     contato respondeu).

F2 · Máximo 2 contatos ativos por lead. Terceiro só com humano.

F3 · Resposta de qualquer contato congela os demais contatos do lead
     (status = Pausado). Ninguém recebe follow-up de "sem resposta"
     enquanto um colega da mesma empresa já está em conversa.

F4 · DNC é global. Opt-out em qualquer canal congela o lead inteiro,
     nos três canais, imediatamente.

F5 · Reagendar nunca descarta. O que não caber hoje vai para o tier 2
     do dia seguinte, mantendo ordem.

F6 · Falha do Controle para a fila. Sem resposta do Controle, o Executor
     não envia. Pausa é aceitável; envio sem checagem não é.

## LIMITES DIÁRIOS POR CANAL

Capacidade total por dia, com rampa para lead novo.

| Canal      | Semana 1 | Semana 2 | Semana 3+ |
|------------|----------|----------|-----------|
| LinkedIn   | 5/dia    | 10/dia   | 15/dia    |
| E-mail     | 10/dia   | 20/dia   | 30/dia    |
| WhatsApp   | 5/dia    | 10/dia   | 20/dia    |

A rampa vale para envio a lead NOVO. Lead na base não consome rampa —
usa o teto da semana 3 direto.

O Controle conta o que JÁ saiu no dia antes de liberar mais. Não reinicia
a contagem em reload, restart ou troca de tela.

### Janelas (America/Sao_Paulo, dias úteis)
- LinkedIn: 09h–18h
- WhatsApp: 09h–18h
- E-mail: 08h–18h

Lead com `idioma = EN` segue o fuso do lead, não o de São Paulo.

### Intervalo entre envios (aleatório dentro da faixa)
- LinkedIn: 2–6 min
- WhatsApp: 3–8 min
- E-mail: 1–3 min

Não é para mandar tudo em rajada. Se a fila tem 15, espalha em ~1h.

## CADÊNCIA (intervalos entre toques do mesmo lead)

Offsets em dias a partir do toque anterior. T1 = ciclo curto (30d).
T2 = ciclo longo (90d+).

### Fluxo A · B2B, Parceria (P1)
| Etapa | Canal              | T1  | T2   |
|-------|--------------------|-----|------|
| A1    | LinkedIn convite   | D+0 | D+0  |
| A2    | LinkedIn mensagem  | D+1 | D+3  |
| A3    | E-mail             | D+4 | D+10 |
| A4    | LinkedIn ou WA     | D+8 | D+21 |
| A5    | E-mail             | D+14| D+35 |
| A6    | Reengajamento      | +60–90 dias, novo gatilho |

### Fluxo B · Freelancer, Projetos (P2)
| Etapa | Canal              | T1  | T2   |
|-------|--------------------|-----|------|
| B1    | LinkedIn convite   | D+0 | D+0  |
| B2    | LinkedIn mensagem  | D+1 | D+3  |
| B3    | E-mail             | D+5 | D+12 |
| B4    | LinkedIn ou E-mail | D+9 | D+25 |
| B5    | E-mail             | D+15| D+40 |

### Fluxo C · Vagas (P3) — prazo manda, não temperatura
| Etapa | Canal              | Offset |
|-------|--------------------|--------|
| C1    | LinkedIn ou E-mail | D+0 (mesmo dia da candidatura) |
| C2    | Outro contato      | D+3 |
| C3    | Canal de C1        | D+6 |
| C4    | Canal de C1        | D+12 |
| C5    | LinkedIn           | +30 após encerramento |

**Exceção de P3:** vaga com prazo em até 7 dias sobe para o tier 2 da
fila e passa na frente de P1/P2. Vaga é o único fluxo com prazo externo.

### Fluxo D · Terceirização (P4)
D+0 convite · D+1 mensagem · D+3 follow-up · D+7 fechamento ·
D+60–90 reengajamento.

### Como o Hermes calcula o próximo toque
1. Última DISPARO com status Enviado do lead → pega `data_envio`.
2. Aplica o offset da etapa seguinte do fluxo do lead.
3. Se a data cair em dia não útil ou fora da janela, joga para a
   próxima janela válida.
4. Se o intervalo desde o último toque for < 48h (regra F1), reagenda.

## PRIORIDADE DA FILA

Quando há mais ações do que capacidade, a ordem é por tier. Cotas P1–P4
valem só para os tiers 3 a 5.

| Tier | Conteúdo |
|------|----------|
| 1    | Respostas e oportunidades (conversa esperando retorno) |
| 2    | Follow-ups críticos · vaga com prazo ≤ 7 dias · reagendados |
| 3    | Leads quentes (Quente/Muito quente) com toque previsto hoje |
| 4    | Novos leads qualificados (primeiro toque) |
| 5    | Leads frios/mornos com toque seguinte |
| 6    | Nutrição e reengajamento (A6, C5, D7) |

Dentro do mesmo tier: mais quente primeiro, depois maior score.

### Cotas diárias (tiers 3 a 5)
- P1: 60%
- P2: 25%
- P3: 10%
- P4: 5%

Se uma cota não for consumida (falta de lead apto), o saldo vai para a
prioridade imediatamente abaixo. Nunca ultrapassa o limite diário do
canal.

## BLOQUEIOS AUTOMÁTICOS (Controle aplica antes de liberar)

Se qualquer um disparar, a ação não vira Pronto:

- Lead ou contato em DNC, Descartado ou Pausado → Cancelado.
- Menos de 48h desde o último toque do lead → Reagendado.
- Resposta pendente no lead → Bloqueado até Mercúrio tratar.
- Terceiro contato ativo no lead → Bloqueado + FILA_REVISAO.
- Gatilho vazio → Bloqueado: sem gatilho.
- Score < 40 → o disparo nem é criado (Mercúrio).
- WhatsApp sem interação prévia → Bloqueado: sem interação prévia.
- E-mail inválido ou bounce → Bloqueado: e-mail.
- Variável sem resolver, [colchete], mais de 1 link, acima do limite
  de caracteres → Bloqueado: mensagem inválida (volta a Mercúrio).
- Limite diário atingido, fora de janela, intervalo curto → Reagendado.
- Canal offline, sessão caída, aviso de plataforma → Reagendado + alerta.

## ORDEM DE PROCESSAMENTO DIÁRIA

O Hermes roda isso uma vez por dia (07h30) e reexecuta a cada evento
(resposta, resultado, erro):

1. Descongela contatos de leads que saíram de Pausado.
2. Aplica F1 (48h) e F3 (congelamento por resposta).
3. Verifica quais toques venceram hoje (data_proxima <= hoje).
4. Ordena por tier, depois temperatura, depois score.
5. Aplica cotas P1–P4 nos tiers 3 a 5.
6. Verifica limite diário por canal — quantos já saíram hoje.
7. Verifica janela atual e intervalo desde o último envio do canal.
8. Enquanto houver espaço: marca Pronto e entrega ao Executor.
9. Excedente vira Reagendado para a próxima janela.
10. No fim do dia (18h30): reconcilia fila × histórico, grava resumo.

## QUANDO CHAMAR O HUMANO (não é aprovação, é exceção)

- Conflito de dados (dedup ambíguo, mesmo handle em 2 contatos).
- Oportunidade relevante (resposta positiva, pedido de reunião,
  decisor de P1 respondendo).
- Resposta ambígua com confiança < 0.8.
- Pedido comercial (preço, contrato, NDA, orçamento).
- Canal offline > 1 dia útil, falha de autenticação, kill-switch.
- Terceiro contato no mesmo lead.
- Resposta hostil, jurídica, ou menção a LGPD/ANPD.
- Contato pede para falar diretamente com Flávio.

Ao chamar: Mercúrio pausa o lead (cancela os Planejado), gera registro
de handoff com motivo, urgência, canal e resumo. O lead só volta à
cadência por decisão humana registrada.

## KILL-SWITCH (Controle aciona e para o canal)

- LinkedIn: qualquer aviso de restrição, captcha ou pedido de verificação.
- E-mail: bounce definitivo > 3% no dia (mínimo 20 envios) ou reclamação
  de spam.
- WhatsApp: falha de sessão repetida, relato de bloqueio ou denúncia.
- Qualquer canal: opt-out > 2% dos envios da semana (mínimo 50 envios).

Ao acionar: pausa o adapter, reagenda a fila do canal, abre exceção
técnica no PAINEL, alerta. Só reativa após teste de saúde.

## O QUE NÃO ESTÁ NESTE RAG

- Texto das mensagens (vive em 02-fases / biblioteca de templates).
- Score, fluxo, classificação (Mercúrio decide).
- Conteúdo de campanha (o usuário define no painel).
- Cases e provas (biblioteca separada).

Este RAG responde a UMA pergunta: **qual é o próximo toque seguro de
sair agora, dentro do limite, da cadência e da janela.**