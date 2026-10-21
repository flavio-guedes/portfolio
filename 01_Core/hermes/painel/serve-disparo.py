#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Proxy: painel (8420) -> bridge Baileys (3000)."""
import json, os, time, sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib import request as urlreq, error as urlerr
from urllib.parse import urlparse

PASTA  = "/Users/mac/hermes/painel"
ARQ    = os.path.join(PASTA, "disparos.json")
LOG    = os.path.join(PASTA, "disparos.log")
PORTA  = 8420
BRIDGE = "http://127.0.0.1:3000"

def _load():
    if not os.path.exists(ARQ): return []
    try:
        with open(ARQ, encoding="utf-8") as f: return json.load(f)
    except Exception: return []

def _save(lst):
    with open(ARQ, "w", encoding="utf-8") as f:
        json.dump(lst, f, ensure_ascii=False, indent=2)

def _log(m):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(time.strftime("[%Y-%m-%d %H:%M:%S] ")+m+"\n")

def _bpost(path, body):
    data = json.dumps(body).encode("utf-8")
    req = urlreq.Request(BRIDGE+path, method="POST", data=data,
                         headers={"Content-Type":"application/json"})
    try:
        r = urlreq.urlopen(req, timeout=20)
        return r.status, r.read().decode("utf-8","ignore")
    except urlerr.HTTPError as e:
        return e.code, e.read().decode("utf-8","ignore")
    except Exception as e:
        return 0, json.dumps({"erro": str(e)})

def _bget(path):
    try:
        r = urlreq.urlopen(BRIDGE+path, timeout=5)
        return r.status, r.read().decode("utf-8","ignore")
    except urlerr.HTTPError as e:
        return e.code, e.read().decode("utf-8","ignore")
    except Exception as e:
        return 0, json.dumps({"erro": str(e)})

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    def _json(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._cors()
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def do_GET(self):
        p = urlparse(self.path).path
        if p == "/api/ping":
            return self._json({"ok":True,"pasta":PASTA,"bridge":BRIDGE,"ts":time.time()})
        if p == "/api/whatsapp/status":
            st, txt = _bget("/health")
            try: return self._json({"ok":st==200,"bridge":json.loads(txt)})
            except Exception: return self._json({"ok":False,"raw":txt})
        if p == "/api/disparos":
            d=_load(); return self._json({"total":len(d),"ultimos":d[-100:]})
        return self._json({"erro":"use /api/ping, /api/whatsapp/send, /api/disparar, /api/disparos"},404)
    def do_POST(self):
        p = urlparse(self.path).path
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads((self.rfile.read(n) if n else b"{}").decode("utf-8") or "{}")
        except Exception as e:
            return self._json({"ok":False,"erro":"JSON invalido: "+str(e)},400)
        if p in ("/api/whatsapp/send","/api/disparar","/send"):
            chatId = str(body.get("chatId") or body.get("telefone") or "").strip()
            texto  = body.get("message") or body.get("mensagem") or ""
            if chatId and "@" not in chatId:
                chatId = chatId + "@s.whatsapp.net"
            if not chatId or not texto:
                return self._json({"ok":False,"erro":"chatId e message obrigatorios"},400)
            st, txt = _bpost("/send", {"chatId":chatId,"message":texto})
            reg = {"id":"D-"+str(int(time.time()*1000)),"ts":time.time(),
                   "quando":time.strftime("%Y-%m-%d %H:%M:%S"),
                   "canal":body.get("canal") or "whatsapp",
                   "telefone":chatId.split("@")[0],"chatId":chatId,
                   "contato":body.get("contato") or "","empresa":body.get("empresa") or "",
                   "etapa":body.get("etapa") or "","autonomo":bool(body.get("autonomo")),
                   "mensagem":str(texto)[:500],"opportunity_id":body.get("opportunity_id") or "",
                   "status":"OK" if st==200 else "ERRO","bridge_http":st,"bridge_resp":txt[:200]}
            d=_load(); d.append(reg); _save(d)
            _log(("OK " if st==200 else "ERRO ")+reg["id"]+" -> "+reg["telefone"]+" ("+str(st)+")")
            if st==200: return self._json({"ok":True,"id":reg["id"],"bridge_http":st,"bridge_resp":txt[:200]})
            return self._json({"ok":False,"erro":"bridge HTTP "+str(st),"bridge_resp":txt[:200]},502)
        return self._json({"erro":"endpoint desconhecido"},404)

if __name__ == "__main__":
    print("Rodando em http://127.0.0.1:%d (proxy -> %s)" % (PORTA, BRIDGE))
    HTTPServer(("127.0.0.1", PORTA), H).serve_forever()
