#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Investiga por que a mensagem nao chegou."""
import json, os, sys, time, urllib.request, urllib.error
from datetime import datetime

BRIDGE = "http://127.0.0.1:3000"

def ts(): return datetime.now().strftime("%H:%M:%S")
def log(m,n="·"):
    ico={"ok":"✓","erro":"✗","aviso":"⚠","etapa":"▶","fim":"■"}.get(n,"·")
    print(f"[{ts()}] {ico}  {m}", flush=True)

def get(url):
    try:
        r=urllib.request.urlopen(url,timeout=8); return r.status, r.read().decode("utf-8","ignore")
    except urllib.error.HTTPError as e: return e.code, e.read().decode("utf-8","ignore")
    except Exception as e: return 0, str(e)

def post(url, body):
    data=json.dumps(body).encode()
    req=urllib.request.Request(url, data=data, method="POST", headers={"Content-Type":"application/json"})
    try:
        r=urllib.request.urlopen(req,timeout=15); return r.status, r.read().decode("utf-8","ignore")
    except urllib.error.HTTPError as e: return e.code, e.read().decode("utf-8","ignore")
    except Exception as e: return 0, str(e)

log("INVESTIGAÇÃO · por que a mensagem não chegou", "fim")
print()

# ETAPA 1 · De quem é essa sessão? Ler /messages
log("ETAPA 1 · últimas mensagens que a bridge registrou", "etapa")
st, body = get(BRIDGE+"/messages")
if st == 200:
    try:
        msgs = json.loads(body)
        log(f"  bridge tem {len(msgs)} mensagens em cache", "ok")
        if msgs:
            log("  últimas 5:")
            for m in msgs[-5:]:
                who = m.get("from") or m.get("to") or m.get("chatId") or m.get("id") or "?"
                txt = (m.get("text") or m.get("message") or m.get("body") or "")[:60]
                log(f"    {m.get('timestamp') or m.get('ts') or '?'} · {who} · {txt}")
        else:
            log("  cache vazio — isso é normal, bridge só guarda recentes", "aviso")
    except Exception as e:
        log(f"  erro parse: {e}", "erro")
        log(f"  body: {body[:200]}")
else:
    log(f"  /messages HTTP {st} · {body[:120]}", "erro")

print()

# ETAPA 2 · Testar 3 formatos de número para o mesmo destino
log("ETAPA 2 · testar formatos de número", "etapa")
alvo_base = "5521996072507"          # Quest Eventos (13 dígitos)
variacoes = [
    ("completo com 9", alvo_base),
    ("sem o 9 (12 díg)", "552196072507"),
    ("só DDD+número", "21996072507"),
]
msg = "[Hermes] teste de formato — responda OK"

for nome, numero in variacoes:
    chatId = numero + "@s.whatsapp.net"
    log(f"  enviando para {nome}: {numero}")
    st, body = post(BRIDGE+"/send", {"chatId": chatId, "message": msg})
    try:
        j = json.loads(body)
        if j.get("success"):
            log(f"    ✓ HTTP {st} · id {j.get('messageId')}", "ok")
        else:
            log(f"    ✗ HTTP {st} · {body[:120]}", "erro")
    except:
        log(f"    ? HTTP {st} · {body[:120]}")

print()

# ETAPA 3 · Mensagem de volta para você mesmo
log("ETAPA 3 · teste espelho — enviar para o número do próprio bridge", "etapa")
# Pega o próprio número da sessão via /health ou log
st, body = get(BRIDGE+"/health")
log(f"  /health: {body[:150]}")
# Envia para o número de teste já validado antes
for numero in ["21999719474", "5511999999999"]:
    chatId = numero + "@s.whatsapp.net"
    log(f"  tentando enviar espelho para {numero}")
    st, body = post(BRIDGE+"/send", {"chatId": chatId, "message": f"[Hermes] espelho {ts()}"})
    log(f"    HTTP {st} · {body[:120]}", "ok" if '"success":true' in body else "erro")

print()

# ETAPA 4 · Últimas mensagens, agora
log("ETAPA 4 · checando /messages de novo (após os envios)", "etapa")
st, body = get(BRIDGE+"/messages")
if st == 200:
    try:
        msgs = json.loads(body)
        log(f"  agora tem {len(msgs)} mensagens", "ok")
        if msgs:
            for m in msgs[-8:]:
                who = m.get("from") or m.get("to") or m.get("chatId") or "?"
                txt = (m.get("text") or m.get("message") or m.get("body") or "")[:50]
                log(f"    {m.get('timestamp') or '?'} · {who} · {txt}")
    except Exception as e:
        log(f"  erro: {e}", "erro")

print()

log("VALIDAÇÃO", "fim")
log("  → Olhe o WhatsApp do Quest Eventos: qual dos 3 formatos chegou?")
log("  → Olhe o WhatsApp 21999719474: a mensagem espelho chegou?")
print()
log("FIM", "fim")
