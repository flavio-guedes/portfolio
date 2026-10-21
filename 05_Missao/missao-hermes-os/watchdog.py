#!/usr/bin/env python3
"""Watchdog Hermes OS — coleta 15s, snapshot 60s, HTTP :9000."""
import json, os, socket, threading, time, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta

BASE = Path(__file__).resolve().parent
CFG  = json.loads((BASE/"config/watchdog.json").read_text())
DATA = BASE/"data"; DATA.mkdir(exist_ok=True)
INTERVALO = CFG.get("intervalo_segundos", 15)

ANALISE_HORAS = CFG.get("analise_evolucao_horas", 24)   # roda 1x a cada N horas
DOWN_GRAVE_SEG = CFG.get("down_grave_seg", 300)          # 5 min down = urgente
SUG_PATH = DATA / "sugestoes.jsonl"
_ultimo_analise = 0.0
_servico_down_desde = {}
SNAPSHOT  = CFG.get("snapshot_segundos", 60)
PORTA     = CFG.get("porta_api", 9000)
SERVICOS  = CFG["servicos"]

BRIDGE_SEND  = "http://127.0.0.1:8787/send"
BRIDGE_TOKEN = os.environ.get("HERMES_BRIDGE_TOKEN", "hermes123")
FLAVIO_JID   = os.environ.get("FLAVIO_JID", "").strip()
_ultimo_estado = {}
estado = {"ts": "", "servicos": {}}
lock   = threading.Lock()
_ultimo_snap = 0.0


def _post(url, body, headers=None):
    try:
        data = json.dumps(body).encode()
        h = {"Content-Type": "application/json"}; h.update(headers or {})
        req = urllib.request.Request(url, data=data, headers=h)
        with urllib.request.urlopen(req, timeout=3) as r:
            return r.status, r.read().decode()[:200]
    except Exception as e:
        return 0, str(e)


def alertar(nome, de, para):
    if not FLAVIO_JID: return
    if para != "down" or de == "down": return
    msg = f"⚠️ Hermes OS — {nome} caiu ({de} → {para}) às {datetime.now().strftime('%H:%M:%S')}"
    st, _ = _post(BRIDGE_SEND, {"number": FLAVIO_JID, "message": msg},
                  {"Authorization": f"Bearer {BRIDGE_TOKEN}"})
    print(f"[alerta] {nome} down → bridge HTTP {st}", flush=True)


def coletar_custos():
    """Desativado — /spend/logs retorna 500 neste LiteLLM."""
    return



def _ler_metrics(horas=24):
    corte = datetime.now() - timedelta(hours=horas)
    out = []
    if not (DATA / "metrics.jsonl").exists():
        return out
    for ln in (DATA / "metrics.jsonl").read_text().splitlines()[-5000:]:
        try:
            o = json.loads(ln)
            if datetime.fromisoformat(o["ts"]) >= corte:
                out.append(o)
        except Exception:
            pass
    return out


def _uptime(amostras, nome):
    if not amostras: return 0.0
    ok = sum(1 for a in amostras if a.get("servicos", {}).get(nome, {}).get("status") == "ok")
    return ok / len(amostras)


def _lat(amostras, nome):
    vals = [a["servicos"][nome].get("latencia_ms") for a in amostras
            if a.get("servicos", {}).get(nome, {}).get("latencia_ms") is not None]
    return sum(vals) / len(vals) if vals else 0.0


def _gravar_sugestoes(lista, origem="agendada"):
    linha = {
        "ts": datetime.now().isoformat(timespec="seconds"),
        "origem": origem,
        "sugestoes": lista,
    }
    with SUG_PATH.open("a") as f:
        f.write(json.dumps(linha, ensure_ascii=False) + "\n")


