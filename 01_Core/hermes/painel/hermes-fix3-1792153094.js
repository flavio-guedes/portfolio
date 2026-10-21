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
    if(typeof refreshRecommendSection==='function')refreshRecommendSection();
  }
  function rmSlot(i){if(!state.recommendFilter)return;state.recommendFilter['dim'+i]='none';state.recommendFilter['val'+i]='all';if(typeof refreshRecommendSection==='function')refreshRecommendSection();}
  function clearAll(){var c={};for(var i=1;i<=9;i++){c['dim'+i]='none';c['val'+i]='all';}c.count=0;state.recommendFilter=c;state._rfOpen=null;if(typeof refreshRecommendSection==='function')refreshRecommendSection();}
  function barHTML(){
    var a=ativos(),ab=state._rfOpen||null;
    var h='<div class="rfbadges" data-rfbadges><div class="rfbadges-cats">';
    CATS.forEach(function(C){
      var u=a.some(function(x){return x.dim===C.id;});
      h+='<button type="button" class="rfb-cat'+(ab===C.id?' is-open':'')+(u?' is-used':'')+'" data-rfb-cat="'+C.id+'" style="--c:'+C.color+';--cbg:'+rgba(C.color,.10)+';--cbd:'+rgba(C.color,.36)+'"><span class="rfb-i">'+C.ico+'</span><span>'+C.label+'</span></button>';
    });
    if(a.length)h+='<button type="button" class="rfb-clear" data-rfb-clear title="Limpar">×</button>';
    h+='</div>';
    if(ab){
      var C2=cat(ab);
      if(C2){
        h+='<div class="rfb-vals">';
        C2.values.forEach(function(v){
          var on=a.some(function(x){return x.dim===C2.id&&x.val===v.v;});
          h+='<button type="button" class="rfb-val'+(on?' is-active':'')+'" data-rfb-apply="'+C2.id+'|'+v.v+'" style="--vc:'+v.c+';--vb:'+rgba(v.c,.08)+';--vb2:'+rgba(v.c,.20)+';--vbd:'+rgba(v.c,.34)+'">'+v.v+'</button>';
        });
        h+='</div>';
      }
    }
    if(a.length){
      h+='<div class="rfb-active">';
      a.forEach(function(x){
        h+='<span class="rfb-chip" style="--vc:'+x.cor+';--vb:'+rgba(x.cor,.10)+';--vbd:'+rgba(x.cor,.40)+'"><span class="rfb-dot"></span>'+esc(x.val)+'<button type="button" class="rfb-x" data-rfb-remove="'+x.slot+'">×</button></span>';
      });
      h+='</div>';
    }
    h+='</div>';
    return h;
  }
  function cssInj(){
    if(document.getElementById('rfbadges-css'))return;
    var s='.rfbadges{display:flex;flex-direction:column;gap:8px;margin:8px 0 10px;font-family:inherit}';
    s+='.rfbadges-cats{display:flex;gap:6px;flex-wrap:wrap;align-items:center}';
    s+='.rfb-cat{padding:3px 10px 3px 8px;border:1px solid var(--line);background:rgba(255,255,255,.02);border-radius:999px;color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:.15s;font-family:inherit;font-size:10.5px;font-weight:600;line-height:1.5;position:relative}';
    s+='.rfb-i{display:inline-flex;width:11px;height:11px;color:var(--c);flex-shrink:0}';
    s+='.rfb-i svg{width:11px;height:11px;display:block}';
    s+='.rfb-cat:hover{border-color:var(--line2);background:rgba(255,255,255,.05);color:var(--txt)}';
    s+='.rfb-cat.is-open,.rfb-cat.is-used{color:var(--txt);background:var(--cbg);border-color:var(--cbd)}';
    s+='.rfb-cat.is-used .rfb-i,.rfb-cat.is-open .rfb-i{color:var(--c)}';
    s+='.rfb-clear{padding:3px 10px;border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:999px;cursor:pointer;font-family:inherit;font-size:10.5px;font-weight:700;line-height:1.5}';
    s+='.rfb-clear:hover{color:var(--urgent);border-color:var(--urgent-bd);background:var(--urgent-bg)}';
    s+='.rfb-vals{display:flex;gap:6px;flex-wrap:wrap;padding-left:2px}';
    s+='.rfb-val{padding:3px 11px;font-size:10.5px;font-weight:600;color:var(--vc);background:var(--vb);border:1px solid var(--vbd);border-radius:999px;cursor:pointer;transition:.15s;font-family:inherit;line-height:1.5}';
    s+='.rfb-val:hover{background:var(--vb2);color:var(--txt)}';
    s+='.rfb-val.is-active{background:var(--vc);border-color:var(--vc);color:#08090c;font-weight:700}';
    s+='.rfb-active{display:flex;gap:5px;flex-wrap:wrap}';
    s+='.rfb-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 3px 3px 9px;font-size:10.5px;font-weight:600;background:var(--vb);border:1px solid var(--vbd);color:var(--vc);border-radius:999px;line-height:1.5}';
    s+='.rfb-dot{width:5px;height:5px;border-radius:50%;background:var(--vc);flex-shrink:0}';
    s+='.rfb-x{background:rgba(255,255,255,.06);border:0;color:inherit;width:15px;height:15px;border-radius:50%;display:grid;place-items:center;font-size:10px;line-height:1;font-weight:700;cursor:pointer;padding:0;font-family:inherit;margin-left:2px}';
    s+='.rfb-x:hover{background:var(--urgent-bg);color:var(--urgent)}';
    s+='.rfbadges-f1-rm{display:none!important}';
    var st=document.createElement('style');st.id='rfbadges-css';st.textContent=s;document.head.appendChild(st);
  }
  function limparAntigos(){
    /* Remove blocos F1/F2 antigos (labels com texto "F1" ou "F2") e a .rf antiga */
    document.querySelectorAll('.rf').forEach(function(el){ el.remove(); });
    document.querySelectorAll('label, .form-group, .filter-group, .rec-filter-group').forEach(function(el){
      var t=(el.textContent||'').trim();
      if(t==='F1'||t==='F2'||t==='—'||t==='Escopo'||t==='Todas'){
        if(el.querySelector('select,input'))el.remove();
      }
    });
    /* Remove qualquer botão "+ filtro" / "− filtro" / "limpar" da zona de recomendação */
    document.querySelectorAll('button').forEach(function(b){
      var t=(b.textContent||'').trim().toLowerCase();
      if(t==='+ filtro'||t==='- filtro'||t==='+ filtro '||t==='− filtro'||t==='limpar'){
        if(b.closest('.rec-topbar')||b.closest('.card')&&b.closest('.card').querySelector('h2')) {
          if(!b.dataset.rfbClear && !b.classList.contains('rfb-clear')) b.remove();
        }
      }
    });
  }
  function troca(){
    cssInj();
    limparAntigos();
    /* Acha o lugar: dentro de .rec-topbar ou do card "Hermes recomenda" */
    var alvo=document.querySelector('.rec-topbar')||document.querySelector('.op-rec-top');
    if(!alvo)return;
    var exist=alvo.querySelector('[data-rfbadges]');
    var tmp=document.createElement('div');tmp.innerHTML=barHTML();
    var novo=tmp.firstChild;
    if(exist)exist.replaceWith(novo);
    else{
      /* Insere depois do stats strip (Pendente/...), se houver */
      var strip=alvo.querySelector('.rec-stat-strip');
      if(strip&&strip.parentNode)strip.parentNode.insertBefore(novo,strip.nextSibling);
      else alvo.insertBefore(novo,alvo.firstChild);
    }
  }
  function vigia(){
    var c=document.getElementById('content');
    if(!c){setTimeout(vigia,200);return;}
    new MutationObserver(troca).observe(c,{childList:true,subtree:true});
    troca();
    setTimeout(troca,150);
    setTimeout(troca,500);
    setTimeout(troca,1500);
  }
  vigia();

  document.addEventListener('click',function(ev){
    var el;
    el=ev.target.closest('[data-rfb-cat]');
    if(el){ev.preventDefault();ev.stopPropagation();var id=el.dataset.rfbCat;state._rfOpen=(state._rfOpen===id)?null:id;troca();return;}
    el=ev.target.closest('[data-rfb-apply]');
    if(el){ev.preventDefault();ev.stopPropagation();var p=el.dataset.rfbApply.split('|');setFiltro(p[0],p[1]);return;}
    el=ev.target.closest('[data-rfb-remove]');
    if(el){ev.preventDefault();ev.stopPropagation();rmSlot(parseInt(el.dataset.rfbRemove,10));return;}
    el=ev.target.closest('[data-rfb-clear]');
    if(el){ev.preventDefault();ev.stopPropagation();clearAll();return;}
  },true);
})();
