(function(){
  /* ============ 1) Extensão do match de leads (segmento + cargo) ============ */
  var _orig = window.oppMatchesFilters;
  window.oppMatchesFilters = function(o){
    if(typeof _orig === 'function' && !_orig(o)) return false;
    var f = state.filters || {};
    if(f.segmento && f.segmento !== 'all' && o.segmento !== f.segmento) return false;
    if(f.cargo && f.cargo !== 'all' && o.perfil !== f.cargo) return false;
    return true;
  };

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* ============ 2) CATS por view ============ */
  var CATS_LEAD = [
    {id:'contexto', label:'Tipo', color:'#94a3b8', values:[
      {v:'B2B',c:'#60a5fa'},{v:'Projeto',c:'#c084fc'},{v:'Vaga',c:'#fbbf24'},{v:'Parceria',c:'#22d3ee'}
    ]},
    {id:'canal', label:'Canal', color:'#60a5fa', values:[
      {v:'WhatsApp',c:'#4ade80'},{v:'LinkedIn',c:'#7fb3e8'},{v:'E-mail',c:'#f3c76d'},{v:'Telefone',c:'#a78bfa'}
    ]},
    {id:'estagio', label:'Etapa', color:'#22d3ee', values:[
      {v:'Descoberta',c:'#60a5fa'},{v:'Qualificação',c:'#fbbf24'},{v:'Conversa',c:'#c084fc'},{v:'Proposta',c:'#22d3ee'},{v:'Fechado',c:'#4ade80'}
    ]},
    {id:'prioridade', label:'Prior.', color:'#ff5b5b', values:[
      {v:'Alta',c:'#ff5b5b'},{v:'Média',c:'#fbbf24'},{v:'Baixa',c:'#94a3b8'}
    ]},
    {id:'grupo', label:'Grupo', color:'#e0b878', values:[
      {v:'A',c:'#e0b878'},{v:'B',c:'#60a5fa'},{v:'C',c:'#94a3b8'}
    ]},
    {id:'segmento', label:'Segmento', color:'#a78bfa', dyn:'segmento'},
    {id:'cargo', label:'Cargo', color:'#f472b6', dyn:'perfil'}
  ];

  var CATS_FILA = [
    {id:'status', label:'Status', color:'#ff5b5b', values:[
      {v:'PRONTO',c:'#4ade80'},{v:'AGENDADO',c:'#22d3ee'},{v:'EXECUTANDO',c:'#60a5fa'},{v:'ERRO',c:'#ff5b5b'},{v:'BLOQUEADO',c:'#fbbf24'}
    ]},
    {id:'canal', label:'Canal', color:'#60a5fa', values:[
      {v:'WhatsApp',c:'#4ade80'},{v:'LinkedIn',c:'#7fb3e8'},{v:'E-mail',c:'#f3c76d'}
    ]},
    {id:'etapa', label:'Etapa', color:'#22d3ee', dyn:'etapa_acao'},
    {id:'campanha', label:'Campanha', color:'#e0b878', dyn:'campanha_id'},
    {id:'quando', label:'Quando', color:'#a78bfa', values:[
      {v:'hoje',l:'Hoje',c:'#22d3ee'},{v:'amanha',l:'Amanhã',c:'#4ade80'},
      {v:'atrasadas',l:'Atrasadas',c:'#ff5b5b'},{v:'semana',l:'Semana',c:'#fbbf24'}
    ]}
  ];

  function valuesFor(cat){
    if(cat.dyn){
      var seen = {}, out = [];
      if(cat.dyn === 'segmento'){
        (state.opportunities||[]).forEach(function(o){ if(o.segmento && !seen[o.segmento]){seen[o.segmento]=1; out.push({v:o.segmento, c:cat.color});} });
      } else if(cat.dyn === 'perfil'){
        (state.opportunities||[]).forEach(function(o){ if(o.perfil && !seen[o.perfil]){seen[o.perfil]=1; out.push({v:o.perfil, c:cat.color});} });
      } else if(cat.dyn === 'etapa_acao'){
        (state.actions||[]).forEach(function(a){ if(a.etapa && !seen[a.etapa]){seen[a.etapa]=1; out.push({v:a.etapa, c:cat.color});} });
      } else if(cat.dyn === 'campanha_id'){
        (state.campaigns||[]).forEach(function(c){ if(c.id && !seen[c.id]){seen[c.id]=1; out.push({v:c.id, l:c.id, c:cat.color});} });
      }
      return out.slice(0, 15).sort(function(a,b){return String(a.v).localeCompare(String(b.v));});
    }
    return (cat.values||[]).map(function(v){return {v:v.v, l:v.l||v.v, c:v.c||cat.color};});
  }

  function getStore(){
    if(state.view === 'fila'){
      if(!state.filtersFila) state.filtersFila = {status:'all', canal:'all', etapa:'all', campanha:'all', quando:'all'};
      return {store: state.filtersFila, cats: CATS_FILA};
    }
    return {store: state.filters, cats: CATS_LEAD};
  }

  function blockHTML(cat, cur){
    var vals = valuesFor(cat);
    var h = '<div class="hf3-b"><span class="hf3-l">'+cat.label+'</span>';
    h += '<button type="button" class="hf3-p'+(cur==='all'?' on':'')+'" data-hf4="'+cat.id+'|all" style="--c:'+cat.color+'">·</button>';
    vals.forEach(function(v){
      var lbl = v.l || v.v;
      if(lbl.length > 12) lbl = lbl.slice(0,11)+'…';
      h += '<button type="button" class="hf3-p'+(cur===v.v?' on':'')+'" data-hf4="'+cat.id+'|'+esc(v.v)+'" style="--c:'+v.c+'" title="'+esc(v.v)+'">'+esc(lbl)+'</button>';
    });
    h += '</div>';
    return h;
  }

  function barHTML(){
    var s = getStore();
    var ativos = 0;
    Object.keys(s.store).forEach(function(k){ if(s.store[k] !== 'all') ativos++; });
    var h = '<div class="hf3" data-hf4-bar><div class="hf3-row">';
    s.cats.forEach(function(c){ h += blockHTML(c, s.store[c.id]||'all'); });
    h += '</div>';
    if(ativos) h += '<button type="button" class="hf3-x" data-hf4-clear>'+ativos+' ×</button>';
    h += '</div>';
    return h;
  }

  function cssInj(){
    if(document.getElementById('hf3-css')) return;
    var s = '.hf3{display:flex;align-items:center;gap:8px;padding:5px 0 4px;border-top:1px solid var(--line);margin-top:6px;font-family:inherit;width:100%;flex-basis:100%}'+
    '.hf3-row{display:flex;flex-wrap:wrap;gap:2px 10px;flex:1;min-width:0;align-items:center}'+
    '.hf3-b{display:inline-flex;align-items:center;gap:3px}'+
    '.hf3-l{color:var(--muted2);font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-right:2px;flex-shrink:0}'+
    '.hf3-p{padding:1px 7px;border:1px solid var(--c);background:transparent;color:var(--c);opacity:.75;font-family:inherit;font-size:10.5px;font-weight:600;border-radius:999px;cursor:pointer;line-height:1.4;white-space:nowrap;transition:.12s}'+
    '.hf3-p:hover{opacity:1;background:color-mix(in srgb,var(--c) 12%,transparent)}'+
    '.hf3-p.on{background:color-mix(in srgb,var(--c) 25%,transparent);color:var(--txt);opacity:1;font-weight:700}'+
    '.hf3-x{padding:1px 8px;border:1px solid var(--urgent-bd);background:var(--urgent-bg);color:var(--urgent);border-radius:999px;font-family:inherit;font-size:10.5px;font-weight:700;cursor:pointer;line-height:1.4;flex-shrink:0}'+
    '.hf3-x:hover{background:var(--urgent);color:#fff}';
    var st = document.createElement('style'); st.id = 'hf3-css'; st.textContent = s;
    document.head.appendChild(st);
  }

  function place(){
    cssInj();
    var top = document.getElementById('topbar'); if(!top) return;
    var old = top.querySelector('[data-hf4-bar]');
    var novo = document.createElement('div'); novo.innerHTML = barHTML();
    var el = novo.firstChild;
    if(old) old.replaceWith(el);
    else top.appendChild(el);
  }
  setInterval(place, 400); place();

  /* ============ 3) View Fila com filtros ============ */
  function hj(){return new Date().toISOString().slice(0,10);}
  function rotulo(iso){
    if(!iso) return '(sem data)';
    var d = new Date(iso+'T12:00:00'); if(isNaN(d.getTime())) return iso;
    var hh = new Date(); hh.setHours(12,0,0,0);
    var diff = Math.round((d-hh)/86400000);
    var ds = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
    if(diff===0) return 'Hoje · '+ds[d.getDay()];
    if(diff===1) return 'Amanhã · '+ds[d.getDay()];
    if(diff>1 && diff<7) return ds[d.getDay()].charAt(0).toUpperCase()+ds[d.getDay()].slice(1);
    return String(iso).slice(8,10)+'/'+String(iso).slice(5,7)+' · '+ds[d.getDay()];
  }
  function hist(){
    var env = (state.actions||[]).filter(function(a){return ['ENVIADO','RESPONDIDO','CONCLUÍDO','CANCELADO'].indexOf(a.status)>=0;});
    env.sort(function(a,b){ return String(b.enviado_em||b.prazo||'').localeCompare(String(a.enviado_em||a.prazo||'')); });
    if(!env.length) return '<div class="op-empty">Nenhum envio registrado.</div>';
    var h = '<div class="op-list">';
    env.slice(0,60).forEach(function(a){
      var o = (typeof oppOf==='function') ? (oppOf(a.opportunity_id)||{}) : {};
      var camp = a.campaign_id ? ((state.campaigns||[]).filter(function(c){return c.id===a.campaign_id;})[0]||null) : null;
      var tone = a.status==='RESPONDIDO'?'ok':a.status==='ENVIADO'?'info':'';
      h += '<div class="op-row"><div><span class="badge '+tone+'">'+esc(a.status)+'</span></div><div style="min-width:0"><div class="t">'+esc(o.empresa||a.contato||'—')+'<small>'+esc(a.canal||'')+' · '+esc(a.etapa||'')+'</small></div><div class="d">'+esc(camp?camp.id:'')+' · '+esc(String(a.enviado_em||a.prazo||'').slice(0,16).replace('T',' '))+'</div></div><div class="acts"><span class="sub" style="font-size:10.5px">'+esc(a.enviado_para||'—')+'</span></div></div>';
    });
    h += '</div>';
    return h;
  }

  function viewFila(){
    var acts = (state.actions||[]).filter(function(a){ return ['PRONTO','AGENDADO','EXECUTANDO','ERRO','BLOQUEADO'].indexOf(a.status)>=0; });
    var f = state.filtersFila || {};
    if(f.status && f.status !== 'all') acts = acts.filter(function(a){ return a.status === f.status; });
    if(f.canal && f.canal !== 'all') acts = acts.filter(function(a){ return a.canal === f.canal; });
    if(f.etapa && f.etapa !== 'all') acts = acts.filter(function(a){ return a.etapa === f.etapa; });
    if(f.campanha && f.campanha !== 'all') acts = acts.filter(function(a){ return String(a.campaign_id) === String(f.campanha); });
    var hoje = hj();
    var am = new Date(); am.setDate(am.getDate()+1); var aman = am.toISOString().slice(0,10);
    var fim = new Date(); fim.setDate(fim.getDate()+7); var fims = fim.toISOString().slice(0,10);
    if(f.quando === 'hoje') acts = acts.filter(function(a){ return String(a.prazo||'').slice(0,10) === hoje; });
    if(f.quando === 'amanha') acts = acts.filter(function(a){ return String(a.prazo||'').slice(0,10) === aman; });
    if(f.quando === 'atrasadas') acts = acts.filter(function(a){ return String(a.prazo||'').slice(0,10) < hoje; });
    if(f.quando === 'semana') acts = acts.filter(function(a){ var d = String(a.prazo||'').slice(0,10); return d >= hoje && d <= fims; });

    var por={}, ordem=[];
    acts.forEach(function(a){ var d = String(a.prazo||'').slice(0,10) || ''; if(!por[d]){ por[d]=[]; ordem.push(d); } por[d].push(a); });
    ordem.sort();

    var h = '<div class="op-bar" style="margin-bottom:10px"><button class="btn sm" data-goto-view="disparos">→ Gerenciar Disparos</button><span class="sp"></span><span class="sub" style="font-size:11px">'+acts.length+' ação(ões) · ordenadas por dia</span></div>';
    if(!acts.length){
      h += '<div class="op-list"><div class="op-empty">Fila vazia com esses filtros.</div></div>';
    } else {
      ordem.forEach(function(dia){
        var lista = por[dia];
        var cor = dia<hoje ? 'var(--urgent)' : dia===hoje ? 'var(--accent)' : 'var(--info)';
        h += '<div class="op-sec" style="margin-top:14px"><div class="op-head"><h2 style="display:flex;align-items:center;gap:8px"><span class="dot" style="background:'+cor+'"></span>'+esc(rotulo(dia))+'</h2><span class="sub">'+lista.length+'</span></div><div class="op-list">';
        lista.slice(0,50).forEach(function(a){
          var o = (typeof oppOf==='function') ? (oppOf(a.opportunity_id)||{}) : {};
          var camp = a.campaign_id ? ((state.campaigns||[]).filter(function(c){return c.id===a.campaign_id;})[0]||null) : null;
          var pode = a.canal === 'WhatsApp' && ['PRONTO','AGENDADO','ERRO','BLOQUEADO'].indexOf(a.status) >= 0;
          var tr = a.status==='ERRO'?'t-urgent':a.status==='BLOQUEADO'?'t-warn':'';
          var tone = a.status==='ERRO'?'hot':a.status==='BLOQUEADO'?'warm':a.status==='EXECUTANDO'?'info':'';
          h += '<div class="op-row '+tr+'"><div><span class="badge '+tone+'">'+esc(a.status)+'</span></div><div style="min-width:0"><div class="t" style="overflow-wrap:anywhere">'+esc(o.empresa||a.contato||'—')+'<small>'+esc(a.canal||'')+' · '+esc(a.etapa||'')+'</small></div><div class="d">'+esc(a.acao||'')+(camp?' · '+esc(camp.id):'')+' · <b>'+esc(String(a.prazo||'').slice(11,16)||'—')+'</b></div></div><div class="acts">';
          if(pode) h += '<button class="btn sm primary" data-act-send="'+esc(a.id)+'">Enviar</button>';
          h += '<button class="btn sm ghost" data-edit-action="'+esc(a.id)+'">✎</button></div></div>';
        });
        h += '</div></div>';
      });
    }
    h += '<div class="op-head" style="margin-top:22px"><h2>Histórico</h2><span class="sub">Disparos já feitos</span></div>' + hist();
    return h;
  }

  function aplicar(){
    if(typeof VIEWS === 'undefined'){ setTimeout(aplicar, 200); return; }
    VIEWS.fila = viewFila;
    if(typeof render === 'function') setTimeout(render, 60);
  }
  aplicar();

  /* ============ 4) Cliques dos filtros ============ */
  document.addEventListener('click', function(ev){
    var el = ev.target.closest('[data-hf4]');
    if(el){
      ev.preventDefault(); ev.stopPropagation();
      var p = el.getAttribute('data-hf4').split('|');
      var s = getStore();
      s.store[p[0]] = (s.store[p[0]] === p[1]) ? 'all' : p[1];
      if(typeof render === 'function') render();
      return;
    }
    el = ev.target.closest('[data-hf4-clear]');
    if(el){
      ev.preventDefault(); ev.stopPropagation();
      var s2 = getStore();
      Object.keys(s2.store).forEach(function(k){ s2.store[k] = 'all'; });
      if(typeof render === 'function') render();
      return;
    }
  }, true);
})();
