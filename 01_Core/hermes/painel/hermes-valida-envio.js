(function(){
  if(window.__validaEnvio) return; window.__validaEnvio=true;
  var API='http://127.0.0.1:8420';
  var TOKEN='hk_dev_local_troque_depois';

  async function ping(){
    try{
      var r=await fetch(API+'/api/ping',{cache:'no-store'});
      return {ok:r.ok,status:r.status,body:await r.text()};
    }catch(e){ return {ok:false,erro:e.message}; }
  }

  async function testaDisparar(){
    try{
      var r=await fetch(API+'/api/disparar',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+TOKEN},
        body:JSON.stringify({opportunity_id:'__TESTE__',canal:'whatsapp',mensagem:'ping',
          telefone:'5511999999999',autonomo:false})
      });
      var t=await r.text();
      return {ok:r.ok,status:r.status,body:t.slice(0,400)};
    }catch(e){ return {ok:false,erro:e.message}; }
  }

  function resumoFila(){
    var a=state.actions||[];
    var total=a.length;
    var pend=a.filter(function(x){return /AGENDADO|PENDENTE/i.test(String(x.status||''));}).length;
    var env=a.filter(function(x){return /ENVIADO|CONCLU/i.test(String(x.status||''));}).length;
    var erro=a.filter(function(x){return /ERRO|FALHA/i.test(String(x.status||''));}).length;
    var paus=a.filter(function(x){return /PAUSAD/i.test(String(x.status||''));}).length;
    var ultimos = a.filter(function(x){return x.enviadoEm;})
                   .sort(function(x,y){return new Date(y.enviadoEm)-new Date(x.enviadoEm);})
                   .slice(0,5)
                   .map(function(x){return {
                     empresa:(x.empresa||'').slice(0,30),
                     enviado:x.enviadoEm,
                     status:x.status
                   };});
    return {total:total,pend:pend,env:env,erro:erro,paus:paus,ultimos:ultimos};
  }

  async function go(){
    if(typeof state==='undefined'){setTimeout(go,300);return;}

    var p=await ping();
    var t=await testaDisparar();
    var f=resumoFila();

    var linhas=[];
    linhas.push('== ENDPOINT ==');
    linhas.push('GET  /api/ping    → '+(p.ok?('HTTP '+p.status):('ERRO: '+(p.erro||p.status))));
    linhas.push('     body: '+String(p.body||'').slice(0,80));
    linhas.push('');
    linhas.push('POST /api/disparar → '+(t.ok?('HTTP '+t.status):('ERRO: '+(t.erro||t.status))));
    linhas.push('     body: '+String(t.body||'').slice(0,200));
    linhas.push('');
    linhas.push('== FILA ATUAL ==');
    linhas.push('Total:      '+f.total);
    linhas.push('Pendentes:  '+f.pend);
    linhas.push('Enviados:   '+f.env);
    linhas.push('Erros:      '+f.erro);
    linhas.push('Pausados:   '+f.paus);
    linhas.push('');
    if(f.ultimos.length){
      linhas.push('== ÚLTIMOS ENVIOS ==');
      f.ultimos.forEach(function(x){
        linhas.push('· '+(x.enviado||'').replace('T',' ').slice(0,19)+'  '+x.empresa+'  ['+x.status+']');
      });
    } else {
      linhas.push('(nenhum envio registrado em a.enviadoEm)');
    }

    /* Motor log */
    try{
      var MOT=state.__filaMotor;
      if(MOT){
        linhas.push('');
        linhas.push('== MOTOR ==');
        linhas.push('ativo: '+MOT.ativo+'  ·  enviados: '+MOT.enviados+'  ·  erros: '+MOT.erros);
        if(MOT.log && MOT.log.length){
          linhas.push('log:');
          MOT.log.slice(0,6).forEach(function(l){
            var hh=new Date(l.t).toTimeString().slice(0,5);
            linhas.push('  '+hh+' · '+l.msg);
          });
        }
      }
    }catch(e){}

    var txt=linhas.join('\n');
    console.log(txt);

    var el=document.createElement('div');
    el.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Manrope,sans-serif';
    el.innerHTML='<div style="background:#12171e;color:#f2f4f6;border:1px solid #2a3441;border-radius:14px;'+
      'padding:20px 24px;max-width:700px;max-height:85vh;overflow:auto;font:12px ui-monospace,Menlo,monospace;white-space:pre-wrap;box-shadow:0 30px 80px rgba(0,0,0,.55)">'+
      txt.replace(/[<>&]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c]})+
      '\n\n<div style="margin-top:14px;display:flex;gap:8px;font-family:Manrope,sans-serif">'+
      '<button id="__vTestSend" style="padding:6px 14px;border:1px solid #22c55e;background:rgba(34,197,94,.1);color:#22c55e;border-radius:8px;cursor:pointer;font:600 12px Manrope">reenviar teste</button>'+
      '<button id="__vClose" style="padding:6px 14px;border:1px solid #2a3441;background:transparent;color:#8b93a1;border-radius:8px;cursor:pointer;font:600 12px Manrope">fechar</button>'+
      '</div></div>';
    document.body.appendChild(el);
    document.getElementById('__vClose').onclick=function(){el.remove()};
    document.getElementById('__vTestSend').onclick=async function(){
      var r=await testaDisparar();
      alert('POST /api/disparar → HTTP '+(r.status||r.erro)+'\n\n'+String(r.body||'').slice(0,300));
    };
  }
  go();
})();
