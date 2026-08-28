#!/bin/bash
set -uo pipefail

ROUTER="/Users/mac/HermesWorkspace/outputs/ai-local-stack/scripts/ai_local_router.py"
VENV_PY="/Users/mac/HermesWorkspace/outputs/ai-local-stack/ai-local-env/bin/python3"

print_check() {
  local label="$1"
  local status="$2"
  printf '%-28s %s\n' "$label" "$status"
}

print_check "Ollama" "$(curl -sf http://localhost:11434/api/tags >/dev/null 2>&1 && echo '[OK]' || echo '[ERROR]')"
print_check "Ollama model" "$(curl -sf http://localhost:11434/api/tags | grep -q qwen2.5:3b && echo '[OK]' || echo '[ERROR]')"
print_check "Python venv" "$(test -x "$VENV_PY" && echo '[OK]' || echo '[ERROR]')"
print_check "FFmpeg" "$(command -v ffmpeg >/dev/null 2>&1 && echo '[OK]' || echo '[WARNING]')"
print_check "n8n" "$(command -v n8n >/dev/null 2>&1 && echo '[OK]' || echo '[WARNING]')"
print_check "Whisper" "$("$VENV_PY" -c "import faster_whisper" >/dev/null 2>&1 && echo '[OK]' || echo '[ERROR]')"
print_check "Router syntax" "$("$VENV_PY" -m py_compile "$ROUTER" >/dev/null 2>&1 && echo '[OK]' || echo '[ERROR]')"
