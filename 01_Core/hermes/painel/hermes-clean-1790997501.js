(function(){
  function rgba(hex,a){hex=String(hex||'#888').replace('#','');if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];var r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);return 'rgba('+r+','+g+','+b+','+a+')';}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var CATS=[
    {id:'canal',label:'Canal',color:'#60a5fa',ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7A2 2 0 0 1 22 16.9z"/></svg>',
     values:[{v:'WhatsApp',c:'#4ade80'},{v:'LinkedIn',c:'#7fb3e8'},{v:'E-mail',c:'#f3c76d'},{v:'Telefone',c:'#a78bfa'}]},
    {id:'prioridade',label:'Prioridade',color:'#ff5b5b',ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
     values:[{v:'Alta',c:'#ff5b5b'},{v:'Média',c:'#fbbf24'},{v:'Baixa',c:'#94a3b8'}]},
    {id:'estagio',label:'Estágio',color:'#22d3ee',ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></svg>',
     values:[{v:'Descoberta',c:'#60a5fa'},{v:'Qualificação',c:'#fbbf24'},{v:'Conversa',c:'#c084fc'},{v:'Proposta',c:'#22d3ee'},{v:'Fechado',c:'#4ade80'}]},
    {id:'grupo',label:'Grupo',color:'#e0b878',ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
     values:[{v:'A',c:'#e0b878'},{v:'B',c:'#60a5fa'},{v:'C',c:'#94a3b8'}]},
    {id:'perfil',label:'Perfil',color:'#c084fc',ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
     values:[{v:'Decisor',c:'#c084fc'},{v:'Gestor',c:'#f472b6'},{v:'Recrutador',c:'#22d3ee'},{v:'Execução',c:'#94a3b8'}]}
  ];
  function cat(id){for(var i=0;i<CATS.length;i++)if(CATS[i].id===id)return CATS[i];return null;}
  function ativos(){
    var c=(typeof state!=='undefined'&&state.recommendFilter)||{},out=[];
    for(var i=1;i<=9;i++){
      var d=c['dim'+i],v=c['val'+i];
      if(d&&d!=='none'&&v&&v!=='all'){
        var C=cat(d);if(!C)continue;
        var val=null;for(var j=0;j<C.values.length;j++)if(C.values[j].v===v)val=C.values[j];
        out.push({slot:i,dim:d,val:v,cor:val?val.c:C.color});
      }
    }
    return out;
  }
  function setFiltro(dim,val){
    var c=state.recommendFilter||{},exist=-1;
    for(var i=1;i<=9;i++)if(c['dim'+i]===dim&&c['val'+i]===val){exist=i;break;}
    if(exist>0){c['dim'+exist]='none';c['val'+exist]='all';}
    else{
      var slot=0;
      for(var j=1;j<=9;j++)if(!c['dim'+j]||c['dim'+j]==='none'){slot=j;break;}
      if(!slot)for(var k=1;k<=9;k++)if(c['dim'+k]===dim){slot=k;break;}
      if(!slot)slot=1;
      c['dim'+slot]=dim;c['val'+slot]=val;
    }
    c.count=[1,2,3,4,5,6,7,8,9].filter(function(x){return c['dim'+x]&&c['dim'+x]!=='none';}).length;
    state.recommendFilter=c;
    if(typeof refreshRecommendSection==='function')refreshRecommendSection();else if(typeof render==='function')render();
  }
  function rmSlot(i){if(!state.recommendFilter)return;state.recommendFilter['dim'+i]='none';state.recommendFilter['val'+i]='all';if(typeof refreshRecommendSection==='function')refreshRecommendSection();else if(typeof render==='function')render();}
  function clearAll(){var c={};for(var i=1;i<=9;i++){c['dim'+i]='none';c['val'+i]='all';}c.count=0;state.recommendFilter=c;state._rfOpen=null;if(typeof refreshRecommendSection==='function')refreshRecommendSection();else if(typeof render==='function')render();}
  function barHTML(){
    var a=ativos(),ab=state._rfOpen||null,h='<div class="rficon">';
    h+='<div class="rficon-cats">';
    CATS.forEach(function(C){
      var u=a.some(function(x){return x.dim===C.id;});
      h+='<button type="button" class="rficon-cat'+(ab===C.id?' is-open':'')+(u?' is-used':'')+'" data-rficon-cat="'+C.id+'" style="--c:'+C.color+';--cbg:'+rgba(C.color,.12)+';--cbd:'+rgba(C.color,.5)+'"><span class="rficon-i">'+C.ico+'</span><span>'+C.label+'</span></button>';
    });
    if(a.length)h+='<button type="button" class="rficon-clear" data-rficon-clear>limpar</button>';
    h+='</div>';
    if(ab){
      var C2=cat(ab);
      if(C2){
        h+='<div class="rficon-vals" style="--c:'+C2.color+'">';
        C2.values.forEach(function(v){
          var on=a.some(function(x){return x.dim===C2.id&&x.val===v.v;});
          h+='<button type="button" class="rficon-val'+(on?' is-active':'')+'" data-rficon-apply="'+C2.id+'|'+v.v+'" style="--vc:'+v.c+';--vb:'+rgba(v.c,.08)+';--vb2:'+rgba(v.c,.2)+';--vbd:'+rgba(v.c,.32)+'">'+v.v+'</button>';
        });
        h+='</div>';
      }
    }
    if(a.length){
      h+='<div class="rficon-active">';
      a.forEach(function(x){
        h+='<span class="rficon-chip" style="--vc:'+x.cor+';--vb:'+rgba(x.cor,.1)+';--vbd:'+rgba(x.cor,.42)+'"><span class="rficon-dot"></span>'+esc(x.val)+'<button type="button" class="rficon-x" data-rficon-remove="'+x.slot+'">×</button></span>';
      });
      h+='</div>';
    }
    h+='</div>';
    return h;
  }
  function css(){
    if(document.getElementById('rficon-css'))return;
    var s='.rficon{display:flex;flex-direction:column;gap:8px;margin:4px 0 8px;font-family:inherit}';
    s+='.rficon-cats{display:flex;gap:6px;flex-wrap:wrap;align-items:center}';
    s+='.rficon-cat{padding:5px 12px 5px 10px;border:1px solid var(--line);background:rgba(255,255,255,.02);border-radius:999px;color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:.15s;font-family:inherit;font-size:11.5px;font-weight:600;position:relative}';
    s+='.rficon-i{display:inline-flex;width:13px;height:13px;color:var(--c);flex-shrink:0}';
    s+='.rficon-i svg{width:13px;height:13px;display:block}';
    s+='.rficon-cat:hover{border-color:var(--line2);background:rgba(255,255,255,.05);color:var(--txt)}';
    s+='.rficon-cat.is-open,.rficon-cat.is-used{color:var(--txt);background:var(--cbg);border-color:var(--cbd)}';
    s+='.rficon-cat.is-used::after{content:"";position:absolute;top:-2px;right:-2px;width:7px;height:7px;background:var(--c);border-radius:50%;border:1.5px solid var(--bg)}';
    s+='.rficon-clear{margin-left:auto;padding:5px 11px;border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:999px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:600}';
    s+='.rficon-clear:hover{color:var(--urgent);border-color:var(--urgent-bd);background:var(--urgent-bg)}';
    s+='.rficon-vals{display:flex;gap:6px;flex-wrap:wrap;padding:4px 0 4px 10px;position:relative}';
    s+='.rficon-vals::before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:2px;border-radius:2px;background:var(--c);opacity:.6}';
    s+='.rficon-val{padding:4px 11px;font-size:11px;font-weight:600;color:var(--vc);background:var(--vb);border:1px solid var(--vbd);border-radius:999px;cursor:pointer;transition:.15s;font-family:inherit}';
    s+='.rficon-val:hover{background:var(--vb2);color:var(--txt)}';
    s+='.rficon-val.is-active{background:var(--vc);border-color:var(--vc);color:#08090c;font-weight:700}';
    s+='.rficon-active{display:flex;gap:6px;flex-wrap:wrap}';
    s+='.rficon-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 4px 3px 9px;font-size:11px;font-weight:600;background:var(--vb);border:1px solid var(--vbd);color:var(--vc);border-radius:999px;line-height:1}';
    s+='.rficon-dot{width:6px;height:6px;border-radius:50%;background:var(--vc);flex-shrink:0}';
    s+='.rficon-x{background:rgba(255,255,255,.06);border:0;color:inherit;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;font-size:11px;line-height:1;font-weight:700;cursor:pointer;padding:0;font-family:inherit;margin-left:2px}';
    s+='.rficon-x:hover{background:var(--urgent-bg);color:var(--urgent)}';
    var st=document.createElement('style');st.id='rficon-css';st.textContent=s;document.head.appendChild(st);
  }
  function substituirFiltros(){
    var topo=document.querySelector('.rec-topbar');if(!topo)return;
    var velha=topo.querySelector('.rf');if(!velha||velha.dataset.rfi)return;
    var wrap=document.createElement('div');wrap.innerHTML=barHTML();
    var novo=wrap.firstChild;novo.dataset.rfi='1';
    velha.replaceWith(novo);
  }
  function substituirCentralPorDashboard(){
    if(typeof userCfg==='undefined'||typeof state==='undefined')return;
    if(userCfg.mode!=='recommend')return;
    if(state.view!=='central')return;
    var content=document.getElementById('content');if(!content)return;
    var sec=content.querySelector('section.view');
    if(!sec||sec.dataset.rfiDash)return;
    var fn=window.viewDashboards;
    if(typeof fn!=='function'&&window.VIEWS&&typeof VIEWS.dashboards==='function')fn=VIEWS.dashboards;
    if(typeof fn!=='function')return;
    try{
      sec.innerHTML=fn();
      sec.dataset.rfiDash='1';
      sec.classList.add('rfi-dash');
      var cab=document.querySelector('.topbar h1');
      if(cab&&/recomenda/i.test(cab.textContent||'')) cab.textContent='Dashboard da operação';
    }catch(e){}
  }
  function aplicar(){css();substituirFiltros();substituirCentralPorDashboard();}
  function iniciar(){
    var c=document.getElementById('content');
    if(!c){setTimeout(iniciar,200);return;}
    new MutationObserver(aplicar).observe(c,{childList:true,subtree:true});
    aplicar();
    setTimeout(aplicar,80);
    setTimeout(aplicar,300);
  }
  iniciar();
  document.addEventListener('click',function(ev){
    var el;
    el=ev.target.closest('[data-rficon-cat]');
    if(el){ev.preventDefault();ev.stopPropagation();var id=el.dataset.rficonCat;state._rfOpen=(state._rfOpen===id)?null:id;aplicar();return;}
    el=ev.target.closest('[data-rficon-apply]');
    if(el){ev.preventDefault();ev.stopPropagation();var p=el.dataset.rficonApply.split('|');setFiltro(p[0],p[1]);return;}
    el=ev.target.closest('[data-rficon-remove]');
    if(el){ev.preventDefault();ev.stopPropagation();rmSlot(parseInt(el.dataset.rficonRemove,10));return;}
    el=ev.target.closest('[data-rficon-clear]');
    if(el){ev.preventDefault();ev.stopPropagation();clearAll();return;}
  },true);
})();
