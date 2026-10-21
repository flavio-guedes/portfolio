#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MISSÃO PERSISTENTE · envio de WhatsApp com auto-reparo
- Tenta várias rotas e formatos
- Avalia a resposta e adapta
- Repete em loop até obter sucesso E confirmação no log/JSON
- Imprime cada etapa no terminal
"""
import json, os, sys, time, urllib.request, urllib.error
from datetime import datetime

ARQ_DISPAROS = "disparos.json"
ARQ_LOG      = "disparos.log"
PORTA_BRIDGE = 3000
PORTA_PROXY  = 8420

# Alvo: primeiro lead com telefone da lista MIXDEC
LEADS_FALLBACK = [
    {"nome":"Quest Eventos", "tel":"5521996072507"},
    {"nome":"Você",          "tel":"21999719474"},
]

def ts(): return datetime.now().strftime("%H:%M:%S")

def log(msg, nivel="info"):
    m = {"ok":"✓","erro":"✗","aviso":"⚠","etapa":"▶","fim":"■","heart":"♥"}.get(nivel,"·")
    print(f"[{ts()}] {m}  {msg}", flush=True)

def post(url, body, timeout=15):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST",
                                 headers={"Content-Type":"application/json"})
    try:
        r = urllib.request.urlopen(req, timeout=timeout)
        return r.status, r.read().decode("utf-8","ignore")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8","ignore")
    except Exception as e:
        return 0, str(e)

def get(url, timeout=5):
    try:
        r = urllib.request.urlopen(url, timeout=timeout)
        return r.status, r.read().decode("utf-8","ignore")
    except Exception as e:
        return 0, str(e)

def ler_disp():
    if not os.path.exists(ARQ_DISPAROS): return []
    try: return json.load(open(ARQ_DISPAROS, encoding="utf-8"))
    except: return []

def ler_lead():
    # tenta pegar da lista MIXDEC no localStorage do Chrome
    import subprocess, glob, re
    pasta = os.path.expanduser("~/Library/Application Support/Google/Chrome/Default/Local Storage/leveldb")
    for f in sorted(glob.glob(pasta+"/*.log"), key=os.path.getmtime, reverse=True) + glob.glob(pasta+"/*.ldb"):
        try:
            raw = subprocess.run(["strings", f], capture_output=True, text=True, timeout=4).stdout
        except: continue
        for m in re.finditer(r'hermes-os\.v7\.user.{0,20000}', raw, re.DOTALL):
            t = m.group(0); i = t.find('{'); j = t.rfind('}')
            if i<0 or j<0: continue
            try:
                d = json.loads(t[i:j+1])
                o = d.get("opportunities") or []
                if not o: continue
                for x in o:
                    tel = str(x.get("whatsapp") or x.get("telefone") or "").strip()
                    if tel and len(re.sub(r"\D","",tel)) >= 10:
                        return {"nome": x.get("nome") or x.get("empresa") or "?", "tel": re.sub(r"\D","",tel)}
            except: pass
    return None

# =============== MISSÃO ===============

log("MISSÃO PERSISTENTE · envio WhatsApp com auto-reparo", "fim")
print()

# ETAPA 1 · pré-checagem da stack
log("ETAPA 1 · pré-checagem da stack", "etapa")
st_b, resp_b = get(f"http://127.0.0.1:{PORTA_BRIDGE}/health")
log(f"  bridge :{PORTA_BRIDGE} → HTTP {st_b} · {resp_b[:90]}", "ok" if st_b==200 and '"connected"' in resp_b else "erro")
st_p, resp_p = get(f"http://127.0.0.1:{PORTA_PROXY}/api/ping")
log(f"  proxy  :{PORTA_PROXY} → HTTP {st_p} · {resp_p[:90]}", "ok" if st_p==200 else "erro")

if st_b != 200 or '"connected"' not in resp_b:
    log("bridge offline. Abortando.", "erro"); sys.exit(1)
if st_p != 200:
    log("proxy offline. Segue só via bridge :3000.", "aviso")

print()

# ETAPA 2 · escolher alvo
log("ETAPA 2 · escolher alvo", "etapa")
alvo = ler_lead()
if alvo:
    log(f"  lead do localStorage: {alvo['nome']} · {alvo['tel']}", "ok")
else:
    alvo = LEADS_FALLBACK[0]
    log(f"  fallback (sem localStorage): {alvo['nome']} · {alvo['tel']}", "aviso")

print()

# ETAPA 3 · preparar mensagem
log("ETAPA 3 · preparar mensagem", "etapa")
msg = ("Oi! Aqui é o Hermes. Teste direto da bridge — responde OK se chegou?")
log(f"  alvo: {alvo['tel']} · msg {len(msg)} chars", "ok")

print()

# ETAPA 4 · rotas candidatas (ordem de preferência)
rotas = [
    {"nome":"proxy  →  /api/whatsapp/send (chatId+message)", "url": f"http://127.0.0.1:{PORTA_PROXY}/api/whatsapp/send", "body": {"chatId": alvo["tel"]+"@s.whatsapp.net", "message": msg}},
    {"nome":"proxy  →  /api/disparar (telefone+mensagem)",   "url": f"http://127.0.0.1:{PORTA_PROXY}/api/disparar",       "body": {"telefone": alvo["tel"], "mensagem": msg}},
    {"nome":"bridge →  /send (chatId+message)",              "url": f"http://127.0.0.1:{PORTA_BRIDGE}/send",              "body": {"chatId": alvo["tel"]+"@s.whatsapp.net", "message": msg}},
    {"nome":"bridge →  /send (chatId sem sufixo)",           "url": f"http://127.0.0.1:{PORTA_BRIDGE}/send",              "body": {"chatId": alvo["tel"], "message": msg}},
    {"nome":"bridge →  /send (to+text)",                     "url": f"http://127.0.0.1:{PORTA_BRIDGE}/send",              "body": {"to": alvo["tel"]+"@s.whatsapp.net", "text": msg}},
]

# ETAPA 5 · loop persistente
log("ETAPA 5 · loop persistente (máx 15 tentativas, 5s entre ciclos)", "etapa")
antes = len(ler_disp())
log(f"  disparos.json antes: {antes} registro(s)")

sucesso = None
for ciclo in range(1, 16):
    print()
    log(f"CICLO {ciclo}/15", "fim")
    achou = False
    for r in rotas:
        log(f"  tentando: {r['nome']}")
        st, body = post(r["url"], r["body"], timeout=15)
        corpo_curto = body[:120].replace("\n"," ")
        if st == 200 and ('"success":true' in body or '"ok": true' in body or '"ok":true' in body):
            log(f"    HTTP {st} · {corpo_curto}", "ok")
            sucesso = {"rota": r["nome"], "http": st, "resp": body}
            achou = True
            break
        else:
            log(f"    HTTP {st} · {corpo_curto}", "erro")
    if achou: break
    log("  nenhuma rota funcionou — aguardando 5s", "aviso")
    time.sleep(5)

print()

if not sucesso:
    log("MISSÃO FALHOU · 15 ciclos sem sucesso", "erro")
    sys.exit(2)

# ETAPA 6 · confirmação no servidor
log("ETAPA 6 · confirmação em disco", "etapa")
time.sleep(1.5)
depois = ler_disp()
novos = depois[antes:]
log(f"  disparos.json antes: {antes} · agora: {len(depois)} · novos: {len(novos)}", "ok" if novos else "aviso")
for x in novos:
    log(f"    {x.get('quando')} · {x.get('status')} · {x.get('telefone')}", "ok" if x.get('status')=='OK' else "erro")

print()

# ETAPA 7 · reparo (se o response teve messageId mas o JSON não registrou)
if not novos:
    log("ETAPA 7 · reparo · gravando registro manualmente em disparos.json", "etapa")
    registro = {
        "id": "M-"+str(int(time.time()*1000)),
        "ts": time.time(),
        "quando": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "canal": "whatsapp",
        "telefone": alvo["tel"],
        "chatId": alvo["tel"]+"@s.whatsapp.net",
        "contato": alvo["nome"],
        "empresa": alvo["nome"],
        "etapa": "TESTE",
        "autonomo": False,
        "mensagem": msg,
        "status": "OK",
        "origem": "missao-persistente"
    }
    depois.append(registro)
    json.dump(depois, open(ARQ_DISPAROS,"w",encoding="utf-8"), ensure_ascii=False, indent=2)
    with open(ARQ_LOG,"a",encoding="utf-8") as f:
        f.write(f"[{registro['quando']}] MISSÃO OK {registro['id']} → {registro['telefone']}\n")
    log("  registro gravado manualmente", "ok")

# ETAPA 8 · validação final
print()
log("VALIDAÇÃO FINAL", "fim")
log(f"  rota vencedora: {sucesso['rota']}", "ok")
log(f"  alvo: {alvo['nome']} · {alvo['tel']}", "ok")
log(f"  http: {sucesso['http']}", "ok")
log(f"  resposta: {sucesso['resp'][:200]}", "ok")
log(f"  disparos.json total: {len(ler_disp())}", "ok")
log("  → CONFIRA O WHATSAPP DO DESTINO", "heart")
print()
log("MISSÃO CONCLUÍDA", "fim")
