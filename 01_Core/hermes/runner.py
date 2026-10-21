#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RUNNER — fila com auto-pausa e auto-retomada.
   • Segue a cadência normal (10/4/3min)
   • Se um envio travar/falhar, dispara o próximo IMEDIATAMENTE
   • Se o bridge cair (ou rede), PAUSA sozinho
   • Quando o bridge voltar, RETOMA sozinho
   • Ctrl+C = parada definitiva (não retoma sozinho)

Uso:
   python3 runner.py             → timeout envio 30s
   python3 runner.py 15          → timeout envio 15s (agressivo)
"""
import json, os, sys, time, signal, subprocess, urllib.request, urllib.error
from datetime import datetime
from collections import Counter


import fcntl, os as _os, sys as _sys
_LOCK = _os.path.expanduser("~/hermes/runner.lock")
_fd = open(_LOCK, "w")
try:
    fcntl.flock(_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    print("⚠ outro runner já está rodando — saindo")
    _sys.exit(1)

# ── clamp de prazos vencidos ──
import datetime as _dt, json as _json
_fp = "fila.json"
_d = _json.load(open(_fp))
_now = _dt.datetime.now()
_bump = 0
for _i in _d["itens"]:
    if _i.get("status") == "AGENDADO":
        try:
            _p = _dt.datetime.strptime(_i["prazo"], "%Y-%m-%d %H:%M:%S")
        except Exception:
            continue
        if _p < _now:
            _i["prazo"] = (_now + _dt.timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")
            _bump += 1
if _bump:
    _json.dump(_d, open(_fp,"w"), ensure_ascii=False, indent=2)
    print(f"[startup] {_bump} prazos vencidos -> +5min")


HOME = os.path.expanduser("~")
FILA = os.path.join(HOME, "hermes/fila.json")
STATE = os.path.join(HOME, "hermes/runner.state")
BRIDGE_DIR = os.path.join(HOME, ".hermes/hermes-agent/scripts/whatsapp-bridge")
BRIDGE = "http://127.0.0.1:3000"
TIMEOUT = int(sys.argv[1]) if len(sys.argv) > 1 else 30

# ─── cores ANSI ───
C = {
    "r": "\033[0m", "b": "\033[1m", "dim": "\033[90m",
    "ok": "\033[32m", "err": "\033[31m", "warn": "\033[33m",
    "info": "\033[36m", "novo": "\033[35m", "base": "\033[33m", "hot": "\033[31m"
}
def c(k, s): return f"{C.get(k,'')}{s}{C['r']}"

def now(): return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
def hh(): return datetime.now().strftime("%H:%M:%S")
def log(msg, tag="info"):
    print(f"{c('dim', '['+hh()+']')} {c(tag, msg)}", flush=True)

def load():
    try:
        with open(FILA, encoding="utf-8") as f: return json.load(f)
    except: return None
def save(d):
    tmp = FILA + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    os.replace(tmp, FILA)

def save_state(**kw):
    try:
        st = json.load(open(STATE)) if os.path.exists(STATE) else {}
    except: st = {}
    st.update(kw)
    st["ts"] = now()
    with open(STATE, "w") as f: json.dump(st, f, indent=2)

def load_state():
    try: return json.load(open(STATE)) if os.path.exists(STATE) else {}
    except: return {}

def health():
    try:
        return json.loads(urllib.request.urlopen(BRIDGE+"/health", timeout=3).read().decode())
    except: return None

def bridge_ok():
    h = health()
    return h and h.get("status") == "connected"

def subir_bridge():
    """Tenta subir o bridge em background."""
    log("subindo bridge em background…", "warn")
    try:
        subprocess.Popen(["node", "bridge.js", "--session"],
                         cwd=BRIDGE_DIR,
                         stdout=open("/tmp/bridge.log", "a"),
                         stderr=subprocess.STDOUT,
                         start_new_session=True)
    except Exception as e:
        log(f"falhou ao subir: {e}", "err")
        return False
    # espera até 30s
    for i in range(30):
        time.sleep(1)
        if bridge_ok():
            log("bridge conectou!", "ok")
            return True
    log("bridge não conectou em 30s", "err")
    return False

def send_com_timeout(cid, msg, timeout):
    body = json.dumps({"chatId": cid, "message": msg}).encode()
    req = urllib.request.Request(BRIDGE+"/send", data=body, method="POST",
                                 headers={"Content-Type":"application/json"})
    try:
        r = urllib.request.urlopen(req, timeout=timeout)
        return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: err = e.read().decode()[:120]
        except: err = f"HTTP {e.code}"
        return {"success": False, "error": err}
    except Exception as e:
        return {"success": False, "error": str(e)[:100]}

def eh_sem_whatsapp(err):
    e = (err or "").lower()
    return any(t in e for t in ["not registered","no whatsapp","invalid number",
                                "not on whatsapp","invalid jid","number not on",
                                "user not found"])

def eh_rede(err):
    e = (err or "").lower()
    return any(t in e for t in ["connection refused","timed out","timeout",
                                "network","unreachable","socket","broken pipe"])

def proximo(d):
    pend = [i for i in d["itens"] if i["status"] == "AGENDADO"]
    if not pend: return None
    return min(pend, key=lambda x: x["prazo"])

def marcar(d, pid, status, erro=None):
    for i in d["itens"]:
        if i["id"] == pid:
            i["status"] = status
            if status == "OK":
                i["enviado_em"] = now()
                ordem = ["Q","D0","F1","F2","F3","ENC"]
                et = i.get("etapa","D0")
                try: idx = ordem.index(et)
                except: idx = 0
                i["etapa"] = ordem[(idx+1) % len(ordem)]
            else:
                i["erro"] = erro
            break
    save(d)

def contagem(d):
    return Counter(i["status"] for i in d["itens"])

def header(d, extra=""):
    ct = contagem(d)
    ok = ct.get("OK",0); err = ct.get("ERRO",0)
    pd = ct.get("AGENDADO",0); pul = ct.get("PULADO",0)
    tot = len(d["itens"])
    print()
    print(c("b","═"*76))
    lin = (f"  {c('info','RUNNER')}  {hh()}  |  "
           f"{c('ok','✓ '+str(ok))}  {c('err','✗ '+str(err))}  "
           f"{c('info','⏳ '+str(pd))}  {c('dim','⊘ '+str(pul))}  |  "
           f"{tot} total  |  timeout {TIMEOUT}s")
    if extra: lin += "  |  " + extra
    print(lin)
    print(c("b","═"*76))

# ─── estado global ───
running = True
pausado_por_erro = False
def stop(sig, frame):
    global running
    running = False
signal.signal(signal.SIGINT, stop)
signal.signal(signal.SIGTERM, stop)

# ─── pré-voo ───
if not os.path.exists(FILA):
    print(c("err","✗ fila.json não encontrado")); sys.exit(1)

d = load()
if not d:
    print(c("err","✗ erro lendo fila.json")); sys.exit(1)

header(d, c("info","iniciando"))
st = load_state()
if st.get("status") == "pausado_humano":
    log("última execução foi pausada por Ctrl+C — continuando de onde parou", "warn")

# ─── garante bridge no ar ───
if not bridge_ok():
    log("bridge offline — tentando subir", "warn")
    if not subir_bridge():
        log("não consegui subir o bridge. Abortando.", "err")
        sys.exit(1)
log("bridge conectado", "ok")

# ─── loop principal ───
sends_ok = 0
sends_err = 0
falhas_seguidas = 0
MAX_FALHAS = 5

while running:
    d = load()
    if not d:
        time.sleep(1); continue

    p = proximo(d)
    if not p:
        ct = contagem(d)
        if ct.get("AGENDADO", 0) == 0:
            header(d, c("ok","fila concluída"))
            save_state(status="concluido")
            break
        time.sleep(2); continue

    tipo = p.get("tipo", "novo")
    empresa = (p.get("empresa") or "")[:34]

    # ─── 1. espera pelo prazo (a menos que seja rajada) ───
    try:
        alvo = datetime.strptime(p["prazo"], "%Y-%m-%d %H:%M:%S")
        seg = (alvo - datetime.now()).total_seconds()
    except: seg = 0

    if seg > 0:
        mins = int(seg // 60)
        rest = int(seg % 60)
        print(f"{c('dim','['+hh()+']')} {c(tipo, tipo)} {p['id']} "
              f"{(p.get('nome') or '')[:26]:26s} "
              f"{c('dim','em '+str(mins)+'m'+str(rest).zfill(2)+'s')}", flush=True)
        t0 = time.time()
        # espera em pedaços: checa bridge a cada 5s
        while running and (time.time() - t0) < seg:
            time.sleep(min(2.0, max(0.1, seg - (time.time() - t0))))
            if int(time.time() - t0) % 5 == 0:
                if not bridge_ok():
                    log("bridge caiu durante espera — pausando", "warn")
                    if not subir_bridge():
                        log("falhou ao subir, tentando de novo em 10s", "warn")
                        time.sleep(10)
                        if not subir_bridge():
                            log("bridge continua offline. Aguardando intervenção.", "err")
                            save_state(status="pausado_bridge")
                            # fica tentando silenciosamente
                            while running and not bridge_ok():
                                time.sleep(15)
                            if not running: break
                            log("bridge reconectou — retomando", "ok")
        if not running: break

    # ─── 2. verifica bridge antes do envio ───
    if not bridge_ok():
        log("bridge offline — tentando subir", "warn")
        if not subir_bridge():
            log("esperando bridge voltar (auto-retomada ativa)", "warn")
            while running and not bridge_ok():
                time.sleep(5)
            if not running: break
            log("bridge voltou — retomando", "ok")

    # ─── 3. envio ───
    print(f"{c(tipo, '['+hh()+'] ▶ '+tipo+':')} {p['id']} {empresa:34s} {p['telefone']}", end=" ", flush=True)
    t0 = time.time()
    try:
        r = send_com_timeout(p["chatId"], p["mensagem"], TIMEOUT)
    except Exception as e:
        r = {"success": False, "error": str(e)[:100]}
    dur = time.time() - t0

    if r.get("success"):
        sends_ok += 1
        d = load()
        marcar(d, p["id"], "OK")
        print(f"{c('ok','✓ OK')} {c('dim', f'({dur:.1f}s)')}", flush=True)
        falhas_seguidas = 0
        continue

    # ─── 4. falha ───
    err = str(r.get("error", r))
    falhas_seguidas += 1
    d = load()

    if eh_sem_whatsapp(err):
        sends_err += 1
        marcar(d, p["id"], "PULADO", "sem WhatsApp")
        print(f"{c('dim','⊘ sem WhatsApp — disparando próximo')}", flush=True)
    elif eh_rede(err) or "timeout" in err.lower():
        sends_err += 1
        marcar(d, p["id"], "ERRO", err[:80])
        print(f"{c('warn','⚠ '+err[:50]+' — disparando próximo')}", flush=True)
    else:
        sends_err += 1
        marcar(d, p["id"], "ERRO", err[:80])
        print(f"{c('err','✗ '+err[:50]+' — disparando próximo')}", flush=True)

    # ─── 5. auto-pausa se muitas falhas seguidas (bridge provavelmente morto) ───
    if falhas_seguidas >= MAX_FALHAS:
        log(f"{MAX_FALHAS} falhas seguidas — pausando e tentando recuperar bridge", "warn")
        falhas_seguidas = 0
        if not bridge_ok():
            if not subir_bridge():
                log("aguardando intervenção (auto-retomada ativa)", "warn")
                save_state(status="pausado_bridge")
                # fica em loop silencioso até voltar
                while running and not bridge_ok():
                    time.sleep(15)
                if not running: break
                log("bridge voltou — retomando", "ok")

# ─── fim ───
if not running:
    save_state(status="pausado_humano")
    print(f"\n{c('warn','⏸ pausado por você (Ctrl+C)')}")
else:
    save_state(status="concluido")
print(c("b","═"*76))
print(f"  {c('ok', str(sends_ok)+' enviados')} · {c('err', str(sends_err)+' erros')}")
print(c("b","═"*76))