def analisar_evolucao():
    """Roda 1x/dia (ou intervalo configurado). Escreve sugestões."""
    sugestoes = []
    am24 = _ler_metrics(24)
    am1  = _ler_metrics(1)
    n24  = len(am24)

    # v11 preditiva
    alvo = 1440
    if n24 < alvo:
        eta_h = round((alvo - n24) / 60, 1)
        sugestoes.append({"fase":"4","pri":"info",
            "msg": f"v11 preditiva: {n24}/{alvo} amostras · ETA ~{eta_h}h",
            "msg_cz": f"Prato do dia (previsão): faltam ~{eta_h}h de anotações para servir"})
    else:
        sugestoes.append({"fase":"4","pri":"pronto",
            "msg": f"v11 PRONTA para implementar ({n24} amostras/24h)",
            "msg_cz": f"Caderno cheio ({n24} anotações/24h) — pode criar o prato do dia"})

    # uptime e latência degradando
    if am24:
        servicos = list(am24[-1].get("servicos", {}).keys())
        for s in servicos:
            up = _uptime(am24, s)
            if up < 0.95:
                sugestoes.append({"fase":"1","pri":"alta",
                    "msg": f"{s}: uptime {round(up*100,1)}% em 24h",
                    "msg_cz": f"{s}: ficou fora do posto {round((1-up)*100,1)}% do dia"})
            l1  = _lat(am1, s)
            l24 = _lat(am24, s)
            if l24 > 0 and l1 > l24 * 2 and l1 > 20:
                sugestoes.append({"fase":"1","pri":"média",
                    "msg": f"{s}: latência 2× acima da média ({round(l1,1)} vs {round(l24,1)} ms)",
                    "msg_cz": f"{s}: preparo lento hoje ({round(l1,1)}ms) — 2× mais que o normal"})

    # leads
    lp = Path.home() / "hermes-bridge" / "leads-autorizados.json"
    n_leads = 0
    if lp.exists():
        try: n_leads = len(json.loads(lp.read_text()).get("leads", []))
        except Exception: pass
    if 500 <= n_leads < 5000:
        sugestoes.append({"fase":"2","pri":"info",
            "msg": f"{n_leads} leads no CRM — integrar no painel (limite ~5000)",
            "msg_cz": f"{n_leads} clientes VIP cadastrados — hora de expor no salão"})
    elif n_leads >= 5000:
        sugestoes.append({"fase":"2","pri":"alta",
            "msg": f"⚠ {n_leads} leads — RAM do CRM em risco",
            "msg_cz": f"⚠ {n_leads} clientes — o caderno não cabe mais na bancada"})

    # número de serviços
    n_sv = len(am24[-1].get("servicos", {})) if am24 else 0
    if 12 <= n_sv < 15:
        sugestoes.append({"fase":"3","pri":"info",
            "msg": f"{n_sv} serviços — perto do limite de VM (~15)",
            "msg_cz": f"{n_sv} funcionários no turno — quase hora de abrir 2ª cozinha"})
    elif n_sv >= 15:
        sugestoes.append({"fase":"3","pri":"média",
            "msg": f"{n_sv} serviços — considerar VM standby",
            "msg_cz": f"{n_sv} funcionários — precisa de filial (VM) para não apertar"})

    if not sugestoes:
        sugestoes.append({"fase":"1","pri":"info",
            "msg":"Sistema estável — próximo passo: fix /static/ do daemon",
            "msg_cz":"Cozinha calma — só falta consertar o quadro do mural (alertas)"})

    ordem = {"alta":0,"pronto":1,"média":2,"info":3}
    sugestoes.sort(key=lambda x: ordem.get(x["pri"], 9))
    _gravar_sugestoes(sugestoes, origem="agendada")


def loop_evolucao():
    """Thread separada: roda análise no boot + a cada ANALISE_HORAS."""
    global _ultimo_analise
    # primeira análise 30s após o boot
    time.sleep(30)
    try:
        analisar_evolucao()
        _ultimo_analise = time.time()
    except Exception as e:
        try:
            with (DATA/"watchdog.log").open("a") as f:
                f.write(f"[evolucao] {e}\n")
        except Exception: pass
    while True:
        time.sleep(300)  # verifica a cada 5 min
        if time.time() - _ultimo_analise >= ANALISE_HORAS * 3600:
            try:
                analisar_evolucao()
                _ultimo_analise = time.time()
            except Exception:
                pass


