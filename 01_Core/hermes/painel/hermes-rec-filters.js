(function(){
  function hex2rgba(h,a){h=h.replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return 'rgba('+r+','+g+','+b+','+a+')';}
  var CATS=[
    {id:'canal',label:'Canal',color:'#60a5fa',values:[
      {v:'WhatsApp',c:'#4ade80'},{v:'LinkedIn',c:'#7fb3e8'},
      {v:'E-mail',c:'#f3c76d'},{v:'Telefone',c:'#a78bfa'},{v:'Instagram',c:'#f472b6'}
    ],ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1a10 10 0 0 1 0-14.2"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4"/><path d="M19.1 4.9a10 10 0 0 1 0 14.2"/><circle cx="12" cy="12" r="1"/></svg>'},
    {id:'prioridade',label:'Prioridade',color:'#ff5b5b',values:[
      {v:'Alta',c:'#ff5b5b'},{v:'Média',c:'#fbbf24'},{v:'Baixa',c:'#94a3b8'}
    ],ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'},
    {id:'estagio',label:'Estágio',color:'#22d3ee',values:[
      {v:'Descoberta',c:'#60a5fa'},{v:'Qualificação',c:'#fbbf24'},{v:'Conversa',c:'#c084fc'},
      {v:'Proposta',c:'#22d3ee'},{v:'Fechado',c:'#4ade80'},{v:'Perdido',c:'#94a3b8'}
    ],ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></svg>'},
    {id:'grupo',label:'Grupo',color:'#e0b878',values:[
      {v:'A',c:'#e0b878'},{v:'B',c:'#60a5fa'},{v:'C',c:'#94a3b8'}
    ],ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>'},
    {id:'perfil',label:'Perfil',color:'#c084fc',values:[
      {v:'Decisor',c:'#c084fc'},{v:'Gestor',c:'#f472b6'},{v:'Recrutador',c:'#22d3ee'},
      {v:'Execução',c:'#94a3b8'},{v:'Outro',c:'#6b7280'}
    ],ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>'}
  ];
  function findCat(id){for(var i=0;i<CATS.length;i++)if(CATS[i].id===id)return CATS[i];return null;}
  function findVal(cat,v){if(!cat)return null;for(var i=0;i<cat.values.length;i++)if(cat.values[i].v===v)return cat.values[i];return null;}
  function getAtivos(){
    var cur=(typeof state!=='undefined'&&state.recommendFilter)||{};
    var ativos=[];
    for(var i=1;i<=9;i++){
      var d=cur['dim'+i],v=cur['val'+i];
      if(d&&d!=='none'&&v&&v!=='all'){
        var cat=findCat(d);
        if(cat){var val=findVal(cat,v);ativos.push({slot:i,dim:d,val:v,cat:cat,cor:val?val.c:cat.color});}
      }
    }
    return ativos;
  }
  window.recommendFiltersBar=function(){
    var ativos=getAtivos();
    var aberta=(typeof state!=='undefined')?(state._rfOpen||null):null;
    var h='<div class="rf">';
    h+='<div class="rf-cats">';
    CATS.forEach(function(cat){
      var usada=ativos.some(function(a){return a.dim===cat.id;});
      h+='<button type="button" class="rf-cat'+(aberta===cat.id?' is-open':'')+(usada?' is-used':'')+'" data-rf-cat="'+cat.id+'" style="--c:'+cat.color+';--c-bg:'+hex2rgba(cat.color,.12)+';--c-bd:'+hex2rgba(cat.color,.5)+'" title="'+cat.label+'"><span class="rf-cat-i">'+cat.ico+'</span>'+cat.label+'</button>';
    });
    if(ativos.length) h+='<button type="button" class="rf-clear" data-rf-clear-all title="Limpar filtros">limpar</button>';
    h+='</div>';
    if(aberta){
      var cat2=findCat(aberta);
      if(cat2){
        h+='<div class="rf-vals" style="--c:'+cat2.color+'">';
        cat2.values.forEach(function(val){
          var isOn=ativos.some(function(a){return a.dim===cat2.id&&a.val===val.v;});
          h+='<button type="button" class="rf-val'+(isOn?' is-active':'')+'" data-rf-apply="'+cat2.id+'|'+val.v+'" style="--vc:'+val.c+';--vc-bg:'+hex2rgba(val.c,.08)+';--vc-bg2:'+hex2rgba(val.c,.18)+';--vc-bd:'+hex2rgba(val.c,.28)+'">'+val.v+'</button>';
        });
        h+='</div>';
      }
    }
    if(ativos.length){
      h+='<div class="rf-active">';
      ativos.forEach(function(a){
        h+='<span class="rf-chip" style="--vc:'+a.cor+';--vc-bg:'+hex2rgba(a.cor,.10)+';--vc-bd:'+hex2rgba(a.cor,.4)+'"><span class="rf-chip-dot"></span>'+a.val+'<button type="button" class="rf-x" data-rf-remove="'+a.slot+'">×</button></span>';
      });
      h+='</div>';
    }
    h+='</div>';
    return h;
  };
  document.addEventListener('click',function(ev){
    var el;
    el=ev.target.closest('[data-rf-cat]');
    if(el){
      ev.preventDefault();ev.stopPropagation();
      var id=el.dataset.rfCat;
      state._rfOpen=(state._rfOpen===id)?null:id;
      if(typeof refreshRecommendSection==='function')refreshRecommendSection();else if(typeof render==='function')render();
      return;
    }
    el=ev.target.closest('[data-rf-apply]');
    if(el){
      ev.preventDefault();ev.stopPropagation();
      var p=el.dataset.rfApply.split('|'),dim=p[0],val=p[1];
      var cur=state.recommendFilter||{};
      var exist=-1;
      for(var i=1;i<=9;i++) if(cur['dim'+i]===dim&&cur['val'+i]===val){exist=i;break;}
      if(exist>0){cur['dim'+exist]='none';cur['val'+exist]='all';}
      else{
        var slot=0;
        for(var j=1;j<=9;j++) if(!cur['dim'+j]||cur['dim'+j]==='none'){slot=j;break;}
        if(!slot) for(var k=1;k<=9;k++) if(cur['dim'+k]===dim){slot=k;break;}
        if(!slot) slot=1;
        cur['dim'+slot]=dim;cur['val'+slot]=val;
      }
      cur.count=[1,2,3,4,5,6,7,8,9].filter(function(x){return cur['dim'+x]&&cur['dim'+x]!=='none';}).length;
      state.recommendFilter=cur;
      if(typeof refreshRecommendSection==='function')refreshRecommendSection();else if(typeof render==='function')render();
      return;
    }
    el=ev.target.closest('[data-rf-remove]');
    if(el){
      ev.preventDefault();ev.stopPropagation();
      var i2=parseInt(el.dataset.rfRemove,10);
      if(state.recommendFilter){state.recommendFilter['dim'+i2]='none';state.recommendFilter['val'+i2]='all';}
      if(typeof refreshRecommendSection==='function')refreshRecommendSection();else if(typeof render==='function')render();
      return;
    }
    el=ev.target.closest('[data-rf-clear-all]');
    if(el){
      ev.preventDefault();ev.stopPropagation();
      var c={};
      for(var i3=1;i3<=9;i3++){c['dim'+i3]='none';c['val'+i3]='all';}
      c.count=0;
      state.recommendFilter=c;
      state._rfOpen=null;
      if(typeof refreshRecommendSection==='function')refreshRecommendSection();else if(typeof render==='function')render();
      return;
    }
  },true);
  var css='';
  css+='.rf{margin:0 0 14px;display:flex;flex-direction:column;gap:8px}';
  css+='.rf-cats{display:flex;gap:6px;flex-wrap:wrap;align-items:center}';
  css+='.rf-cat{padding:5px 11px 5px 9px;border:1px solid var(--line);background:rgba(255,255,255,.02);border-radius:999px;color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:.15s;font-family:inherit;font-size:11.5px;font-weight:600;position:relative}';
  css+='.rf-cat-i{display:inline-flex;width:13px;height:13px;color:var(--c);flex-shrink:0}';
  css+='.rf-cat-i svg{width:13px;height:13px;display:block}';
  css+='.rf-cat:hover{border-color:var(--line2);background:rgba(255,255,255,.05);color:var(--txt)}';
  css+='.rf-cat.is-open{background:var(--c-bg);border-color:var(--c-bd);color:var(--txt)}';
  css+='.rf-cat.is-used{color:var(--txt);background:var(--c-bg);border-color:var(--c-bd)}';
  css+='.rf-cat.is-used::after{content:"";position:absolute;top:-2px;right:-2px;width:7px;height:7px;background:var(--c);border-radius:50%;border:1.5px solid var(--bg)}';
  css+='.rf-clear{margin-left:auto;padding:5px 11px;border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:999px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;transition:.15s}';
  css+='.rf-clear:hover{color:var(--urgent);border-color:var(--urgent-bd);background:var(--urgent-bg)}';
  css+='.rf-vals{display:flex;gap:6px;flex-wrap:wrap;padding:4px 0 4px 10px;position:relative;animation:rfFade .18s}';
  css+='@keyframes rfFade{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}';
  css+='.rf-vals::before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:2px;border-radius:2px;background:var(--c);opacity:.6}';
  css+='.rf-val{padding:4px 11px;font-size:11px;font-weight:600;color:var(--vc);background:var(--vc-bg);border:1px solid var(--vc-bd);border-radius:999px;cursor:pointer;transition:.15s;font-family:inherit;white-space:nowrap}';
  css+='.rf-val:hover{background:var(--vc-bg2);color:var(--txt)}';
  css+='.rf-val.is-active{background:var(--vc);border-color:var(--vc);color:#08090c;font-weight:700}';
  css+='.rf-active{display:flex;gap:6px;flex-wrap:wrap;padding-top:2px}';
  css+='.rf-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 4px 3px 9px;font-size:11px;font-weight:600;background:var(--vc-bg);border:1px solid var(--vc-bd);color:var(--vc);border-radius:999px;line-height:1}';
  css+='.rf-chip-dot{width:6px;height:6px;border-radius:50%;background:var(--vc);flex-shrink:0}';
  css+='.rf-x{background:rgba(255,255,255,.06);border:0;color:inherit;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;font-size:11px;line-height:1;font-weight:700;cursor:pointer;padding:0;font-family:inherit;margin-left:2px}';
  css+='.rf-x:hover{background:var(--urgent-bg);color:var(--urgent)}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
})();
