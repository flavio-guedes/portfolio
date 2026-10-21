#!/bin/bash
# Vigia noturno Hermes — testa, loga e reinicia até 9h
LOG=/tmp/hermes-overnight.log
LIMITE=$(( $(date +%s) + 9*3600 ))
TBRIDGE=hermes123
PROMPTS=(
  "Oi, tudo bem?"
  "Quantas campanhas eu tenho ativas?"
  "Crie uma campanha chamada Teste Noturno"
  "Me mostre o relatório"
  "Qual o status da fila?"
  "Quais leads estão quentes?"
)
i=0
echo "════ VIGIA NOTURNO INICIADO $(date) ════" >> $LOG
while [ "$(date +%s)" -lt "$LIMITE" ]; do
  TS=$(date '+%H:%M:%S')
  # 1. Bridge vivo?
  B=$(curl -s -o /dev/null -w "%{http_code}" --max-time 4 -H "Authorization: Bearer $TBRIDGE" http://127.0.0.1:8787/status 2>/dev/null)
  if [ "$B" != "200" ]; then
    echo "[$TS] ✗ bridge HTTP=$B — reiniciando" >> $LOG
    pkill -f hermes-bridge.mjs; sleep 2
    cd /Users/mac/hermes-bridge
    HERMES_TOKEN=$TBRIDGE HERMES_ADMIN=5521999719474 nohup node hermes-bridge.mjs > /tmp/hermes-bridge.log 2>&1 &
  else
    echo "[$TS] ✓ bridge ok" >> $LOG
  fi
  # 2. Agente vivo?
  if ! pgrep -f hermes-agent.mjs >/dev/null; then
    echo "[$TS] ✗ agente morto — reiniciando" >> $LOG
    cd /Users/mac/hermes-bridge/hermes-agent
    HERMES_TOKEN=$TBRIDGE FLAVIO_JID=5521999719474@s.whatsapp.net MODELO=qwen2.5:3b nohup node hermes-agent.mjs > /tmp/hermes-agent.log 2>&1 &
    sleep 3
  else
    echo "[$TS] ✓ agente ok" >> $LOG
  fi
  # 3. Ollama vivo?
  O=$(curl -s -o /dev/null -w "%{http_code}" --max-time 4 http://127.0.0.1:11434/ 2>/dev/null)
  echo "[$TS] ollama HTTP=$O" >> $LOG
  # 4. Pipeline: manda 1 prompt rotativo e mede latência
  P="${PROMPTS[$((i % ${#PROMPTS[@]}))]}"
  T0=$(date +%s%N)
  curl -s -X POST http://127.0.0.1:8422/hermes -H "Content-Type: application/json" \
    -d "{\"jid\":\"5521999719474@s.whatsapp.net\",\"texto\":\"$P\",\"meta\":{}}" --max-time 60 > /dev/null 2>&1
  T1=$(date +%s%N)
  MS=$(( (T1 - T0) / 1000000 ))
  echo "[$TS] → \"$P\"  ${MS}ms" >> $LOG
  i=$((i+1))
  sleep 180
done
echo "════ VIGIA NOTURNO ENCERRADO $(date) ════" >> $LOG