def checar_down_grave(nome, st):
    """Detecção em tempo real: serviço down por > DOWN_GRAVE_SEG gera sugestão urgente."""
    agora = time.time()
    if st["status"] == "down":
        if nome not in _servico_down_desde:
            _servico_down_desde[nome] = agora
        elif agora - _servico_down_desde[nome] >= DOWN_GRAVE_SEG:
            # evita duplicar (só grava se o último alerta urgente não foi nos últimos 10 min)
            chave = f"{nome}-urgente"
            if _servico_down_desde.get(chave, 0) < agora - 600:
                _gravar_sugestoes([{
                    "fase":"1","pri":"alta",
                    "msg": f"🔴 {nome} down há {int((agora-_servico_down_desde[nome])/60)} min",
                    "msg_cz": f"🔴 {nome} saiu do posto há {int((agora-_servico_down_desde[nome])/60)} min"
                }], origem="tempo-real")
                _servico_down_desde[chave] = agora
    else:
        _servico_down_desde.pop(nome, None)


def checar(s):
    t0 = time.perf_counter()
    try:
        with socket.create_connection((s["host"], s["porta"]), timeout=1.5):
            return {"status": "ok", "latencia_ms": round((time.perf_counter()-t0)*1000, 2)}
    except Exception as e:
        return {"status": "down", "erro": type(e).__name__}


def coletar():
    global _ultimo_snap
    while True:
        t = datetime.now().isoformat(timespec="seconds")
        snap = {s["nome"]: checar(s) for s in SERVICOS}
        for nome, st in snap.items():
            try: checar_down_grave(nome, st)
            except Exception: pass
        for nome, st in snap.items():
            ant = _ultimo_estado.get(nome, {}).get("status")
            if ant == "ok" and st["status"] == "down":
                alertar(nome, ant, st["status"])
            _ultimo_estado[nome] = st
        with lock:
            estado["ts"], estado["servicos"] = t, snap
        (DATA/"health.json").write_text(json.dumps(estado, ensure_ascii=False))
        if time.time() - _ultimo_snap >= SNAPSHOT:
            with (DATA/"metrics.jsonl").open("a") as f:
                f.write(json.dumps({"ts": t, "servicos": snap}, ensure_ascii=False) + "\n")
            _ultimo_snap = time.time()
        time.sleep(INTERVALO)






# ═══════════════ CHAT DO PAINEL — HUMANIZADO ═══════════════
CHAT_HIST = DATA / "chat.jsonl"

def _chat_ok(msg, dados=None):  return {"ok": True,  "msg": msg, "dados": dados or {}}
def _chat_erro(msg):            return {"ok": False, "msg": msg}

def _h_resumo():
    with lock: sv = dict(estado.get("servicos") or {})
    ok = sum(1 for v in sv.values() if v.get("status")=="ok")
    tot = len(sv)
    n24 = len(_ler_metrics(24))
    if tot == 0:
        return _chat_ok("Ainda estou começando a olhar o sistema. Volto em 15 segundos com o primeiro retrato.")
    if ok == tot:
        return _chat_ok(f"Tudo funcionando: os {tot} serviços estão no ar.\n\nNos últimos minutos registrei {n24} leituras. Quer ver o que sugiro fazer? Digite *sugestões*.")
    faltam = tot - ok
    return _chat_ok(f"Tem {faltam} serviço(s) fora do ar de {tot}. Digite *status* para ver quais.")

