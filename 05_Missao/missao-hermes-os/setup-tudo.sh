#!/bin/bash
set +e
D="$HOME/missao-hermes-os"
TS=$(date +%Y%m%d-%H%M%S)
LOG="$D/setup-tudo-$TS.log"
exec > >(tee -a "$LOG") 2>&1

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  SETUP TUDO — v12 · v10 · v13 · v14                      ║"
echo "║  $(date '+%d %b %Y · %H:%M:%S')                                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo

# ========== 0) BACKUPS ==========
echo "▶ [0] Backups"
[ -f "$D/painel-evolucao.html" ] && cp "$D/painel-evolucao.html" "$D/painel-evolucao.html.bak-$TS"
[ -f "$D/watchdog.py" ] && cp "$D/watchdog.py" "$D/watchdog.py.bak-$TS"
mkdir -p "$D/backups-plists"
for p in "$HOME/Library/LaunchAgents/"*hermes*.plist; do
  [ -f "$p" ] && cp "$p" "$D/backups-plists/" 2>/dev/null
done
echo "  ✓ backups em ~/missao-hermes-os/backups-plists/ e .bak-$TS"
echo

# ========== 1) FIX WhatsApp :8787 (do turno anterior) ==========
echo "▶ [1] Fix porta WhatsApp"
python3 - <<PY
import json
from pathlib import Path
p = Path("$D/config/watchdog.json")
c = json.loads(p.read_text())
for s in c["servicos"]:
    if s["nome"] == "WhatsApp":
        s["porta"] = 8787; s["nome"] = "WhatsApp Bridge"
p.write_text(json.dumps(c, indent=2, ensure_ascii=False))
print("  ✓ WhatsApp → :8787")
PY
echo

# ========== 2) v14 — PATCH watchdog.py (alertas + custos) ==========
echo "▶ [2] v14 — Instrumentação do watchdog (alertas + custos)"
python3 - <<'PY'
from pathlib import Path
import re, os

w = Path.home() / "missao-hermes-os" / "watchdog.py"
src = w.read_text()

# injeta imports e infra de alerta/custo após a linha CFG
if "def alertar(" not in src:
    injecao = '''
import urllib.request, urllib.error, subprocess

BRIDGE_SEND = "http://127.0.0.1:8787/send"
BRIDGE_TOKEN = os.environ.get("HERMES_BRIDGE_TOKEN", "hermes123")
FLAVIO_JID  = os.environ.get("FLAVIO_JID", "").strip()
_ultimo_estado = {}

def _post(url, body, headers=None):
    try:
        data = json.dumps(body).encode()
        h = {"Content-Type":"application/json"}; h.update(headers or {})
        req = urllib.request.Request(url, data=data, headers=h)
        with urllib.request.urlopen(req, timeout=3) as r:
            return r.status, r.read().decode()[:200]
    except Exception as e:
        return 0, str(e)

def alertar(nome, de, para):
    if not FLAVIO_JID: return
    if para != "down" or de == "down": return
    msg = f"⚠️ *Hermes OS* — {nome} caiu ({de} → {para}) às {datetime.now().strftime('%H:%M:%S')}"
    st, _ = _post(BRIDGE_SEND,
                  {"number":FLAVIO_JID, "message":msg},
                  {"Authorization": f"Bearer {BRIDGE_TOKEN}"})
    print(f"[alerta] {nome} down → bridge HTTP {st}", flush=True)

def coletar_custos():
    """Puxa /spend/logs do LiteLLM a cada ciclo e grava diff em custos.jsonl."""
    try:
        req = urllib.request.Request("http://127.0.0.1:4000/spend/logs",
              headers={"Authorization": "Bearer sk-1234"})
        with urllib.request.urlopen(req, timeout=2) as r:
            dados = json.loads(r.read())
        linha = {"ts": datetime.now().isoformat(timespec="seconds"),
                 "total_amostras": len(dados) if isinstance(dados, list) else 0,
                 "raw_keys": list(dados[0].keys())[:8] if isinstance(dados,list) and dados else []}
        with (DATA/"custos.jsonl").open("a") as f:
            f.write(json.dumps(linha, ensure_ascii=False)+"\\n")
    except Exception as e:
        pass  # silencioso — LiteLLM pode não ter /spend/logs habilitado
'''
    src = src.replace('SERVICOS  = CFG["servicos"]', 'SERVICOS  = CFG["servicos"]\n' + injecao)

