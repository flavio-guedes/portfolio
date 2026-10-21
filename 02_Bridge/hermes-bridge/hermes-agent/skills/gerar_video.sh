#!/usr/bin/env bash
set +e
MD="$1"
OUT="${2:-$HOME/hermes-bridge/hermes-agent/apresentacao_hermes.mp4}"
VENV="$HOME/.venvs/video"
log(){ echo "[$(date +%H:%M:%S)] $*"; }

# Adapta Markdown (divide em slides + narracao)
ADAPT="$(dirname "$OUT")/scholium_input.md"
python3 - "$MD" "$ADAPT" <<'PY'
import sys, re
md = open(sys.argv[1], encoding="utf-8").read()
parts = re.split(r'\n---+\n|\n# SLIDE ', md)
out = ['---\ntitle: "Hermes OS — A Grande Aula do Restaurante"\nauthor: "Projeto Hermes"\n---\n']
for i, p in enumerate(parts):
    p = p.strip()
    if not p: continue
    m = re.search(r'^#+\s*(.+)$', p, re.M)
    titulo = m.group(1).strip() if m else f"Slide {i+1}"
    corpo = re.sub(r'\*\*\[KV.*?\]\*\*', '', p, flags=re.S)
    nar = re.sub(r'[#*`>|-]', '', corpo)
    nar = re.sub(r'\n{2,}', '. ', nar)[:800]
    out.append(f"# {titulo}\n\n{corpo}\n\n::: notes\n{nar}\n:::\n")
open(sys.argv[2], "w", encoding="utf-8").write("\n".join(out))
print(f"   adaptado: {len(out)-1} slides")
PY

# ---------- Caminho 1: Scholium (Piper local) ----------
log "== Tentativa 1: Scholium (Piper local) =="
if [ -d "$VENV" ]; then
  source "$VENV/bin/activate"
  if command -v scholium >/dev/null 2>&1; then
    scholium generate "$ADAPT" "$OUT" --provider piper --voice en_US-lessac-medium --verbose 2>&1 | tail -20
    [ -s "$OUT" ] && [ $(wc -c <"$OUT") -gt 100000 ] && { log "✅ Scholium OK: $OUT"; exit 0; }
  fi
fi

# ---------- Caminho 2: AutoVideo-Agent ----------
log "== Tentativa 2: AutoVideo-Agent =="
if [ -d "$VENV" ]; then
  source "$VENV/bin/activate"
  pip install --quiet autovideo-agent 2>/dev/null
  if command -v autovideo >/dev/null 2>&1; then
    autovideo run "$ADAPT" --out "$(dirname "$OUT")/autovideo_build" 2>&1 | tail -10
    CAND="$(find "$(dirname "$OUT")/autovideo_build" -name "*.mp4" 2>/dev/null | head -1)"
    [ -s "$CAND" ] && [ $(wc -c <"$CAND") -gt 100000 ] && { cp "$CAND" "$OUT"; log "✅ AutoVideo OK: $OUT"; exit 0; }
  fi
fi

# ---------- Caminho 3: Slide Stream (se houver chaves) ----------
log "== Tentativa 3: Slide Stream =="
if [ -n "$OPENAI_API_KEY" ] || [ -n "$ELEVENLABS_API_KEY" ]; then
  if [ -d "$VENV" ]; then
    source "$VENV/bin/activate"
    pip install --quiet 'slide-stream[all-ai]' 2>/dev/null
    slide-stream create "$MD" "$OUT" 2>&1 | tail -10
    [ -s "$OUT" ] && [ $(wc -c <"$OUT") -gt 100000 ] && { log "✅ Slide Stream OK: $OUT"; exit 0; }
  fi
else
  log "   (Slide Stream ignorado: sem OPENAI_API_KEY/ELEVENLABS_API_KEY)"
fi

# ---------- Caminho 4: Trv (Typst) ----------
log "== Tentativa 4: Trv (Typst) =="
command -v cargo >/dev/null && cargo install trv 2>/dev/null
command -v typst >/dev/null && brew install typst 2>/dev/null
if command -v trv >/dev/null 2>&1; then
  log "   Trv instalado, mas precisa de apresentacao em Typst (nao Markdown)."
fi

log "❌ Todos os caminhos falharam."
exit 1
