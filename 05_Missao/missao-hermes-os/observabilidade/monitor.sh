#!/bin/bash
# Monitor — reinicia daemon se cair
while true; do
  if ! pgrep -f "observabilidade/daemon.py" > /dev/null; then
    cd ~/missao-hermes-os/observabilidade
    nohup python3 -u daemon.py >> logs/daemon-stdout.log 2>&1 &
    echo "[$(date '+%H:%M:%S')] daemon reiniciado" >> logs/monitor.log
  fi
  sleep 30
done
