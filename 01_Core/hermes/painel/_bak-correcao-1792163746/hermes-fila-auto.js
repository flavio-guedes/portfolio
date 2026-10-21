(function(){
  if(window.__filaAuto) return; window.__filaAuto=true;

  var API   = 'http://127.0.0.1:8420';
  var TOKEN = 'hk_dev_local_troque_depois';
  var GAP_NOVO = 10*60*1000;   /* 10 min entre leads novos */
  var GAP_BASE =  4*60*1000;   /*  4 min entre já abordados */

  if(!state.__filaRun) state.__filaRun = {ativo:false,proximaEm:0,enviados:0,erros:0,log:[]};
  var RUN = state.__filaRun;

  /* ---------- só campanhas ativas ---------- */
  function campanhasAtivas(){
    return (state.campaigns||[]).filter(function(c){
      var s=String(c.status||'').toUpperCase();
      return s.indexOf('EXECU')>=0 || s==='ATIVA' || s==='ATIVO';
    });
  }
  function idsAtivos(){
    var m={}; campanhasAtivas().forEach(function(c){ m[c.id]=true; }); return m;
  }
  function pendentesDeAtivas(){
    var m=idsAtivos();
    return (state.actions||[]).filter(function(a){
      if(!m[a.campaign_id]) return false;
      return /AGENDADO|PENDENTE|agendado|pendente|EM_ABERTO|PRONTO/i.test(String(a.status||''));
    });
  }

  /* ---------- helpers ---------- */
  function cacheLeads(){
    if(window.__leadsById) return window.__leadsById;
    var m={}; (state.opportunities||[]).forEach(function(o){ m[o.id]=o; });
    window.__leadsById=m; return m;
  }
  function getLead(a){ return cacheLeads()[a.opportunity_id]||null; }
  function isNovo(a,lead){
    if(a.etapa && !/^(D0|INICIAL|PRIMEIRO)/i.test(a.etapa)) return false;
    if(lead){
      if(lead.tentativas && lead.tentativas>0) return false;
      if(lead.ultimo_contato) return false;
    }
    if(a.historico && a.historico.length) return false;
    return true;
  }
  function proximaAcao(){
    var ps=pendentesDeAtivas(); if(!ps.length) return null;
    ps.sort(function(a,b){
      var pa=a.prioridade_fila||99, pb=b.prioridade_fila||99;
      if(pa!==pb) return pa-pb;
      return (new Date(a.prazo||0)) - (new Date(b.prazo||0));
    });
    return ps[0];
  }
  function persistir(){
    try{
      if(typeof loadUserStore==='function' && typeof saveUserStore==='function'){
        var s=loadUserStore(); s.acoes=state.actions; saveUserStore(s);
      }
    }catch(e){}
  }

  /* ---------- envio ---------- */
  async function enviar(a){
    var lead = getLead(a)||{};
    var novo = isNovo(a,lead);
    var tel  = lead.whatsapp||lead.telefone||a.telefone||'';
    var body = {
      opportunity_id: a.opportunity_id,
      canal:          a.canal||'whatsapp',
      mensagem:       a.acao||a.mensagem||'',
      contato:        a.contato||lead.contato||'',
      empresa:        a.empresa||lead.empresa||'',
      telefone:       tel,
      etapa:          a.etapa||null,
      historico:      a.historico||[],
      autonomo:       !novo
    };
    var r = await fetch(API+'/api/disparar', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+TOKEN},
      body: JSON.stringify(body)
    });
    if(!r.ok) throw new Error('HTTP '+r.status);
    return await r.json().catch(function(){return{};});
  }

  /* ---------- loop ---------- */
  async function loop(){
    if(!RUN.ativo) return;
    var agora=Date.now();
    if(agora < RUN.proximaEm){
      setTimeout(loop, Math.min(4000, RUN.proximaEm-agora));
      return;
    }
    var a = proximaAcao();
    if(!a){
      RUN.ativo=false;
      RUN.log.unshift({t:Date.now(),msg:'Sem pendentes nas campanhas ativas. Parando.'});
      refresh(); return;
    }
    var lead=getLead(a)||{};
    var novo=isNovo(a,lead);

    try{
      var res = await enviar(a);
      RUN.enviados++;
      RUN.log.unshift({t:Date.now(),msg:'✓ '+((a.empresa||lead.empresa||a.opportunity_id)+'').slice(0,40)+' ['+(novo?'novo':'base')+']'});
      a.status='CONCLUIDO';
      a.enviadoEm=new Date().toISOString();
      a.tentativas=(a.tentativas||0)+1;
      if(lead){ lead.tentativas=(lead.tentativas||0)+1; lead.ultimo_contato=a.enviadoEm; }
      if(res && res.resposta_autonoma){
        RUN.log.unshift({t:Date.now(),msg:'↩ IA: '+String(res.resposta_autonoma).slice(0,70)});
      }
      persistir();
    }catch(e){
      RUN.erros++;
      RUN.log.unshift({t:Date.now(),msg:'✗ '+((a.empresa||a.opportunity_id)+'').slice(0,40)+' — '+e.message});
      RUN.proximaEm=Date.now()+30000;
      refresh();
      setTimeout(loop, 30000);
      return;
    }
    var gap = novo ? GAP_NOVO : GAP_BASE;
    RUN.proximaEm = Date.now()+gap;
    RUN.log = RUN.log.slice(0,12);
    refresh();
    setTimeout(loop, gap);
  }

  /* ---------- controle ---------- */
  function iniciar(){
    if(RUN.ativo) return;
    var p=pendentesDeAtivas();
    if(!p.length){
      RUN.log.unshift({t:Date.now(),msg:'Nada pendente nas campanhas ativas.'});
      refresh(); return;
    }
    RUN.ativo=true;
    RUN.proximaEm=Date.now();
    RUN.log.unshift({t:Date.now(),msg:'▶ Iniciado · '+p.length+' pendentes · 10min novos / 4min base'});
    loop(); refresh();
  }
  function pausar(){
    RUN.ativo=false;
    RUN.log.unshift({t:Date.now(),msg:'⏸ Pausado'});
    refresh();
  }
  function refresh(){
    try{ if(typeof window.render==='function') window.render(); }catch(e){}
    setTimeout(injetar, 30);
  }

  /* ---------- UI ---------- */
  function restante(){
    if(!RUN.ativo) return '';
    var ms=RUN.proximaEm-Date.now();
    if(ms<=0) return 'enviando…';
    var s=Math.ceil(ms/1000), m=Math.floor(s/60); s%=60;
    return 'próximo em '+m+'m'+String(s).padStart(2,'0')+'s';
  }
  function bloco(){
    var ativas=campanhasAtivas();
    var p=pendentesDeAtivas();
    var cor=RUN.ativo?'#f59e0b':'#22c55e';
    var h='';
    h+='<div style="background:linear-gradient(180deg,rgba(34,197,94,.05),transparent);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:14px">';
    h+='<div style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Automação da fila</div>';
    h+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
    h+='<button data-play-camp="'+(RUN.ativo?'pausar':'iniciar')+'" style="padding:9px 18px;border-radius:999px;border:1px solid '+cor+';background:color-mix(in srgb,'+cor+' 14%,transparent);color:'+cor+';font:700 12px Manrope,sans-serif;cursor:pointer;letter-spacing:.03em">'+
       (RUN.ativo?'⏸ Pausar fila':'▶ Retomar fila')+'</button>';
    h+='<span style="font:600 11px Manrope;color:var(--muted)">'+ativas.length+' campanha(s) ativa(s) · '+p.length+' pendente(s)'+(RUN.ativo?' · '+restante():'')+'</span>';
    h+='<span style="font:600 11px Manrope;color:var(--muted);margin-left:auto">✓ '+RUN.enviados+' · ✗ '+RUN.erros+'</span>';
    h+='</div>';
    if(RUN.log.length){
      h+='<div style="margin-top:10px;max-height:110px;overflow:auto;font:11px ui-monospace,Menlo,monospace;color:var(--muted);line-height:1.6">';
      RUN.log.slice(0,7).forEach(function(l){
        var hh=new Date(l.t).toTimeString().slice(0,5);
        h+='<div>'+hh+' · '+l.msg+'</div>';
      });
      h+='</div>';
    }
    h+='</div>';
    return h;
  }
  function injetar(){
    if(typeof state==='undefined') return;
    if(state.view!=='fila') return;
    if(state.__filaAba!=='campanhas') return;
    var c=document.getElementById('content'); if(!c) return;
    var alvo=c.querySelector('section.view')||c;
    var old=alvo.querySelector('[data-play-block]');
    var tmp=document.createElement('div'); tmp.innerHTML=bloco();
    var b=tmp.firstChild; b.setAttribute('data-play-block','1');
    if(old) old.replaceWith(b);
    else alvo.insertBefore(b, alvo.firstChild);
  }

  setInterval(function(){ if(RUN.ativo) injetar(); }, 1000);
  setInterval(injetar, 700);
  setTimeout(injetar, 200);

  document.addEventListener('click', function(ev){
    var el = ev.target.closest('[data-play-camp]');
    if(!el) return;
    ev.preventDefault(); ev.stopPropagation();
    if(el.getAttribute('data-play-camp')==='iniciar') iniciar(); else pausar();
  }, true);
})();