# na coleta, detecta transição ok→down e dispara alerta
src = src.replace(
'''        snap = {s["nome"]: checar(s) for s in SERVICOS}
        with lock:
            estado["ts"], estado["servicos"] = t, snap''',
'''        snap = {s["nome"]: checar(s) for s in SERVICOS}
        for nome, st in snap.items():
            ant = _ultimo_estado.get(nome, {}).get("status")
            if ant == "ok" and st["status"] == "down":
                alertar(nome, ant, st["status"])
            _ultimo_estado[nome] = st
        with lock:
            estado["ts"], estado["servicos"] = t, snap''')

# custos a cada 4 ciclos (~60s, alinha com snapshot)
src = src.replace(
'''        if time.time() - _ultimo_snap >= SNAPSHOT:''',
'''        if time.time() - _ultimo_snap >= SNAPSHOT:
            coletar_custos()''')

w.write_text(src)
print("  ✓ watchdog.py instrumentado (alertar + coletar_custos)")
PY

python3 -c "import ast,sys; ast.parse(open('$D/watchdog.py').read()); print('  ✓ sintaxe OK')"
echo

# ========== 3) v12 — CONSOLIDAR LAUNCHD ==========
echo "▶ [3] v12 — Consolidar launchd (um watchdog único)"
# descarrega os dois antigos
for label in com.hermes.watchdog com.flavioguedes.hermes-watchdog ai.hermes.watchdog; do
  launchctl bootout gui/$(id -u)/$label 2>/dev/null
  rm -f "$HOME/Library/LaunchAgents/$label.plist"
  echo "  · removido: $label"
done

# cria plist canônico
PLIST="$HOME/Library/LaunchAgents/ai.hermes.watchdog-os.plist"
cat > "$PLIST" <<XML
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>ai.hermes.watchdog-os</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/python3</string>
    <string>$D/watchdog.py</string>
  </array>
  <key>WorkingDirectory</key><string>$D</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/hermes-watchdog.log</string>
  <key>StandardErrorPath</key><string>/tmp/hermes-watchdog.err</string>
  <key>ThrottleInterval</key><integer>10</integer>
</dict></plist>
XML

launchctl bootout gui/$(id -u)/ai.hermes.watchdog-os 2>/dev/null
launchctl bootstrap gui/$(id -u) "$PLIST"
sleep 2
if launchctl list | grep -q ai.hermes.watchdog-os; then
  echo "  ✓ ai.hermes.watchdog-os carregado"
else
  echo "  ⚠ falhou — tentando kickstart"
  launchctl kickstart -k gui/$(id -u)/ai.hermes.watchdog-os 2>/dev/null
fi

# mata o nohup antigo pra não ter duplicata
pkill -f "missao-hermes-os/watchdog.py" 2>/dev/null
sleep 3
echo

# ========== 4) v10 + v13 — SECÇÃO AUTOCONTIDA NO PAINEL ==========
echo "▶ [4] v10 + v13 — Tendências + SSE no painel"
python3 - <<'PY'
from pathlib import Path
import re

p = Path.home() / "missao-hermes-os" / "painel-evolucao.html"
h = p.read_text(encoding="utf-8")

if 'id="hermes-trends"' in h:
    print("  · já existe — pulando")
    raise SystemExit(0)

