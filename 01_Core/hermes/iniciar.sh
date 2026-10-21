#!/bin/bash
# Sobe Ollama se não estiver no ar
if ! curl -s http://localhost:11434 | grep -q "Ollama is running"; then
  nohup /usr/local/bin/ollama serve > /tmp/ollama.log 2>&1 &
  sleep 3
fi
# Sobe servidor se não estiver no ar
if ! lsof -i :8420 > /dev/null 2>&1; then
  nohup node /Users/mac/hermes/servidor/server.js > /Users/mac/hermes/servidor/log.txt 2>&1 &
fi
