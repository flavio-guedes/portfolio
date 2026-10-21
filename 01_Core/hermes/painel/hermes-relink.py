#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Diagnostica sessao zumbi e mostra caminho para re-link do WhatsApp."""
import os, sys, glob, time, json, urllib.request, urllib.error, subprocess
from datetime import datetime

BRIDGE_PID   = None
BRIDGE_LOG   = None
BRIDGE_DIR   = "/Users/mac/.hermes/hermes-agent/scripts/whatsapp-bridge"
BRIDGE_JS    = BRIDGE_DIR + "/bridge.js"
SESSION_DIR  = None

def ts(): return datetime.now().strftime("%H:%M:%S")
def log(m,n="·"):
    ico={"ok":"✓","erro":"✗","aviso":"⚠","etapa":"▶","fim":"■","hora":"◆"}.get(n,"·")
    print(f"[{ts()}] {ico}  {m}", flush=True)

log("RELINK · diagnostico de sessao WhatsApp zumbi", "fim"); print()

# ETAPA 1 · achar processo e diretorio de sessao
log("ETAPA 1 · localizar processo e sessao da bridge", "etapa")
try:
    ps = subprocess.run(["ps","aux"], capture_output=True, text=True).stdout
    for line in ps.splitlines():
        if "bridge.js" in line and "grep" not in line:
            parts = line.split(None, 10)
            BRIDGE_PID = parts[1]
            log(f"  PID do bridge: {BRIDGE_PID}", "ok")
            log(f"  cmd: {line.split(None,10)[10][:120]}")
except Exception as e:
    log(f"  erro ps: {e}", "erro")

# ETAPA 2 · listar arquivos de sessao
log("ETAPA 2 · arquivos de sessao Baileys", "etapa")
session_dirs = [
    BRIDGE_DIR + "/auth_info_baileys",
    BRIDGE_DIR + "/session",
    BRIDGE_DIR + "/sessions",
    os.path.expanduser("~/.hermes/hermes-agent/scripts/whatsapp-bridge/auth"),
    os.path.expanduser("~/.config/baileys"),
]
for d in session_dirs:
    if os.path.isdir(d):
        SESSION_DIR = d
        log(f"  dir sessao: {d}", "ok")
        files = sorted(os.listdir(d))[:20]
        for f in files:
            p = os.path.join(d,f)
            sz = os.path.getsize(p) if os.path.isfile(p) else 0
            mt = datetime.fromtimestamp(os.path.getmtime(p)).strftime("%Y-%m-%d %H:%M") if os.path.exists(p) else "-"
            log(f"    {f} · {sz}B · {mt}")
        # procura creds.json
        creds = os.path.join(d, "creds.json")
        if os.path.exists(creds):
            idade_h = (time.time()-os.path.getmtime(creds))/3600
            log(f"  creds.json tem {idade_h:.1f}h de idade", "ok" if idade_h<48 else "aviso")
        break
else:
    log("  nenhum diretorio de sessao encontrado nos caminhos padrao", "aviso")
    log("  procurando...")
    for root, dirs, files in os.walk(BRIDGE_DIR, topdown=True, followlinks=False):
        depth = root[len(BRIDGE_DIR):].count(os.sep)
        if depth > 2: dirs[:] = []; continue
        if any(f in files for f in ["creds.json","session.json"]):
            log(f"  ENCONTRADO: {root}")
            for f in files[:15]:
                log(f"    {f}")
            SESSION_DIR = root
            break

print()

# ETAPA 3 · /health detalhado + /messages
log("ETAPA 3 · health e mensagens recentes", "etapa")
def get(url):
    try:
        r=urllib.request.urlopen(url,timeout=5); return r.status, r.read().decode("utf-8","ignore")
    except Exception as e: return 0, str(e)

st, body = get("http://127.0.0.1:3000/health")
log(f"  /health HTTP {st}", "ok")
try:
    h = json.loads(body)
    for k,v in h.items():
        log(f"    {k} = {v}")
except: log(f"  {body[:200]}")

st, body = get("http://127.0.0.1:3000/messages")
log(f"  /messages HTTP {st} · {len(body)} bytes", "ok" if st==200 else "erro")
log(f"  conteúdo: {body[:300]}")

print()

# ETAPA 4 · ler log do bridge (procurar QR, erros, reconnect)
log("ETAPA 4 · log do bridge", "etapa")
candidatos_log = [
    "/tmp/bridge.log",
    "/tmp/whatsapp.log",
    "/tmp/whatsapp-bridge.log",
    BRIDGE_DIR + "/bridge.log",
    BRIDGE_DIR + "/log.txt",
    os.path.expanduser("~/hermes-work/backend.log"),
]
for lf in candidatos_log:
    if os.path.exists(lf):
        sz = os.path.getsize(lf)
        log(f"  log encontrado: {lf} ({sz}B)", "ok")
        # últimas linhas
        r = subprocess.run(["tail","-30",lf], capture_output=True, text=True)
        for line in r.stdout.splitlines()[-15:]:
            log(f"    {line[:140]}")
        break
else:
    log("  nenhum log do bridge encontrado", "aviso")

print()

# ETAPA 5 · verificar se a sessão é válida (tenta socket no whatsapp)
log("ETAPA 5 · teste de sessão — enviar mensagem para si mesmo", "etapa")
# O bridge tem /send. Vamos ver se após "enviar para si" ele retorna diferente
import urllib.request as ur
def post(url, body):
    data=json.dumps(body).encode()
    req=ur.Request(url, data=data, method="POST", headers={"Content-Type":"application/json"})
    try:
        r=ur.urlopen(req,timeout=15); return r.status, r.read().decode("utf-8","ignore")
    except Exception as e: return 0, str(e)

# tenta /discovery/contacts para ver se o socket está vivo
st, body = get("http://127.0.0.1:3000/discovery/contacts")
log(f"  /discovery/contacts HTTP {st} · {body[:180]}", "ok" if st==200 else "erro")

st, body = get("http://127.0.0.1:3000/discovery/groups")
log(f"  /discovery/groups   HTTP {st} · {body[:180]}", "ok" if st==200 else "erro")

print()

# ETAPA 6 · veredito
log("VEREDITO", "fim")
st, _ = get("http://127.0.0.1:3000/discovery/contacts")
if st != 200:
    log("  SESSÃO CAIU — o bridge responde /send mas perdeu o socket do WhatsApp", "erro")
    log("  Solução: matar o bridge, reiniciar, e re-escanear o QR Code", "aviso")
else:
    log("  SESSÃO PARECE VIVA — mas mensagens não chegam", "aviso")
    log("  Provável: bridge conectado a OUTRO número (não o seu)", "aviso")

print()
log("PRÓXIMO PASSO", "fim")
print()
print("  1. No terminal, execute:")
print("       pkill -f bridge.js")
print("  2. Suba o bridge em foreground (pra ver o QR):")
print("       cd " + BRIDGE_DIR)
print("       node bridge.js --session")
print()
print("  3. No CELULAR onde o WhatsApp está logado:")
print("       WhatsApp → Configurações → Aparelhos conectados")
print("       → Conectar um aparelho → escaneie o QR do terminal")
print()
print("  4. Depois de 'connected' aparecer no terminal, rode:")
print("       python3 " + os.path.abspath(__file__))
print()
log("FIM", "fim")