bloco = r'''
<!-- ===== v10 Tendências + v13 SSE (autocontido, scoped) ===== -->
<section id="hermes-trends">
<style>
#hermes-trends{
  max-width:1100px;margin:32px auto 48px;padding:24px;
  background:rgba(20,20,24,.72);backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,.08);border-radius:14px;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e8e8ec;
}
#hermes-trends h2{margin:0 0 4px;font-size:20px;font-weight:600}
#hermes-trends .sub{color:#888;font-size:12px;margin-bottom:18px}
#hermes-trends .bar{display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
#hermes-trends button{
  background:rgba(255,255,255,.06);color:#ccc;border:1px solid rgba(255,255,255,.1);
  padding:6px 14px;border-radius:8px;font-size:12px;cursor:pointer;
}
#hermes-trends button.on{background:#4da3ff22;color:#4da3ff;border-color:#4da3ff55}
#hermes-trends .badge{
  margin-left:auto;font-size:11px;padding:4px 10px;border-radius:999px;
  background:#333;color:#aaa;transition:all .2s;
}
#hermes-trends .badge.ok{background:#2ecc7122;color:#2ecc71}
#hermes-trends .badge.down{background:#e74c3c22;color:#e74c3c}
#hermes-trends .charts{display:grid;grid-template-columns:1fr 1fr;gap:16px}
#hermes-trends .card{
  padding:14px;background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.06);border-radius:10px;
}
#hermes-trends .card h3{margin:0 0 10px;font-size:13px;color:#aaa;font-weight:500;text-transform:uppercase;letter-spacing:.08em}
#hermes-trends svg{width:100%;display:block;overflow:visible}
#hermes-trends .svc-row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,.04)}
#hermes-trends .svc-row:last-child{border:none}
#hermes-trends .dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px}
@media (max-width:700px){#hermes-trends .charts{grid-template-columns:1fr}}
</style>

<h2>Tendências & Tempo Real</h2>
<div class="sub">Dados de <code>metrics.jsonl</code> via <code>/api/metrics</code> · SSE em <code>/api/stream</code></div>

<div class="bar">
  <button data-h="1" class="on">1h</button>
  <button data-h="24">24h</button>
  <button data-h="168">7d</button>
  <span id="ht-status" class="badge">conectando…</span>
</div>

<div class="charts">
  <div class="card">
    <h3>Uptime por serviço</h3>
    <svg id="ht-uptime" viewBox="0 0 400 160" preserveAspectRatio="none"></svg>
  </div>
  <div class="card">
    <h3>Latência média (ms)</h3>
    <svg id="ht-lat" viewBox="0 0 400 160" preserveAspectRatio="none"></svg>
  </div>
  <div class="card" style="grid-column:1/-1">
    <h3>Estado ao vivo</h3>
    <div id="ht-svc"></div>
  </div>
</div>

<script>
(() => {
  const API = '/api/metrics';
  const SSE = '/api/stream';
  const $ = id => document.getElementById(id);
  let horas = 1, dados = [];

  async function carregar() {
    try {
      const r = await fetch(API + '?hours=' + horas, {cache:'no-store'});
      const j = await r.json();
      dados = j.data || [];
      desenhar();
    } catch(e) { console.warn('metrics falhou', e); }
  }

  function svgUptime() {
    const svg = $('ht-uptime');
    if (!dados.length) { svg.innerHTML = '<text x="200" y="80" fill="#555" text-anchor="middle" font-size="12">sem dados ainda</text>'; return; }
    const servicos = [...new Set(dados.flatMap(d => Object.keys(d.servicos||{})))];
    const W = 400, H = 160, pad = 8, barH = (H - pad*2) / servicos.length;
    let out = '';
    servicos.forEach((s, i) => {
      const ok = dados.filter(d => d.servicos?.[s]?.status === 'ok').length;
      const pct = ok / dados.length;
      const y = pad + i * barH;
      out += '<text x="0" y="' + (y + barH/2 + 4) + '" fill="#888" font-size="9">' + s + '</text>';
      out += '<rect x="90" y="' + (y+2) + '" width="' + (W-100) + '" height="' + (barH-6) + '" fill="#ffffff08"/>';
      out += '<rect x="90" y="' + (y+2) + '" width="' + ((W-100)*pct) + '" height="' + (barH-6) + '" fill="' + (pct>0.95?'#2ecc71':pct>0.7?'#f1c40f':'#e74c3c') + '" rx="3"/>';
      out += '<text x="' + (W-4) + '" y="' + (y + barH/2 + 4) + '" fill="#ccc" font-size="9" text-anchor="end">' + Math.round(pct*100) + '%</text>';
    });
    svg.innerHTML = out;
  }

  function svgLat() {
    const svg = $('ht-lat');
    if (dados.length < 2) { svg.innerHTML = '<text x="200" y="80" fill="#555" text-anchor="middle" font-size="12">aguardando série…</text>'; return; }
    const series = dados.map(d => {
      const vals = Object.values(d.servicos||{}).map(s => s.latencia_ms).filter(v => typeof v === 'number');
      return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
    });
    const max = Math.max(...series, 1), W = 400, H = 160, pad = 14;
    const step = (W - pad*2) / (series.length - 1);
    const pts = series.map((v,i) => (pad + i*step) + ',' + (H - pad - (v/max)*(H-pad*2)));
    svg.innerHTML =
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#4da3ff" stroke-width="2"/>' +
      '<polyline points="' + pts.join(' ') + ' ' + (W-pad) + ',' + (H-pad) + ' ' + pad + ',' + (H-pad) + '" fill="#4da3ff22"/>' +
      '<text x="' + pad + '" y="12" fill="#666" font-size="9">max ' + Math.round(max) + ' ms</text>';
  }

  function estado(d) {
    const box = $('ht-svc');
    const svc = d.servicos || {};
    box.innerHTML = Object.entries(svc).map(([n,s]) => {
      const cor = s.status === 'ok' ? '#2ecc71' : s.status === 'down' ? '#e74c3c' : '#f1c40f';
      const det = s.latencia_ms ? s.latencia_ms.toFixed(1)+' ms' : (s.erro || '—');
      return '<div class="svc-row"><span><span class="dot" style="background:'+cor+'"></span>'+n+'</span><span style="color:#999">'+det+'</span></div>';
    }).join('');
  }

  function desenhar() { svgUptime(); svgLat(); }

  document.querySelectorAll('#hermes-trends button[data-h]').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('#hermes-trends button[data-h]').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      horas = parseInt(b.dataset.h);
      carregar();
    };
  });

  // SSE — v13
  const badge = $('ht-status');
  try {
    const es = new EventSource(SSE);
    es.onopen = () => { badge.textContent = 'SSE conectado'; badge.className = 'badge ok'; };
    es.onerror = () => { badge.textContent = 'SSE caiu — usando polling'; badge.className = 'badge down'; };
    es.onmessage = (ev) => {
      try { const d = JSON.parse(ev.data); estado(d); } catch(e){}
    };
  } catch(e) {
    badge.textContent = 'SSE indisponível'; badge.className = 'badge down';
  }

  carregar();
  setInterval(carregar, 30000);
})();
</script>
</section>
'''

