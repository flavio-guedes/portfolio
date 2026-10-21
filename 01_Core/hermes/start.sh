#!/bin/bash
cd ~/hermes
pkill -f "runner.py" 2>/dev/null
sleep 1
nohup python3 runner.py "${1:-30}" > runner.log 2>&1 &
echo "runner iniciado em background (PID $!)"
echo "veja ao vivo:  tail -f ~/hermes/runner.log"
echo "pare:          pkill -f runner.py"