def _h_status():
    with lock: sv = dict(estado.get("servicos") or {})
    if not sv: return _chat_ok("Ainda não tenho leituras. Aguarde uns 15 segundos.")
    linhas = []
    for n, v in sv.items():
        if v.get("status") == "ok":
            linhas.append(f"✓ {n}")
        else:
            linhas.append(f"✗ {n} — precisa atenção")
    cabe = "Está tudo certo:" if all(v.get("status")=="ok" for v in sv.values()) else "Tem coisa pedindo atenção:"
    return _chat_ok(f"{cabe}\n\n" + "\n".join(linhas))

def _h_sugestoes():
    if not SUG_PATH.exists():
        return _chat_ok("Ainda estou analisando. Em meio minuto tenho sugestões pra você.")
    ultima = None
    for ln in SUG_PATH.read_text().splitlines()[-5:]:
        try: ultima = json.loads(ln)
        except: pass
    if not ultima: return _chat_ok("Sem sugestões no momento.")
    arr = ultima.get("sugestoes", [])
    if not arr:
        return _chat_ok("Nada urgente pra fazer agora. Sistema redondo.")
    linhas = []
    for s in arr[:4]:
        pri = s.get("pri","")
        msg = s.get("msg_cz") or s.get("msg","")
        emoji = "🔴" if pri=="alta" else "🟢" if pri=="pronto" else "🟡" if pri=="média" else "💡"
        linhas.append(f"{emoji} {msg}")
    return _chat_ok("O que eu sugiro:\n\n" + "\n\n".join(linhas))

def _h_uptime(h=24):
    am = _ler_metrics(h)
    if not am: return _chat_ok(f"Ainda não tenho leituras das últimas {h} horas.")
    sv = list(am[-1].get("servicos", {}).keys())
    piores = []
    for s in sv:
        u = _uptime(am, s)
        if u < 0.99:
            piores.append((s, round((1-u)*100, 1)))
    if not piores:
        return _chat_ok(f"Nas últimas {h} horas, todos os serviços ficaram de pé o tempo todo. Sem quedas.")
    linhas = [f"• {s} ficou fora {p}% do tempo" for s, p in piores]
    return _chat_ok(f"Alguns serviços oscilaram nas últimas {h} horas:\n\n" + "\n".join(linhas))

def _h_latencia():
    am = _ler_metrics(1)
    if not am: return _chat_ok("Ainda não medi nada na última hora.")
    pior = None; pior_v = 0
    for s in am[-1].get("servicos", {}).keys():
        l = _lat(am, s)
        if l > pior_v: pior_v = l; pior = s
    if not pior: return _chat_ok("Sem dados de tempo de resposta agora.")
    if pior_v < 5:
        return _chat_ok(f"Está tudo rápido. O mais lento é {pior} com {round(pior_v,1)} ms.")
    if pior_v < 20:
        return _chat_ok(f"Tudo dentro do normal. O mais lento é {pior} com {round(pior_v,1)} ms.")
    return _chat_ok(f"O {pior} está respondendo em {round(pior_v,1)} ms — um pouco devagar. Vale acompanhar.")

def _h_modelos():
    try:
        req = urllib.request.Request("http://127.0.0.1:4000/v1/models")
        with urllib.request.urlopen(req, timeout=3) as r:
            d = json.loads(r.read())
        n = len(d.get("data", []))
        return _chat_ok(f"Tenho {n} modelos disponíveis, prontos pra atender pedidos. Quer ver a lista? Digite *modelos detalhado*.")
    except Exception:
        return _chat_ok("Não consegui falar com o LiteLLM agora. Ele pode estar reiniciando.")

def _h_provedores():
    env = Path.home() / ".hermes_env"
    chaves = ["GROQ_API_KEY","NVIDIA_API_KEY","OPENROUTER_API_KEY",
              "ANTHROPIC_API_KEY","GEMINI_API_KEY","CEREBRAS_API_KEY"]
    ativos = []
    if env.exists():
        txt = env.read_text()
        for k in chaves:
            if re.search(rf'^export\s+{k}=.+', txt, re.M):
                ativos.append(k.replace("_API_KEY",""))
    if not ativos:
        return _chat_ok("Nenhum provedor externo configurado. Só o fogão local está disponível.")
    return _chat_ok(f"Tenho {len(ativos)} fornecedores conectados: {', '.join(ativos)}.\n\nOs outros ficam para depois — não são urgentes.")

