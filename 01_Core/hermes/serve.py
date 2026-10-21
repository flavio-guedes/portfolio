#!/usr/bin/env python3
import json, os, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime, timedelta
import random

PASTA = os.path.dirname(os.path.abspath(__file__))
PORTA = 8500
FILA  = os.path.join(PASTA, "fila.json")
LEADS = os.path.join(PASTA, "leads.json")
DISP  = os.path.join(PASTA, "disparos.json")
BRIDGE = "http://127.0.0.1:3000"

ETAPAS_ORDEM = ["Q","D0","F1","F2","F3","ENC"]
MSG_F1 = ("{primeiro}, retomando o que te falei sobre a {empresa}. Vi que continua "
          "aparecendo reclamação de demora no atendimento nas avaliações. A automação "
          "comercial resolve exatamente isso. Vale 15 min essa semana?")

def load(p):
    try:
        with open(p, encoding="utf-8") as f: return json.load(f)
    except: return None
def save(p, d):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
def now(): return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
def prox_etapa(et):
    try: i = ETAPAS_ORDEM.index(et)
    except: i = 0
    return ETAPAS_ORDEM[(i+1) % len(ETAPAS_ORDEM)]

def bridge_send(cid, msg):
    body = json.dumps({"chatId":cid,"message":msg}).encode()
    req = urllib.request.Request(BRIDGE+"/send", data=body, method="POST",
                                 headers={"Content-Type":"application/json"})
    try:
        r = urllib.request.urlopen(req, timeout=20)
        return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"success":False,"error":f"HTTP {e.code}"}
    except Exception as e:
        return {"success":False,"error":str(e)[:80]}

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        b = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    def do_GET(self):
        p = self.path.split("?")[0]
        if p in ("/", "/index.html"):
            f = os.path.join(PASTA, "dashboard.html")
            if not os.path.exists(f): return self._send(404, "não existe", "text/plain")
            with open(f, encoding="utf-8") as fh:
                return self._send(200, fh.read(), "text/html; charset=utf-8")
        if p == "/fila.json":
            if not os.path.exists(FILA): return self._send(200, '{"itens":[],"total":0}')
            with open(FILA, encoding="utf-8") as fh: return self._send(200, fh.read())
        if p == "/health":
            try:
                r = urllib.request.urlopen(BRIDGE+"/health", timeout=2)
                return self._send(200, r.read().decode())
            except:
                return self._send(200, '{"status":"offline"}')
        self._send(404, '{"erro":"rota desconhecida"}')

    def do_POST(self):
        p = self.path.split("?")[0]
        if p != "/acao":
            return self._send(404, '{"erro":"rota desconhecida"}')
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads((self.rfile.read(n) if n else b"{}").decode("utf-8") or "{}")
        except Exception as e:
            return self._send(400, json.dumps({"ok":False,"erro":str(e)}))

        acao = body.get("acao","")
        item_id = body.get("id","")
        d = load(FILA) or {"itens":[], "total":0}
        itens = d.get("itens", [])
        alvo = next((i for i in itens if i["id"]==item_id), None)

        resposta = {"ok": True, "msg": ""}

        if acao == "enviar" and alvo:
            if alvo["status"] in ("OK","BLOQUEADO"):
                resposta = {"ok": False, "msg": f"{alvo['id']} já {alvo['status']}"}
            else:
                r = bridge_send(alvo["chatId"], alvo["mensagem"])
                if r.get("success"):
                    alvo["status"] = "OK"
                    alvo["enviado_em"] = now()
                    alvo["etapa"] = prox_etapa(alvo.get("etapa","D0"))
                    resposta["msg"] = f"✓ {alvo['id']} {alvo['empresa'][:30]}"
                else:
                    alvo["status"] = "ERRO"
                    alvo["erro"] = str(r)[:100]
                    resposta = {"ok": False, "msg": f"✗ {alvo['id']} — {str(r)[:60]}"}

        elif acao == "remover" and alvo:
            d["itens"] = [i for i in itens if i["id"] != item_id]
            d["total"] = len(d["itens"])
            resposta["msg"] = f"✕ {item_id} removido"

        elif acao == "bloquear" and alvo:
            alvo["status"] = "BLOQUEADO"
            alvo["erro"] = "bloqueado manual"
            resposta["msg"] = f"⊘ {item_id} bloqueado"

        elif acao == "pular" and alvo:
            alvo["status"] = "PULADO"
            alvo["erro"] = "pulado"
            resposta["msg"] = f"→ {item_id} pulado"

        elif acao == "despedida" and alvo:
            alvo["status"] = "DESPEDIDA"
            alvo["erro"] = "marcado manual"
            alvo["despedida_em"] = now()
            resposta["msg"] = f"⊗ {item_id} despedida"

        elif acao == "etapa" and alvo:
            nova = prox_etapa(alvo.get("etapa","D0"))
            alvo["etapa"] = nova
            # regenera mensagem com template simples
            primeiro = (alvo.get("nome") or "tudo bem").split()[0]
            emp = alvo.get("empresa") or "sua empresa"
            # usa F1 para follow, D0 para primeiro
            templates = {
                "Q":  f"Oi {primeiro}, tudo bem? Vi que você está à frente da {emp}.",
                "D0": f"Oi {primeiro}, tudo bem? Estava vendo a {emp} e reparei que as avaliações mencionam demora no retorno. A gente resolve com automação comercial no WhatsApp. Faz sentido te mostrar em 15 min?",
                "F1": MSG_F1.format(primeiro=primeiro, empresa=emp),
                "F2": f"{primeiro}, última passada por aqui sobre a {emp}. Se ainda estiver aberto, me chama — 15 min resolve.",
                "F3": f"{primeiro}, encerro por aqui pra não insistir. Deixo o contato aberto.",
                "ENC": f"{primeiro}, vou parar de aparecer. Se fizer sentido falar de automação, responde esse chat.",
            }
            alvo["mensagem"] = templates.get(nova, alvo["mensagem"])
            resposta["msg"] = f"{item_id} → {nova}"

        elif acao == "mais_leads":
            leads = load(LEADS) or []
            ja_fila = set(i["telefone"].replace("+","").strip() for i in d["itens"])
            ja_env = set()
            if os.path.exists(DISP):
                try:
                    for x in load(DISP) or []:
                        t = (x.get("telefone") or "").replace("+","").strip()
                        if t: ja_env.add(t)
                except: pass
            disp = [l for l in leads
                    if l["telefone"].replace("+","").strip() not in ja_fila
                    and l["telefone"].replace("+","").strip() not in ja_env]
            disp.sort(key=lambda l: (-l.get("score_composto",0), -l.get("score",0)))
            sel = disp[:30]
            random.seed(datetime.now().timestamp())
            agendados = [i for i in d["itens"] if i.get("status")=="AGENDADO"]
            if agendados:
                try:
                    cur = max(datetime.strptime(i["prazo"],"%Y-%m-%d %H:%M:%S") for i in agendados)
                    cur += timedelta(minutes=random.randint(3,5))
                except:
                    cur = datetime.now() + timedelta(minutes=2)
            else:
                cur = datetime.now() + timedelta(minutes=2)
            c = 0
            for l in sel:
                primeiro = (l["nome"] or "tudo bem").split()[0]
                emp = l["empresa"] or "sua empresa"
                d["itens"].append({
                    "id": f"M{c+1:03d}", "nome":l["nome"], "empresa":emp,
                    "telefone":l["telefone"], "chatId":l["telefone"]+"@s.whatsapp.net",
                    "tipo":"base", "etapa":"F1",
                    "mensagem": MSG_F1.format(primeiro=primeiro, empresa=emp),
                    "prazo": cur.strftime("%Y-%m-%d %H:%M:%S"),
                    "status":"AGENDADO", "enviado_em": None, "erro": None
                })
                c += 1
                cur += timedelta(minutes=random.randint(3,5))
            d["total"] = len(d["itens"])
            resposta["msg"] = f"+{c} leads (cadência 3-5min)"

        elif acao == "ativar":
            resposta["msg"] = "envio automático ativado (use a TUI pra disparar em lote)"
        elif acao == "pausar":
            resposta["msg"] = "pausado"

        save(FILA, d)
        return self._send(200, json.dumps(resposta))

if __name__ == "__main__":
    print(f"dashboard em http://127.0.0.1:{PORTA}")
    HTTPServer(("127.0.0.1", PORTA), H).serve_forever()
