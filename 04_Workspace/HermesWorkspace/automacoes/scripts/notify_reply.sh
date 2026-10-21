#!/bin/bash
# Uso: notify_reply.sh "Contato" "Mensagem"
osascript -e "display notification \"$2\" with title \"Resposta WhatsApp: $1\" sound name \"default\"" >/dev/null 2>&1
