#!/usr/bin/env node
// Lê a base embutida no Painel_Hermes_Teste.html e envia snapshot ao bridge.
// Independente do navegador: roda headless, sobrevive a painel fechado.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://127.0.0.1:8421/snapshot';
const INTERVAL = 30000;

function findPanel() {
  if (process.env.PANEL_PATH && fs.existsSync(process.env.PANEL_PATH)) return process.env.PANEL_PATH;
  try {
    const out = execSync(
      `find "/Users/mac/Library/CloudStorage/GoogleDrive-flavioguedesmkt@gmail.com/Meu Drive" -maxdepth 8 -name "Painel_Hermes_Teste.html" 2>/dev/null | head -1`,
      { encoding: 'utf8', timeout: 15000 }
    ).trim();
    return out || null;
  } catch { return null; }
}

function decodeEntities(s) {
  if (!s) return '';
  return String(s).replace(/&aacute;/g,'á').replace(/&eacute;/g,'é').replace(/&iacute;/g,'í')
    .replace(/&oacute;/g,'ó').replace(/&uacute;/g,'ú').replace(/&atilde;/g,'ã')
    .replace(/&otilde;/g,'õ').replace(/&ccedil;/g,'ç').replace(/&acirc;/g,'â')
    .replace(/&ecirc;/g,'ê').replace(/&ocirc;/g,'ô').replace(/&nbsp;/g,' ')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
}

function parseCSV(text) {
  const rows = []; let cur = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (c === '\r') {}
      else field += c;
    }
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}
function rowsToObjects(rows) {
  if (!rows.length) return [];
  const h = rows[0].map(x => x.replace(/^\uFEFF/, '').trim());
  return rows.slice(1).filter(r => r.some(c => c && String(c).trim() !== '')).map(r => {
    const o = {}; h.forEach((k, i) => o[k] = (r[i] ?? '').trim()); return o;
  });
}

function extractMock(html) {
  const start = html.indexOf('const MOCK=');
  if (start < 0) throw new Error('MOCK não encontrado');
  const after = html.slice(start + 'const MOCK='.length);
  // Encontra o `};` de fechamento no nível zero
  let depth = 0, inStr = null, esc = false, end = -1;
  for (let i = 0; i < after.length; i++) {
    const c = after[i];
    if (esc) { esc = false; continue; }
    if (inStr) {
      if (c === '\\') esc = true;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0 && c === '}') { end = i + 1; break; }
    }
  }
  if (end < 0) throw new Error('fim do MOCK não encontrado');
  const str = after.slice(0, end);
  return new Function('return (' + str + ')')();
}

async function buildSnapshot() {
  const panel = findPanel();
  if (!panel) throw new Error('Painel_Hermes_Teste.html não encontrado');
  const html = fs.readFileSync(panel, 'utf8');

  const mock = extractMock(html);

  // Extrai payload da base embutida
  let leadsTotal = 0, quentes = [], grupos = { A: 0, B: 0, C: 0 };
  const b64Match = html.match(/const LEADS_PAYLOAD_B64='([^']+)'/);
  if (b64Match) {
    try {
      const gz = Buffer.from(b64Match[1], 'base64');
      const csv = zlib.gunzipSync(gz).toString('utf8');
      const rows = rowsToObjects(parseCSV(csv));
      leadsTotal = rows.length;
      const GRUPO_MAP = { 'TIER 1': 'A', 'TIER 2': 'B', 'TIER 6': 'C' };
      rows.forEach(r => {
        const g = GRUPO_MAP[r['Tier']] || 'C';
        grupos[g]++;
        const score = parseInt(r['Score composto'] || r['Score'] || '0', 10) || 0;
        const cat = r['Categoria'] || '';
        const temp = (cat === 'Vaga/Contratação' && score > 0) ? 'Quente' : score >= 35 ? 'Quente' : score >= 15 ? 'Morno' : 'Frio';
        if (temp === 'Quente') {
          const nome = r['Nome'] || '(sem nome)';
          quentes.push({
            empresa: (r['Empresa'] || nome).slice(0, 60),
            score,
            canal: r['WhatsApp'] ? 'WhatsApp' : r['LinkedIn'] ? 'LinkedIn' : 'E-mail'
          });
        }
      });
      quentes.sort((a, b) => b.score - a.score);
    } catch (e) { console.error('CSV:', e.message); }
  }

  // Ações / campanhas / conversas do MOCK
  const acts = mock.actions || [];
  const hoje = new Date().toISOString().slice(0, 10);
  const fila = acts.filter(a => ['PRONTO', 'AGENDADO', 'EXECUTANDO'].includes(a.status)).length;
  const atras = acts.filter(a => {
    if (!['PRONTO', 'AGENDADO'].includes(a.status)) return false;
    if (!a.prazo) return false;
    return String(a.prazo).slice(0, 16) < new Date().toISOString().slice(0, 16);
  }).length;
  const erros = acts.filter(a => a.status === 'ERRO').length;
  const bloq = acts.filter(a => a.status === 'BLOQUEADO').length;
  const envHoje = acts.filter(a => a.status === 'ENVIADO' && String(a.enviado_em || '').slice(0, 10) === hoje).length;

  const camps = (mock.campaigns || []).filter(c => !c.sugestao && c.status === 'EM EXECUÇÃO').map(c => {
    const m = c.metricas || {};
    return { nome: c.nome, enviados: m.enviados || 0, respostas: m.respondidos || 0, reunioes: m.reunioes || 0 };
  });

  const convs = (mock.conversations || []).filter(c => c.precisa_resposta).map(c => ({
    contato: c.contato, canal: c.canal, texto: String(c.ultimo_texto || '').slice(0, 80)
  }));

  return {
    at: new Date().toISOString(),
    leads: leadsTotal,
    fila, atrasadas: atras, erros, bloqueadas: bloq,
    enviadas_hoje: envHoje,
    quentes: quentes.length,
    quentes_top: quentes.slice(0, 5),
    campanhas: camps,
    recomendadas: 0,
    conversas_pendentes: convs.length,
    conversas_top: convs.slice(0, 5),
    grupos
  };
}

async function push() {
  try {
    const snap = await buildSnapshot();
    const r = await fetch(BRIDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snap)
    });
    if (!r.ok) console.error('POST', r.status);
    else console.log('[' + new Date().toLocaleTimeString('pt-BR') + '] snapshot: ' + snap.leads + ' leads · ' + snap.fila + ' fila · ' + snap.quentes + ' quentes');
  } catch (e) { console.error('push:', e.message); }
}

console.log('Hermes Snapshot Daemon — lê painel HTML headless');
console.log('Bridge:', BRIDGE_URL);
console.log('');
push();
setInterval(push, INTERVAL);