def _h_alertas():
    if not (DATA/"alerts.jsonl").exists():
        return _chat_ok("Nenhum alerta registrado até agora. Tudo calmo.")
    ult = (DATA/"alerts.jsonl").read_text().splitlines()[-5:]
    linhas = []
    for ln in ult:
        try:
            o = json.loads(ln)
            linhas.append("• " + o.get("msg","")[:80])
        except: pass
    if not linhas: return _chat_ok("Nenhum alerta recente.")
    return _chat_ok("Últimos avisos:\n\n" + "\n".join(linhas))

def _h_escala():
    n24 = len(_ler_metrics(24)); alvo = 1440
    falta = max(alvo - n24, 0)
    h = round(falta/60, 1)
    if falta == 0:
        return _chat_ok("Já dá pra fazer o sistema prever problemas sozinho. Fase pronta.")
    return _chat_ok(
        f"Estou na fase de aprendizado.\n\n"
        f"Faltam cerca de {h} horas de observação pra eu conseguir prever problemas antes deles acontecerem.\n\n"
        "Enquanto isso, o sistema já está no ar e funcionando normalmente."
    )

def _h_logs(alvo="watchdog"):
    mapa = {
        "watchdog": Path("/tmp/hermes-watchdog.log"),
        "litellm": Path.home()/".config/litellm/proxy.log",
        "daemon": BASE/"logs/daemon-stdout.log",
    }
    f = mapa.get(alvo)
    if not f or not f.exists():
        return _chat_ok(f"Não tenho registro de '{alvo}'. Posso te mostrar: {', '.join(mapa.keys())}.")
    linhas = f.read_text(errors="ignore").splitlines()[-8:]
    return _chat_ok(f"Últimas linhas do '{alvo}':\n\n" + "\n".join(linhas))

def _h_secao(nome):
    M = {
        "visão":"Resumo geral do painel — contadores e estado rápido.",
        "alertas":"Aqui ficam os avisos que o sistema detectou.",
        "serviços":"Lista dos serviços que estou monitorando.",
        "modelos":"Modelos de IA disponíveis pra responder.",
        "provedores":"De onde vêm as respostas (fornecedores externos e local).",
        "logs":"Registros de atividade recente.",
        "escala":"Plano de crescimento em 4 fases.",
        "sugestões":"Minhas recomendações do dia.",
    }
    n = nome.lower().strip()
    for k, v in M.items():
        if n in k or k in n:
            return _chat_ok(f"*{k.capitalize()}* — {v}")
    return _chat_ok("Posso explicar: " + ", ".join(M.keys()) + ".")

def _h_ajuda():
    return _chat_ok(
        "Posso te ajudar com:\n\n"
        "• *resumo* — como está tudo agora\n"
        "• *status* — quais serviços estão no ar\n"
        "• *sugestões* — o que vale fazer hoje\n"
        "• *escala* — quanto falta pra próxima etapa\n"
        "• *uptime* — quem oscilou nas últimas horas\n"
        "• *latência* — quem está mais lento\n"
        "• *modelos* — quantos modelos tenho\n"
        "• *provedores* — de onde vêm as respostas\n"
        "• *alertas* — avisos recentes\n"
        "• *logs* — registros de atividade\n"
        "• *reiniciar daemon* — reinicia um serviço\n\n"
        "Ou pergunte com suas palavras — eu tento entender."
    )

def _h_reanalisar():
    try:
        analisar_evolucao()
        return _h_sugestoes()
    except Exception as e:
        return _chat_erro(f"Não consegui refazer a análise: {e}")

