import fs from 'node:fs';
const FILE='/tmp/wa-historico.jsonl';

export function salvar(msg, sock){
  try{
    const jid=msg.key.remoteJid||'';
    const fromMe=!!msg.key.fromMe;
    const m=msg.message||{};
    const text=(m.conversation||(m.extendedTextMessage&&m.extendedTextMessage.text)||'').trim();
    if(!text) return;
    const linha={ts:Date.now(),jid,fromMe,text:text.slice(0,1000),pushName:msg.pushName||''};
    fs.appendFileSync(FILE, JSON.stringify(linha)+'\n');
  }catch(e){}
}

export async function handleHistorico(req,res){
  try{
    const u=new URL(req.url,'http://x');
    const q=(u.searchParams.get('q')||'').toLowerCase();
    const limite=parseInt(u.searchParams.get('limite')||'50',10);
    if(!fs.existsSync(FILE)){res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});return res.end(JSON.stringify({leads:[],total:0}));}
    const linhas=fs.readFileSync(FILE,'utf8').split('\n').filter(Boolean);
    const kws=q?q.split(/\s+/):[];
    const contatos={};
    linhas.forEach(l=>{
      try{
        const m=JSON.parse(l);
        const txt=(m.text||'').toLowerCase();
        if(kws.length && !kws.every(k=>txt.indexOf(k)>=0)) return;
        const jid=m.jid||'';
        const numero=jid.split('@')[0].replace(/\D/g,'');
        const nome=m.pushName||numero||'—';
        const key=numero||nome;
        if(!contatos[key]) contatos[key]={id:'WA-H-'+numero,nome:numero||nome,contato:nome,empresa:'—',canal:'WhatsApp',telefone:numero,segmento:'Imobiliário',regiao:'—',texto:m.text,ts:m.ts,fromMe:m.fromMe,status_crm:'historico'};
        else if(m.ts>contatos[key].ts){contatos[key].texto=m.text;contatos[key].ts=m.ts;}
      }catch(e){}
    });
    const out=Object.values(contatos).sort((a,b)=>b.ts-a.ts).slice(0,limite);
    res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
    res.end(JSON.stringify({leads:out,total:out.length}));
  }catch(e){res.writeHead(500);res.end(JSON.stringify({error:String(e)}))}
}
