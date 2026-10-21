#!/usr/bin/env bash
set -eu
LOG="${1:-}"
[ -n "$LOG" ] || { echo "uso: rotate-logs.sh ARQUIVO"; exit 1; }
MAX=$((10*1024*1024))
[ -f "$LOG" ] || exit 0
sz=$(stat -f%z "$LOG" 2>/dev/null || echo 0)
if [ "$sz" -gt "$MAX" ]; then
  for i in 5 4 3 2; do
    [ -f "$LOG.$i" ] && mv "$LOG.$i" "$LOG.$((i+1))"
  done
  mv "$LOG" "$LOG.1"
  : > "$LOG"
fi