def _h_reiniciar(sv):
    sv = (sv or "").strip().lower()
    mapa = {
        "daemon":   ("cmd", f"pkill -9 -f daemon.py; sleep 1; cd {BASE} && nohup python3 -u daemon.py > logs/daemon-stdout.log 2>&1 &"),
        "watchdog": ("launchd", "ai.hermes.watchdog-os"),
        "litellm":  ("cmd", "kill $(cat ~/.config/litellm/proxy.pid 2>/dev/null) 2>/dev/null; sleep 2; nohup litellm --config ~/.config/litellm/litellm_config.yaml --port 4000 > ~/.config/litellm/proxy.log 2>&1 & echo $! > ~/.config/litellm/proxy.pid"),
        "ollama":   ("cmd", "pkill -x ollama; sleep 2; nohup ollama serve > /tmp/ollama.log 2>&1 &"),
    }
    if sv not in mapa:
        return _chat_ok(f"Ainda não sei reiniciar '{sv}'. Posso reiniciar: daemon, watchdog, litellm ou ollama.")
    tipo, cmd = mapa[sv]
    try:
        if tipo == "launchd":
            subprocess.Popen(["launchctl","kickstart","-k", f"gui/{os.getuid()}/{cmd}"])
        else:
            subprocess.Popen(["bash","-lc", cmd])
        return _chat_ok(f"Ok, reiniciei o {sv}. Em uns 5 segundos deve estar de pé — me pergunte *status* pra confirmar.")
    except Exception as e:
        return _chat_erro(f"Não consegui reiniciar o {sv}: {e}")


def _chat_dispatch(texto):
    t = (texto or "").strip()
    if not t: return _chat_erro("Me diga o que você quer saber.")
    low = t.lower()

    if any(k in low for k in ("ajuda","help","comandos","o que você faz","?")): return _h_ajuda()
    if any(k in low for k in ("resumo","visão","visao","overview","como está","como esta","tudo bem")): return _h_resumo()
    if any(k in low for k in ("status","saúde","saude","serviços","servicos","no ar","estão","estao")): return _h_status()
    if "modelo" in low:
        if "detalh" in low or "lista" in low:
            try:
                req = urllib.request.Request("http://127.0.0.1:4000/v1/models")
                with urllib.request.urlopen(req, timeout=3) as r:
                    d = json.loads(r.read())
                ids = [m.get("id","") for m in d.get("data",[])]
                return _chat_ok("Modelos disponíveis:\n\n" + "\n".join(f"• {i}" for i in ids))
            except Exception as e:
                return _chat_erro(f"Não consegui listar: {e}")
        return _h_modelos()
    if "provedor" in low or "fornecedor" in low: return _h_provedores()
    if "alerta" in low or "aviso" in low: return _h_alertas()
    if "sugest" in low or "recomend" in low or "o que fazer" in low or "o que devo" in low: return _h_sugestoes()
    if "reanal" in low or "atualiz" in low: return _h_reanalisar()
    if "uptime" in low or "quedas" in low or "caiu" in low:
        m = re.search(r"(\d+)", low); return _h_uptime(int(m.group(1)) if m else 24)
    if "latên" in low or "laten" in low or "lento" in low or "rápido" in low: return _h_latencia()
    if "escala" in low or "fase" in low or "progresso" in low or "quanto falta" in low: return _h_escala()
    if "log" in low or "registro" in low:
        partes = low.split(); return _h_logs(partes[1] if len(partes)>1 else "watchdog")
    if low.startswith("reinic") or low.startswith("restart") or "reiniciar" in low:
        partes = re.sub(r"(reinic\w*|restart)", "", low).strip().split()
        return _h_reiniciar(partes[0] if partes else "")
    if low.startswith("seção") or low.startswith("secao") or low.startswith("aba "):
        partes = t.split(maxsplit=1)
        return _h_secao(partes[1] if len(partes)>1 else "")

    try:
        body = json.dumps({
            "model": os.environ.get("OLLAMA_MODEL","llama3.2:1b"),
            "messages":[{"role":"system","content":"Você é um assistente amigável do painel Hermes OS. Responda curto, humano, direto. Sem jargão técnico."},
                        {"role":"user","content":t}], "stream": False
        }).encode()
        req = urllib.request.Request("http://127.0.0.1:11434/api/chat",
            data=body, headers={"Content-Type":"application/json"})
        with urllib.request.urlopen(req, timeout=20) as r:
            j = json.loads(r.read())
            resp = j.get("message",{}).get("content","")
            if resp: return _chat_ok(resp, {"via":"ollama"})
    except Exception:
        pass

    return _chat_ok("Não entendi muito bem. Tenta *ajuda* pra ver o que eu sei fazer, ou pergunta de outro jeito.")


