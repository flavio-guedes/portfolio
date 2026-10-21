import os, json
from http.server import HTTPServer, BaseHTTPRequestHandler

PASTA = "/Users/mac/hermes-work"
PORTA = 8440

def load(nome):
    p = os.path.join(PASTA, nome)
    if not os.path.exists(p): return None
    try:
        with open(p, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        return {"erro": str(e)}

def juntar():
    """Junta campanhas.json com campanhas-email.json pelo id."""
    base = load('campanhas.json') or []
    emails = load('campanhas-email.json') or {}
    mapa_email = {}
    if isinstance(emails, dict) and 'campanhas' in emails:
        for c in emails['campanhas']:
            if c.get('id'): mapa_email[c['id']] = c
    saida = []
    for c in (base if isinstance(base, list) else []):
        cid = c.get('id')
        if cid in mapa_email:
            c['mensagens'] = mapa_email[cid].get('etapas') or {}
        saida.append(c)
    return saida

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, obj, c=200):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(c)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b)
    def do_GET(self):
        if self.path == '/api/ping':
            self._send({'ok': True, 'pasta': PASTA})
        elif self.path == '/api/campanhas':
            self._send(juntar())
        elif self.path == '/api/campanhas-email':
            self._send(load('campanhas-email.json'))
        elif self.path == '/api/campanha-ia':
            self._send(load('campanha-ia.json'))
        else:
            self._send({'erro': 'use /api/campanhas'}, 404)

if __name__ == '__main__':
    print('Rodando em http://127.0.0.1:' + str(PORTA))
    print('Pasta: ' + PASTA)
    HTTPServer(('127.0.0.1', PORTA), H).serve_forever()
