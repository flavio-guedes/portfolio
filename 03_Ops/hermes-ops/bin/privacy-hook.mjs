import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const L = path.join(os.homedir(),'hermes-ops','logs');
const OUT = path.join(os.homedir(),'hermes-ops','state','privacy.json');
const RE_FONE = /\b\d{10,13}\b/;
const RE_LEAD = /(Alexsandro|Robson|Wagner|Jean|Leandro|Aline)/i;

const check = () => {
  let violacao = false, amostra = null;
  try {
    const f = path.join(L, 'backend.out.log');
    if (fs.existsSync(f)) {
      const tail = fs.readFileSync(f,'utf8').slice(-50000);
      if (RE_FONE.test(tail) && /prompt|ollama|llm/i.test(tail)) {
        violacao = true;
        amostra = tail.slice(-300);
      }
    }
  } catch {}
  try {
    fs.writeFileSync(OUT, JSON.stringify({ t: new Date().toISOString(), violacao, amostra }, null, 2));
  } catch {}
};
check();
setInterval(check, 120000);
console.log('privacy-hook ativo · tick 120s');
