(function(){
  function rgba(hex,a){hex=String(hex||'#888').replace('#','');if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];var r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);return 'rgba('+r+','+g+','+b+','+a+')';}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  var CATS=[
    {id:'contexto',label:'Tipo',color:'#94a3b8',
     ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
     values:[
       {v:'B2B',c:'#60a5fa'},{v:'Projeto',c:'#c084fc'},{v:'Vaga',c:'#fbbf24'},
       {v:'Parceria',c:'#22d3ee'},{v:'Comunidade',c:'#4ade80'},{v:'Terceirização',c:'#f472b6'}
     ]},
    {id:'canal',label:'Canal',color:'#60a5fa',
     ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7A2 2 0 0 1 22 16.9z"/></svg>',
     values:[
       {v:'WhatsApp',c:'#4ade80'},{v:'LinkedIn',c:'#7fb3e8'},
       {v:'E-mail',c:'#f3c76d'},{v:'Telefone',c:'#a78bfa'},{v:'Instagram',c:'#f472b6'}
     ]},
    {id:'estagio',label:'Estágio',color:'#22d3ee',
     ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></svg>',
     values:[
       {v:'Descoberta',c:'#60a5fa'},{v:'Qualificação',c:'#fbbf24'},{v:'Conversa',c:'#c084fc'},
       {v:'Proposta',c:'#22d3ee'},{v:'Fechado',c:'#4ade80'},{v:'Perdido',c:'#94a3b8'}
     ]},
    {id:'prioridade',label:'Prioridade',color:'#ff5b5b',
     ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
     values:[
       {v:'Alta',c:'#ff5b5b'},{v:'Média',c:'#fbbf24'},{v:'Baixa',c:'#94a3b8'}
     ]},
    {id:'grupo',label:'Grupo',color:'#e0b878',
     ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
     values:[
       {v:'A',c:'#e0b878'},{v:'B',c:'#60a5fa'},{v:'C',c:'#94a3b8'}
     ]},
    {id:'campanha',label:'Campanha',color:'#f472b6',
     ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11 16.5a2.5 2.5 0 1 1-5 0"/></svg>',
     values:'dynamic'}
  ];
  function findCat(id){for(var i=0;i<CATS.length;i++)if(CATS[i].id===id)return CATS[i];return null;}
  function valuesFor(cat){
    if(cat.values==='dynamic'){
      if(typeof state==='undefined'||!state.campaigns)return [];
      var cs=state.campaigns.filter(function(c){return !c.sugestao;});
      return cs.slice(0,12).map(function(c){return {v:c.id,l:c.nome,c:'#f472b6'};});
    }
    return cat.values.map(function(v){return {v:v.v,l:v.v,c:v.c};});
  }
  function setFiltro(cat,val){
    var f=state.filters||{};
    f[cat]=(f[cat]===val)?'all':val;
    state.filters=f;
    if(typeof render==='function')render();
  }
  function clearCat(cat){
    var f=state.filters||{};
    f[cat]='all';
    state.filters=f;
    if(typeof render==='function')render();
  }
  function clearAll(){
    var f=state.filters||{};
    Object.keys(f).forEach(function(k){f[k]='all';});
    state.filters=f;
    if(typeof render==='function')render();
  }

  function blockHTML(cat){
    var cur=(state.filters&&state.filters[cat.id])||'all';
    var vals=valuesFor(cat);
    var count=vals.length;
    var h='<div class="hfil-block" data-hfil-block="'+cat.id+'">';
    h+='<div class="hfil-label" style="--c:'+cat.color+'"><span class="hfil-i">'+cat.ico+'</span><span>'+cat.label+'</span></div>';
    h+='<div class="hfil-pills">';
    h+='<button type="button" class="hfil-pill'+(cur==='all'?' is-active':'')+'" data-hfil-set="'+cat.id+'|all" style="--c:'+cat.color+'">Todos</button>';
    if(count===0){
      h+='<span class="hfil-empty">—</span>';
    } else {
      vals.forEach(function(v){
        var isOn=cur===v.v;
        h+='<button type="button" class="hfil-pill'+(isOn?' is-active':'')+'" data-hfil-set="'+cat.id+'|'+esc(v.v)+'" style="--c:'+v.c+'" title="'+esc(v.l)+'">'+esc(v.l)+'</button>';
      });
    }
    h+='</div></div>';
    return h;
  }
  function barHTML(){
    var ativos=0;
    if(state&&state.filters){Object.keys(state.filters).forEach(function(k){if(state.filters[k]!=='all')ativos++;});}
    var h='<div class="hfil" data-hfil>';
    h+='<div class="hfil-head">';
    h+='<div class="hfil-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><path d="M3 6h18M6 12h12M10 18h4"/></svg> Filtros</div>';
    if(ativos)h+='<span class="hfil-badge">'+ativos+' ativo'+(ativos>1?'s':'')+'</span>';
    if(ativos)h+='<button type="button" class="hfil-clear" data-hfil-clear>limpar</button>';
    h+='</div>';
    h+='<div class="hfil-body">';
    CATS.forEach(function(c){h+=blockHTML(c);});
    h+='</div>';
    h+='</div>';
    return h;
  }
  function cssInj(){
    if(document.getElementById('hfil-css'))return;
    var s=''+
    '.hfil{margin:0;padding:10px 0 4px;border-top:1px solid var(--line);font-family:inherit}'+
    '.hfil-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted2)}'+
    '.hfil-title{display:inline-flex;align-items:center;gap:6px;color:var(--muted)}'+
    '.hfil-badge{background:var(--accent-bg);color:var(--accent);border:1px solid var(--accent-bd);border-radius:999px;padding:1px 7px;font-size:9.5px;letter-spacing:.06em}'+
    '.hfil-clear{margin-left:auto;background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:999px;padding:2px 9px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;text-transform:none;letter-spacing:0}'+
    '.hfil-clear:hover{color:var(--urgent);border-color:var(--urgent-bd);background:var(--urgent-bg)}'+
    '.hfil-body{display:flex;flex-direction:column;gap:6px}'+
    '.hfil-block{display:flex;align-items:flex-start;gap:12px;padding:2px 0}'+
    '.hfil-label{display:inline-flex;align-items:center;gap:6px;min-width:86px;flex-shrink:0;color:var(--muted);font-size:11px;font-weight:600;padding-top:3px}'+
    '.hfil-i{display:inline-flex;width:12px;height:12px;color:var(--c);flex-shrink:0}'+
    '.hfil-i svg{width:12px;height:12px;display:block}'+
    '.hfil-pills{display:flex;flex-wrap:wrap;gap:5px;min-width:0;flex:1}'+
    '.hfil-pill{padding:2px 10px;border-radius:999px;background:transparent;border:1px solid var(--c);color:var(--c);opacity:.78;font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;transition:.15s;line-height:1.5;white-space:nowrap;max-width:220px;overflow:hidden;text-overflow:ellipsis}'+
    '.hfil-pill:hover{opacity:1;background:color-mix(in srgb,var(--c) 12%,transparent)}'+
    '.hfil-pill.is-active{background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--txt);opacity:1;font-weight:700}'+
    '.hfil-empty{color:var(--muted2);font-size:11px;padding:2px 4px}'+
    '';
    var st=document.createElement('style');st.id='hfil-css';st.textContent=s;document.head.appendChild(st);
  }
  function place(){
    cssInj();
    var top=document.getElementById('topbar');if(!top)return;
    var old=top.querySelector('[data-hfil]');
    var html=barHTML();
    if(old){
      if(old.outerHTML!==html){
        var tmp=document.createElement('div');tmp.innerHTML=html;
        old.replaceWith(tmp.firstChild);
      }
    } else {
      var tmp2=document.createElement('div');tmp2.innerHTML=html;
      top.appendChild(tmp2.firstChild);
    }
  }
  function vigia(){
    if(!document.getElementById('topbar')){setTimeout(vigia,200);return;}
    new MutationObserver(place).observe(document.getElementById('topbar'),{childList:true,subtree:true});
    place();
    setTimeout(place,120);
    setTimeout(place,500);
  }
  vigia();
  document.addEventListener('click',function(ev){
    var el;
    el=ev.target.closest('[data-hfil-set]');
    if(el){ev.preventDefault();ev.stopPropagation();var p=el.dataset.hfilSet.split('|');setFiltro(p[0],p[1]);return;}
    el=ev.target.closest('[data-hfil-clear]');
    if(el){ev.preventDefault();ev.stopPropagation();clearAll();return;}
  },true);
})();
