const http = require('http');
const fs   = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const RAG  = path.join(RAIZ, 'rag');
const HERMES_URL   = 'http://localhost:11434/v1/chat/completions';
const HERMES_MODEL = 'qwen2.5:7b';

const RAGS = [
  'rag-hermes.md',
  'rag-captura.md',
  'rag-fila.md',
  'rag-mensagens.md',
  'rag-whatsapp.md',
  'rag-whatsapp-continuo.md'
];

function lerArquivo(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

function montarContexto() {
  const partes = RAGS.map(a => {
    const t = lerArquivo(path.join(RAG, a));
    return t ? `### ${a}\n${t}` : null;
  }).filter(Boolean);
  return partes.length ? `\n\n---\nContexto do projeto:\n${partes.join('\n\n')}\n---\n` : '';
}

async function chamarQwen(msg) {
  const corpo = {
    model: HERMES_MODEL,
    options: { num_ctx: 32768 },
    messages: [
      { role: 'system', content: 'Você é o Hermes, operador do painel. Siga os RAGs do contexto. Falha de gate para e reporta.' },
      { role: 'user', content: msg + montarContexto() }
    ],
    stream: false
  };
  const r = await fetch(HERMES_URL, {
      signal: AbortSignal.timeout(15000),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  });
  const d = await r.json();
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return d.choices[0].message.content;
}

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = req.url.split('?')[0];

  // Proxy para a bridge WhatsApp (evita CORS do navegador)
  if (url === '/api/whatsapp/send' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const r = await fetch('http://localhost:3000/send', {
      signal: AbortSignal.timeout(15000),
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
        });
        const d = await r.text();
        res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(d);
      } catch (e) {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { msg } = JSON.parse(body);
        const resposta = await chamarQwen(msg);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ resposta }));
      } catch (e) {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ erro: e.message }));
      }
    });
    return;
  }

  let file;
  if (url.startsWith('/rag/'))  file = path.join(RAIZ, url);
  else if (url === '/')          file = path.join(RAIZ, 'painel', 'Painel_Hermes_V10.html');
  else                           file = path.join(RAIZ, url);

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('não achei'); return; }
    const ext = path.extname(file);
    const tipo = {'.html':'text/html','.md':'text/markdown','.js':'text/javascript'}[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': tipo + '; charset=utf-8' });
    res.end(data);
  });
}).listen(8420, '127.0.0.1', () => console.log('Hermes em http://127.0.0.1:8420'));
