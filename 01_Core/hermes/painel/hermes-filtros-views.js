(function(){
  if(window.__filtrosViews) return; window.__filtrosViews=true;

  var SPEC = {
    fila:[
      {k:'status',  label:'status',  opts:['PRONTO','AGENDADO','EXECUTANDO','ERRO','BLOQUEADO']},
      {k:'canal',   label:'canal',   opts:['WhatsApp','LinkedIn','E-mail']},
      {k:'etapa',   label:'etapa',   opts:['D0','D3','D7']},
      {k:'campanha',label:'campanha',opts:['AGE-01','CUL-01','WAL-01','WAL-02','WHA-01']},
      {k:'quando',  label:'quando',  opts:['Hoje','Amanhã','Atrasadas','Semana']}
    ],
    leads:[
      {k:'tipo',      label:'tipo',    opts:['B2B','Projeto','Vaga','Parceria']},
      {k:'canal',     label:'canal',   opts:['WhatsApp','LinkedIn','E-mail','Telefone']},
      {k:'etapa',     label:'etapa',   opts:['Descoberta','Qualificação','Conversa','Proposta','Fechado']},
      {k:'prioridade',label:'prior.',  opts:['Alta','Média','Baixa']},
      {k:'grupo',     label:'grupo',   opts:['A','B','C']},
      {k:'segmento',  label:'seg.',    opts:['Captação','Cultura','Design','Educação','Geral','Jurídico','Marketing','RH','Saúde','Tecnologia','Vendas','Web']},
      {k:'cargo',     label:'cargo',   opts:['Decisor','Execução','Gestor','Outro','Recrutador']}
    ],
    central:[
      {k:'quando', label:'quando', opts:['Hoje','Semana','Mês']},
      {k:'canal',  label:'canal',  opts:['WhatsApp','LinkedIn','E-mail']}
    ]
  };
  var HUE = {status:'#94a3b8',canal:'#94a3b8',etapa:'#a3a3c4',campanha:'#c4a97e',
    quando:'#94a3b8',tipo:'#b39cc4',prioridade:'#94a3b8',grupo:'#9aa8b6',
    segmento:'#9ec0b0',cargo:'#b8a898'};
  var OPT_COR = {
    'WhatsApp':'#22c55e','LinkedIn':'#0ea5e9','E-mail':'#f59e0b','Telefone':'#a78bfa',
    'PRONTO':'#22c55e','AGENDADO':'#60a5fa','EXECUTANDO':'#f59e0b','ERRO':'#ef4444','BLOQUEADO':'#a1a1aa',
    'Hoje':'#22c55e','Amanhã':'#60a5fa','Atrasadas':'#ef4444','Semana':'#a78bfa','Mês':'#a78bfa',
    'Alta':'#ef4444','Média':'#f59e0b','Baixa':'#60a5fa',
    'D0':'#22c55e','D3':'#f59e0b','D7':'#a78bfa',
    'Descoberta':'#60a5fa','Qualificação':'#22c55e','Conversa':'#f59e0b','Proposta':'#a78bfa','Fechado':'#10b981'
  };

  function cssInj(){
    var old = document.getElementById('fv-css'); if(old) old.remove();
    var s = [
      '.fv-bar{',
        'display:flex;flex-wrap:wrap;align-items:center;',
        'gap:4px 8px;',
        'width:100%;margin-top:4px;padding:5px 8px;font-family:inherit;',
        'background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,0));',
        'border:1px solid var(--line);border-radius:8px;overflow:hidden;',
      '}',
      '.fv-blk{display:inline-flex;flex-direction:row;align-items:center;gap:4px;min-width:0;padding:0}',
      '.fv-blk + .fv-blk{border-left:1px solid var(--line);padding-left:8px}',
      '.fv-lb{display:inline-flex;align-items:center;',
        'color:var(--muted2);font-size:9.5px;font-weight:600;',
        'letter-spacing:0;text-transform:none;opacity:.75;flex-shrink:0;',
        'line-height:1;white-space:nowrap;margin-right:1px}',
      '.fv-lb::after{content:":";margin-left:1px}',
      '.fv-ic{display:none!important}',
      '.fv-pills{display:inline-flex;flex-wrap:wrap;gap:3px;align-items:center}',
      '.fv-p{',
        'padding:0 8px;height:16px;',
        'border:1px solid color-mix(in srgb,var(--p) 42%,transparent);',
        'background:transparent;color:color-mix(in srgb,var(--p) 85%,var(--txt));',
        'font-family:inherit;font-size:10px;font-weight:600;',
        'border-radius:999px;cursor:pointer;line-height:1;',
        'white-space:nowrap;display:inline-flex;align-items:center;',
        'transition:background .12s,color .12s,border-color .12s}',
      '.fv-p:hover{background:color-mix(in srgb,var(--p) 12%,transparent)}',
      '.fv-p.on{',
        'background:color-mix(in srgb,var(--p) 25%,transparent);',
        'border-color:color-mix(in srgb,var(--p) 85%,transparent);',
        'color:var(--txt);font-weight:700}',
      '.fv-p.on::before{content:"";display:inline-block;',
        'width:3px;height:3px;border-radius:50%;background:var(--p);',
        'margin-right:4px}',
      '.fv-bar .fv-x{margin-left:auto;padding:0 8px;height:16px;',
        'display:inline-flex;align-items:center;',
        'background:transparent;border:1px solid var(--line);',
        'color:var(--muted2);border-radius:999px;font-family:inherit;font-size:10px;',
        'font-weight:600;cursor:pointer;line-height:1;opacity:.75}',
      '.fv-bar .fv-x:hover{opacity:1;color:var(--txt);border-color:var(--muted2)}'
    ].join('');
    var st = document.createElement('style'); st.id='fv-css'; st.textContent=s;
    document.head.appendChild(st);
  }

  function filtro(){ return (state.filters = state.filters || {}); }
  function atual(k){ return filtro()[k] || 'all'; }
  function shiftHex(hex,d){var n=parseInt(hex.slice(1),16);
    var r=Math.max(0,Math.min(255,((n>>16)&255)+d));
    var g=Math.max(0,Math.min(255,((n>>8)&255)+d));
    var b=Math.max(0,Math.min(255,(n&255)+d));
    return '#'+((r<<16|g<<8|b).toString(16).padStart(6,'0'));}
  function corDe(cat,opt){
    if(opt && OPT_COR[opt]) return OPT_COR[opt];
    if(opt){var base=HUE[cat]||'#94a3b8';
      var h=0;for(var i=0;i<opt.length;i++)h=(h*31+opt.charCodeAt(i))&0xffffff;
      return shiftHex(base,(h%30)-15);}
    return HUE[cat]||'#94a3b8';
  }

  function barHTML(view){
    var spec=SPEC[view]; if(!spec) return '';
    var h='<div class="fv-bar" data-fv-bar="'+view+'">';
    spec.forEach(function(g){
      h+='<div class="fv-blk"><span class="fv-lb">'+g.label+'</span><div class="fv-pills">';
      g.opts.forEach(function(o){
        var on=atual(g.k)===o, pc=corDe(g.k,o);
        h+='<button class="fv-p'+(on?' on':'')+'" style="--p:'+pc+'" data-fv="'+view+'|'+g.k+'|'+o+'">'+o+'</button>';
      });
      h+='</div></div>';
    });
    var algum=false;
    spec.forEach(function(g){ if(atual(g.k)!=='all') algum=true; });
    if(algum) h+='<button class="fv-x" data-fv-clear="1">limpar</button>';
    h+='</div>';
    return h;
  }

  function place(){
    cssInj();
    var top=document.getElementById('topbar'); if(!top) return;
    var view=(state && state.view)||'central';
    var spec=SPEC[view];
    top.querySelectorAll('[data-fv-bar]').forEach(function(b){
      if(!spec || b.getAttribute('data-fv-bar')!==view) b.remove();
    });
    if(!spec) return;
    var exist=top.querySelector('[data-fv-bar="'+view+'"]');
    var html=barHTML(view);
    if(exist){
      if(exist.outerHTML!==html){
        var tmp=document.createElement('div'); tmp.innerHTML=html;
        exist.replaceWith(tmp.firstChild);
      }
    } else {
      var tmp2=document.createElement('div'); tmp2.innerHTML=html;
      top.appendChild(tmp2.firstChild);
    }
  }

  document.addEventListener('click',function(ev){
    var el=ev.target.closest('[data-fv]');
    if(el){ev.preventDefault();ev.stopPropagation();
      var p=el.getAttribute('data-fv').split('|');
      var f=filtro(); f[p[1]]=(f[p[1]]===p[2])?'all':p[2];
      if(typeof render==='function') render(); place(); return;}
    el=ev.target.closest('[data-fv-clear]');
    if(el){ev.preventDefault();ev.stopPropagation();
      var f2=filtro(); Object.keys(f2).forEach(function(k){f2[k]='all';});
      if(typeof render==='function') render(); place(); return;}
  },true);

  if(typeof render==='function'){
    var orig=window.render;
    window.render=function(){var r=orig.apply(this,arguments);setTimeout(place,20);return r;};
  }
  setInterval(place,700);
  place();
})();
