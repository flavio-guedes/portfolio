import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const S = path.join(os.homedir(),'hermes-ops','state');
const L = path.join(os.homedir(),'hermes-ops','logs','agent.jsonl');
const TOK = 'hk_dev_local_troque_depois';

const tick = () => {
  const t = new Date().toISOString();
  let srv=false, wa="?", fila="?", ollama=false;
  try { srv = !!(execSync("lsof -nP -iTCP:8420 -sTCP:LISTEN 2>/dev/null || true",{encoding:"utf8"}).trim()); } catch{}
  try { srv = !!execSync('pgrep -f "hermes-work/hermes-os/backend/src/server.js" || true',{encoding:'utf8'}).trim(); } catch{}
  try { ollama = !!execSync('pgrep -fl ollama 2>/dev/null || true',{encoding:'utf8'}).trim(); } catch{}
  try { wa = execSync('curl -s -m2 -H "Authorization: Bearer ' + TOK + '" http://127.0.0.1:8420/api/whatsapp/status || echo "{}"',{encoding:'utf8'}).trim(); } catch{}
  try { fila = execSync('curl -s -m2 -H "Authorization: Bearer ' + TOK + '" http://127.0.0.1:8420/api/fila/status || echo "{}"',{encoding:'utf8'}).trim(); } catch{}
  const linha = { t, srv, ollama, wa: wa.slice(0,200), fila: fila.slice(0,200) };
  try { fs.appendFileSync(L, JSON.stringify(linha)+'\n'); } catch {}
  try { fs.writeFileSync(path.join(S,'live.json'), JSON.stringify(linha,null,2)); } catch {}
};
tick();
setInterval(tick, 60000);
console.log('agent-watchdog ativo · tick 60s');
