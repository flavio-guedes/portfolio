#!/bin/bash
export PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH
cd /Users/mac/.hermes/hermes-agent/scripts/whatsapp-bridge

echo "═══ RELIGAR HERMES ═══"
pkill -9 -f bridge.js 2>/dev/null; sleep 2

echo "→ QR vai aparecer. Escaneie: WhatsApp → Aparelhos conectados → Conectar"
echo "→ quando conectar, Ctrl+C"
echo

echo
echo "→ subindo em background..."
nohup node bridge.js --session > /tmp/bridge.log 2>&1 &
sleep 8
curl -s http://127.0.0.1:3000/health; echo
echo "→ teste pra você mesmo..."
curl -s -m 15 -X POST http://127.0.0.1:3000/send -H "Content-Type: application/json" \
  -d '{"chatId":"21999719474@s.whatsapp.net","message":"[Hermes] religado"}'
echo; echo
echo "→ aplicando cadência segura..."
cd ~/hermes && python3 regras.py
echo
echo "→ subindo runner..."
# runner agora é gerenciado por com.hermes.runner (launchd)
sleep 3; tail -5 runner.log
echo
echo "═══ PRONTO ═══"
