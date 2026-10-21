#!/bin/bash
LOG=/tmp/hermes-campaign-training.log
REP=/tmp/hermes-campaign-report.md
LIM=$(date -v+9H +%s 2>/dev/null || date -d "+9 hours" +%s)
PROMPTS=(
"como criar uma campanha de whatsapp?"
"quantas campanhas eu tenho ativas?"
"me sugere uma melhoria nas campanhas"
"qual a melhor janela de horario pra enviar?"
"como funciona o aquecimento de numero?"
"o que fazer se a taxa de erro passar de 10%?"
"como configurar email pra nao cair em spam?"
"qual o intervalo ideal entre envios no whatsapp?"
"como personalizar template com nome do lead?"
"o que fazer quando lead responde e some?"
"me da 3 sugestoes pra aumentar resposta"
"como migrar de whatsapp pra email se tiver bloqueio?"
"quais metricas importam mais?"
"o que e failStreak?"
"como respeitar opt-out/LGPD?"
"me explica taxa de resposta vs taxa de reuniao"
"o que fazer com lead sem whatsapp?"
"quando pausar uma campanha automaticamente?"
"como agendar envio fora da janela?"
"qual CTA recomendado na 2a mensagem?"
)
declare -A SCORE
i=0
echo "# Relatorio de Treinamento Campanhas — $(date)" > $REP
echo "" >> $REP
echo "Inicio: $(date '+%H:%M')  Fim previsto: 09:00" >> $REP
echo "" >> $REP
echo "════ INICIO $(date '+%H:%M') ════" >> $LOG
while [ "$(date +%s)" -lt "$LIM" ]; do
  TS=$(date '+%H:%M:%S')
  P="${PROMPTS[$((i % ${#PROMPTS[@]}))]}"
  # snapshot atual do painel (se disponivel)
  curl -s -X POST http://127.0.0.1:8422/hermes -H "Content-Type: application/json" \
    -d "{\"jid\":\"5521999719474@s.whatsapp.net\",\"texto\":\"$P\",\"meta\":{}}" --max-time 90 > /dev/null 2>&1
  sleep 12
  ULT=$(grep -aE "→ RESPONDER|out.texto|✓ enviado|ESCALAR" /tmp/hermes-agent.log | tail -2 | tr '\n' ' | ')
  echo "[$TS] P: $P" >> $LOG
  echo "[$TS] R: $ULT" >> $LOG
  # heuristica: resposta menciona campanha/whatsapp/email/numeros?
  if echo "$ULT" | grep -qaiE "campanha|whatsapp|email|leads|enviados|respostas"; then
    echo "[$TS] ✓ resposta com termos de dominio" >> $LOG
  else
    echo "[$TS] ⚠ resposta generica" >> $LOG
  fi
  i=$((i+1))
  sleep 240
done
echo "════ FIM $(date '+%H:%M') — $i ciclos ════" >> $LOG
{
  echo "## Resumo"
  echo "- Ciclos: $i"
  echo "- Termos de dominio OK: $(grep -c '✓ resposta' $LOG)"
  echo "- Genericas: $(grep -c '⚠ resposta' $LOG)"
  echo ""
  echo "## Ultimas 60 linhas"
  echo '```'
  tail -60 $LOG
  echo '```'
} >> $REP
