import base64, gzip, csv, io, re, json, time, urllib.request, sys

HTML = open(sys.argv[1]).read()
b64  = re.search(r"LEADS_PAYLOAD_B64='([^']+)'", HTML).group(1)
raw  = gzip.decompress(base64.b64decode(b64)).decode('utf-8')
rows = list(csv.DictReader(io.StringIO(raw)))

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
cand = cand[:5]

print(f'[+] {len(cand)} leads selecionados', flush=True)
for i, x in enumerate(cand, 1):
    tel  = norm(x.get('WhatsApp') or x.get('Telefone'))
    nome = (x.get('Nome') or '').split(' ')[0]
    msg  = (MSG.replace('{nome}', nome)
               .replace('{empresa}', x.get('Empresa') or x.get('Nome') or '')
               .replace('{segmento}', x.get('Categoria') or 'seu setor'))
    body = json.dumps({'number': tel, 'message': msg}).encode()
    req  = urllib.request.Request(
        'http://127.0.0.1:8420/send', data=body,
        headers={'Content-Type':'application/json',
                 'Authorization':'Bearer hermes123'})
    try:
        r = urllib.request.urlopen(req, timeout=30)
        print(f'[{time.strftime("%H:%M:%S")}] OK {i}/5 {tel} {r.read()[:80].decode(errors="ignore")}', flush=True)
    except Exception as e:
        print(f'[{time.strftime("%H:%M:%S")}] FALHA {i}/5 {tel} {e}', flush=True)
    if i < len(cand):
        print('    aguardando 15 min...', flush=True)
        time.sleep(900)

print('[+] PILOTO CONCLUIDO', flush=True)