if "</body>" in h:
    h = h.replace("</body>", bloco + "\n</body>", 1)
    p.write_text(h, encoding="utf-8")
    print("  ✓ secção Tendências+SSE inserida antes de </body>")
else:
    print("  ⚠ </body> não encontrado — abortando inserção")
PY
echo

# ========== 5) VERIFICAÇÃO ==========
echo "▶ [5] Verificação"
sleep 5
echo "  → launchd:"
launchctl list | grep -E "watchdog-os|hermes" | head -10
echo
echo "  → /api/health:"
curl -s http://127.0.0.1:9000/api/health | python3 -m json.tool 2>/dev/null | head -40
echo
echo "  → /api/metrics?hours=1:"
curl -s "http://127.0.0.1:9000/api/metrics?hours=1" | head -c 200; echo
echo
echo "  → /api/stream (3s):"
curl -sN --max-time 3 http://127.0.0.1:9000/api/stream | head -c 200; echo
echo
echo "  → arquivos v14:"
ls -la "$D/data/custos.jsonl" 2>/dev/null || echo "    (custos.jsonl aguardando 1º snapshot — 60s)"
echo

echo "════════════════════════════════════════════════════════════"
echo " ✅ SETUP COMPLETO"
echo "════════════════════════════════════════════════════════════"
echo " v12 launchd    → ai.hermes.watchdog-os (boot automático)"
echo " v10 gráficos   → aba \"Tendências\" no painel (1h/24h/7d)"
echo " v13 SSE        → badge no painel mostra 'SSE conectado'"
echo " v14 alertas    → watchdog avisa WhatsApp quando serviço cai"
echo " v14 custos     → data/custos.jsonl amostrado a cada 60s"
echo
echo " Abra: http://127.0.0.1:8080/painel-evolucao.html"
echo " Log:  $LOG"
