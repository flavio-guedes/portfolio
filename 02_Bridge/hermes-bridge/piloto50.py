import base64, gzip, csv, io, re, json, time, urllib.request, sys, os, urllib.error

PANEL = sys.argv[1]
HTML  = open(PANEL).read()
b64   = re.search(r"LEADS_PAYLOAD_B64='([^']+)'", HTML).group(1)
raw   = gzip.decompress(base64.b64decode(b64)).decode('utf-8')
rows  = list(csv.DictReader(io.StringIO(raw)))

MAX      = 50
INTERVAL = 20 * 60        # 20 minutos entre cada envio
STOP_FAIL = 3             # para depois de 3 falhas seguidas
BRIDGE   = 'http://127.0.0.1:8420'
TOKEN    = 'hermes123'

# números já contatados no piloto anterior
ja_enviados = set()
for f in ['/tmp/hermes-piloto.log', '/tmp/hermes-piloto50.log']:
    if os.path.exists(f):
        for line in open(f):
            m = re.search(r'(?:OK|ENVIANDO)\s+\d*/*\d*\s*(55\d{10,13})', line)
            if m: ja_enviados.add(m.group(1))
print(f'[+] já contatados: {len(ja_enviados)}', flush=True)

GM = {'TIER 1':'A','TIER 2':'B','TIER 6':'C'}
def norm(t):
    d = ''.join(c for c in str(t or '') if c.isdigit())
    if d.startswith('55') and len(d) > 11: d = d[2:]
    return '55'+d if d else ''

MSG = ('Oi {nome}, tudo bem? Vi que você está em {empresa} ({segmento}). '
       'Trabalho com operações comerciais e IA aplicada — ajudo empresas a '
       'organizar prospecção e atendimento com dado, sem virar bagunça. '
       'Faz sentido uma conversa rápida de 15 min essa semana? — Flávio')

cand = [x for x in rows
        if GM.get(x.get('Tier','')) == 'A'
        and (int(x.get('Score composto','0') or 0) >= 40)
        and norm(x.get('WhatsApp') or x.get('Telefone'))
        and 'vaga' not in (x.get('Categoria') or '').lower()]
cand.sort(key=lambda x: -int(x.get('Score composto','0') or 0))
cand = [x for x in cand if norm(x.get('WhatsApp') or x.get('Telefone')) not in ja_enviados][:MAX]

print(f'[+] {len(cand)} leads na fila · intervalo {INTERVAL//60} min · total ~{len(cand)*INTERVAL//3600}h{len(cand)*INTERVAL%3600//60:02d}', flush=True)

def bridge_ok():
    try:
        req = urllib.request.Request(BRIDGE+'/status',
            headers={'Authorization':'Bearer '+TOKEN})
        d = json.loads(urllib.request.urlopen(req, timeout=10).read())
        return d.get('state') == 'open'
    except Exception: return False

falhas_seguidas = 0
enviados = 0
for i, x in enumerate(cand, 1):
    tel  = norm(x.get('WhatsApp') or x.get('Telefone'))
    nome = (x.get('Nome') or '').split(' ')[0]
    msg  = (MSG.replace('{nome}', nome)
               .replace('{empresa}', x.get('Empresa') or x.get('Nome') or '')
               .replace('{segmento}', x.get('Categoria') or 'seu setor'))
    empresa = (x.get('Empresa') or x.get('Nome') or '')[:40]

    if not bridge_ok():
        print(f'[{time.strftime("%H:%M:%S")}] !! WhatsApp caiu — parando em {i-1}/{len(cand)}', flush=True)
        break

    body = json.dumps({'number': tel, 'message': msg}).encode()
    req  = urllib.request.Request(BRIDGE+'/send', data=body,
        headers={'Content-Type':'application/json','Authorization':'Bearer '+TOKEN})
    ts = time.strftime('%H:%M:%S')
    try:
        r = urllib.request.urlopen(req, timeout=30)
        print(f'[{ts}] OK {i}/{len(cand)} {tel} · {empresa} · {r.read()[:60].decode(errors="ignore")}', flush=True)
        enviados += 1
        falhas_seguidas = 0
    except urllib.error.HTTPError as e:
        print(f'[{ts}] FALHA {i}/{len(cand)} {tel} HTTP {e.code}', flush=True)
        falhas_seguidas += 1
        if e.code in (401, 403):
            print('!! token/autenticação falhou — parando', flush=True); break
    except Exception as e:
        print(f'[{ts}] ERRO {i}/{len(cand)} {tel} {e}', flush=True)
        falhas_seguidas += 1

    if falhas_seguidas >= STOP_FAIL:
        print(f'!! {STOP_FAIL} falhas seguidas — parando em {i}/{len(cand)}', flush=True); break
    if i < len(cand):
        time.sleep(INTERVAL)

print(f'[+] FIM · {enviados}/{len(cand)} enviados', flush=True)