def chat_handler(body):
    try:
        msg = body.get("msg","")
        r = _chat_dispatch(msg)
        with CHAT_HIST.open("a") as f:
            f.write(json.dumps({"ts":datetime.now().isoformat(timespec="seconds"),
                                "user":msg,"bot":r.get("msg",""),"ok":r.get("ok",False)},
                               ensure_ascii=False)+"\n")
        return r
    except Exception as e:
        return _chat_erro(f"Tive um problema aqui: {e}")


class H(BaseHTTPRequestHandler):
    daemon_threads = True
    def log_message(self, *a): pass
    def _json(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.end_headers()

    def do_POST(self):
        u = urlparse(self.path)
        if u.path == "/api/chat":
            ln = int(self.headers.get("Content-Length", 0))
            try: body = json.loads(self.rfile.read(ln).decode() or "{}")
            except Exception: return self._json({"ok":False,"msg":"Formato inválido"},400)
            return self._json(chat_handler(body))
        self._json({"erro":"not found"},404)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/api/health":
            with lock: return self._json(estado)
        if u.path == "/api/metrics":
            horas = int(parse_qs(u.query).get("hours", [24])[0])
            corte = datetime.now() - timedelta(hours=horas)
            out = []
            arq = DATA / "metrics.jsonl"
            if arq.exists():
                for ln in arq.read_text().splitlines():
                    try:
                        o = json.loads(ln)
                        if datetime.fromisoformat(o["ts"]) >= corte: out.append(o)
                    except Exception: pass
            return self._json({"hours": horas, "count": len(out), "data": out})
        if u.path == "/api/stream":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            ult = ""
            try:
                while True:
                    with lock: atual = dict(estado)
                    if atual["ts"] != ult:
                        ult = atual["ts"]
                        self.wfile.write(f"data: {json.dumps(atual, ensure_ascii=False)}\n\n".encode())
                        self.wfile.flush()
                    time.sleep(5)
            except (BrokenPipeError, ConnectionResetError): pass
            return
        if u.path == "/api/sugestoes":
            lim = int(parse_qs(u.query).get("n", ["20"])[0])
            ultimo = {"ts":"","origem":"","sugestoes":[]}
            if SUG_PATH.exists():
                for ln in SUG_PATH.read_text().splitlines()[-lim:]:
                    try: ultimo = json.loads(ln)
                    except Exception: pass
            return self._json(ultimo)
        if u.path == "/api/sugestoes/historico":
            lim = int(parse_qs(u.query).get("n", ["30"])[0])
            out = []
            if SUG_PATH.exists():
                for ln in SUG_PATH.read_text().splitlines()[-lim:]:
                    try: out.append(json.loads(ln))
                    except Exception: pass
            return self._json(out)

        self._json({"erro": "not found",
                    "paths": ["/api/health", "/api/metrics", "/api/stream"]}, 404)


if __name__ == "__main__":
    threading.Thread(target=coletar, daemon=True).start()
    threading.Thread(target=loop_evolucao, daemon=True).start()
    print(f"[watchdog] http://127.0.0.1:{PORTA}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORTA), H).serve_forever()
