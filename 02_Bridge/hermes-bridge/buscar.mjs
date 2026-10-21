// Rota /api/buscar — separada pra não arriscar o bridge principal
import fs from 'node:fs';

const DATA='/Users/mac/Library/CloudStorage/GoogleDrive-flavioguedesmkt@gmail.com/Meu Drive/_Profissional/_Planejamento profissional /_Prospeccao/00 - Setup Comercial/00 - Painel/hermes-data.js';

function lerBase(){
  try{
    const txt=fs.readFileSync(DATA,'utf8');
    const m=txt.match(/window\.HERMES_DATA\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
    if(m){const j=JSON.parse(m[1]);return j.opportunities||j.leads||[];}
  }catch(e){console.log('[buscar] erro base:',e.message);}
  return [];
}

function filtra(lista, f){
  if(!f || !Object.keys(f).length) return lista;
  return lista.filter(o=>{
    for(const k in f){
      const v=String(f[k]).toLowerCase();
      const val=String(o[k]||'').toLowerCase();
      if(val.indexOf(v)<0) return false;
    }
    return true;
  });
}

async function webSearch(q){
  try{
    const m=await import('@purili/web-search');
    const r=await m.purili.search(q);
    const out=[];
    (r.results||[]).slice(0,12).forEach((x,i)=>{
      out.push({id:'WEB-'+i,empresa:(x.title||'').slice(0,80),contato:'-',canal:'Web',url:x.url,status_crm:'web'});
    });
    return out;
  }catch(e){console.log('[buscar] web erro:',e.message);return [];}
}

function lerHistorico(f){
  try{
    const F='/tmp/wa-historico.jsonl';
    if(!fs.existsSync(F)) return [];
    const linhas=fs.readFileSync(F,'utf8').split('\n').filter(Boolean);
    const kws=Object.values(f).map(x=>String(x).toLowerCase()).filter(Boolean);
    const contatos={};
    linhas.forEach(l=>{
      try{
        const m=JSON.parse(l);
        const txt=(m.text||'').toLowerCase();
        if(kws.length && !kws.every(k=>txt.indexOf(k)>=0)) return;
        const num=(m.jid||'').split('@')[0].replace(/\D/g,'');
        if(!num) return;
        if(!contatos[num] || m.ts>contatos[num].ts){
          contatos[num]={id:'WA-H-'+num,empresa:m.pushName||num,contato:m.pushName||num,canal:'WhatsApp',telefone:num,segmento:f.segmento||'—',regiao:f.regiao||'—',texto:m.text,ts:m.ts,status_crm:'historico'};
        }
      }catch(e){}
    });
    return Object.values(contatos).sort((a,b)=>b.ts-a.ts).slice(0,30);
  }catch(e){console.log('[buscar] historico erro:',e.message);return [];}
}

export async function handleBuscar(req, res, SNAP){
  let body='';
  req.on('data',c=>body+=c);
  req.on('end',async()=>{
    try{
      const b=JSON.parse(body||'{}');
      const f=b.filtros||{};

      // 1) base local
      let base=lerBase();
      if(!Array.isArray(base)) base=[];
      let out=filtra(base,f);

      // 2) histórico WhatsApp (mensagens capturadas)
      const hist=lerHistorico(f);
      hist.forEach(h=>out.push(h));
      const convs=(SNAP&&SNAP.conversas_top)||[];
      convs.forEach(c=>{
        let ok=true;
        for(const k in f){
          const v=String(f[k]).toLowerCase();
          const val=String(c[k]||'').toLowerCase();
          if(val.indexOf(v)<0){ok=false;break;}
        }
        if(ok) out.push({id:'WA-'+(c.id||Math.random()),empresa:c.contato||c.empresa||'-',contato:c.contato||'-',canal:'WhatsApp',segmento:c.segmento||f.segmento||'-',status_crm:'historico'});
      });

      // 3) web (só se base+whats insuficientes)
      if(out.length<10 && (f.segmento||f.oferta)){
        const q=[f.segmento,f.oferta,f.regiao||'Brasil','linkedin contato whatsapp'].filter(Boolean).join(' ');
        const web=await webSearch(q);
        out=out.concat(web);
      }

      res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
      res.end(JSON.stringify({leads:out.slice(0,80),total:out.length,fontes:{base:base.length,whats:convs.length}}));
    }catch(e){
      res.writeHead(500,{'Content-Type':'application/json'});
      res.end(JSON.stringify({error:String(e)}));
    }
  });
}
