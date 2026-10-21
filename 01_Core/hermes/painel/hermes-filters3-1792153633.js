(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var CATS=[
    {id:'contexto',label:'Tipo',color:'#94a3b8',values:[{v:'B2B',c:'#60a5fa'},{v:'Projeto',c:'#c084fc'},{v:'Vaga',c:'#fbbf24'},{v:'Parceria',c:'#22d3ee'}]},
    {id:'canal',label:'Canal',color:'#60a5fa',values:[{v:'WhatsApp',c:'#4ade80'},{v:'LinkedIn',c:'#7fb3e8'},{v:'E-mail',c:'#f3c76d'},{v:'Telefone',c:'#a78bfa'}]},
    {id:'estagio',label:'Etapa',color:'#22d3ee',values:[{v:'Descoberta',c:'#60a5fa'},{v:'Qualificação',c:'#fbbf24'},{v:'Conversa',c:'#c084fc'},{v:'Proposta',c:'#22d3ee'},{v:'Fechado',c:'#4ade80'}]},
    {id:'prioridade',label:'Prioridade',color:'#ff5b5b',values:[{v:'Alta',c:'#ff5b5b'},{v:'Média',c:'#fbbf24'},{v:'Baixa',c:'#94a3b8'}]},
    {id:'grupo',label:'Grupo',color:'#e0b878',values:[{v:'A',c:'#e0b878'},{v:'B',c:'#60a5fa'},{v:'C',c:'#94a3b8'}]}
  ];
  function valuesFor(cat){
    if(cat.values==='dynamic'){
      if(typeof state==='undefined'||!state.campaigns)return [];
      return state.campaigns.filter(function(c){return !c.sugestao;}).slice(0,10).map(function(c){return {v:c.id,l:c.nome,c:'#f472b6'};});
    }
    return cat.values.map(function(v){return {v:v.v,l:v.v,c:v.c};});
  }
  function blockHTML(cat){
    var cur=(state.filters&&state.filters[cat.id])||'all';
    var vals=valuesFor(cat);
    var h='<div class="hf3-b">';
    h+='<span class="hf3-l">'+cat.label+'</span>';
    h+='<button type="button" class="hf3-p'+(cur==='all'?' on':'')+'" data-hf3="'+cat.id+'|all" style="--c:'+cat.color+'">·</button>';
    vals.forEach(function(v){
      var lbl=v.l;
      if(lbl.length>12)lbl=lbl.slice(0,11)+'…';
      h+='<button type="button" class="hf3-p'+(cur===v.v?' on':'')+'" data-hf3="'+cat.id+'|'+esc(v.v)+'" style="--c:'+v.c+'" title="'+esc(v.l)+'">'+esc(lbl)+'</button>';
    });
    h+='</div>';
    return h;
  }
  function barHTML(){
    var ativos=0;
    if(state&&state.filters){Object.keys(state.filters).forEach(function(k){if(state.filters[k]!=='all')ativos++;});}
    var h='<div class="hf3" data-hf3-bar>';
    h+='<div class="hf3-row">';
    CATS.forEach(function(c){h+=blockHTML(c);});
    h+='</div>';
    if(ativos)h+='<button type="button" class="hf3-x" data-hf3-clear title="Limpar">'+ativos+' ×</button>';
    h+='</div>';
    return h;
  }
  function cssInj(){
    if(document.getElementById('hf3-css'))return;
    var s=''+
    '.hf3{display:flex;align-items:center;gap:8px;padding:5px 0 4px;border-top:1px solid var(--line);margin-top:6px;font-family:inherit;width:100%;flex-basis:100%}'+
    '.hf3-row{display:flex;flex-wrap:wrap;gap:2px 10px;flex:1;min-width:0;align-items:center}'+
    '.hf3-b{display:inline-flex;align-items:center;gap:3px}'+
    '.hf3-l{color:var(--muted2);font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-right:2px;flex-shrink:0}'+
    '.hf3-p{padding:1px 7px;border:1px solid var(--c);background:transparent;color:var(--c);opacity:.75;font-family:inherit;font-size:10.5px;font-weight:600;border-radius:999px;cursor:pointer;line-height:1.4;white-space:nowrap;transition:.12s}'+
    '.hf3-p:hover{opacity:1;background:color-mix(in srgb,var(--c) 12%,transparent)}'+
    '.hf3-p.on{background:color-mix(in srgb,var(--c) 25%,transparent);color:var(--txt);opacity:1;font-weight:700}'+
    '.hf3-x{padding:1px 8px;border:1px solid var(--urgent-bd);background:var(--urgent-bg);color:var(--urgent);border-radius:999px;font-family:inherit;font-size:10.5px;font-weight:700;cursor:pointer;line-height:1.4;flex-shrink:0}'+
    '.hf3-x:hover{background:var(--urgent);color:#fff}'+
    '';
    var st=document.createElement('style');st.id='hf3-css';st.textContent=s;document.head.appendChild(st);
  }
  function place(){
    cssInj();
    var top=document.getElementById('topbar');if(!top)return;
    if(top.querySelector('[data-hf3-bar]'))return;
    var tmp=document.createElement('div');tmp.innerHTML=barHTML();
    top.appendChild(tmp.firstChild);
  }
  setInterval(place,400);
  place();
  document.addEventListener('click',function(ev){
    var el=ev.target.closest('[data-hf3]');
    if(el){ev.preventDefault();ev.stopPropagation();var p=el.dataset.hf3.split('|');var f=state.filters||{};f[p[0]]=(f[p[0]]===p[1])?'all':p[1];state.filters=f;if(typeof render==='function')render();return;}
    el=ev.target.closest('[data-hf3-clear]');
    if(el){ev.preventDefault();ev.stopPropagation();var f2=state.filters||{};Object.keys(f2).forEach(function(k){f2[k]='all';});state.filters=f2;if(typeof render==='function')render();return;}
  },true);
})();
