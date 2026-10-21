(function(){
  function css(){
    if(document.getElementById('nodrop-css'))return;
    var s=''+
    /* Some com os dropdowns do topbar (Contexto, Campanha, Canal, Estágio, Prioridade) */
    '.topbar .topbar-filters{display:none!important}'+
    '.topbar .filters{display:none!important}'+
    '.topbar .topbar-filters .filters{display:none!important}'+
    /* Esconde os filtros no sidebar e no rail também, se duplicados */
    '.side-filters,.rail-filters{display:none!important}'+
    /* Esconde os blocos "Métricas da operação" e "Leads que precisam de atenção" */
    '[data-nodrop-hide]{display:none!important}'+
    '';
    var st=document.createElement('style');st.id='nodrop-css';st.textContent=s;document.head.appendChild(st);
  }
  /* Esconde blocos pelo título */
  function esconderBlocos(){
    var titulos=['métricas da operação','metricas da operacao','leads que precisam de atenção','leads que precisam de atencao'];
    document.querySelectorAll('.card, .section-head, section').forEach(function(el){
      if(el.dataset.nodropChecked)return;
      var h=el.querySelector('h2,h3,.card-head h3,.section-head h2');
      if(!h)return;
      var t=(h.textContent||'').toLowerCase().trim();
      for(var i=0;i<titulos.length;i++){
        if(t===titulos[i]||t.indexOf(titulos[i])===0){
          /* Sobe até o container que faz sentido esconder */
          var alvo=el;
          if(el.classList.contains('section-head')) alvo=el.parentElement;
          if(alvo) alvo.setAttribute('data-nodrop-hide','1');
          el.dataset.nodropChecked='1';
          return;
        }
      }
    });
    /* Também esconde as linhas de KPI com "Métricas da operação" */
    document.querySelectorAll('.op-dash-item,.op-dash,.op-kpis').forEach(function(g){
      var t=(g.textContent||'').toLowerCase();
      if(t.indexOf('métricas da operação')>=0||t.indexOf('metricas da operacao')>=0){
        g.setAttribute('data-nodrop-hide','1');
      }
    });
  }
  function aplicar(){css();esconderBlocos();}
  function vigia(){
    var c=document.getElementById('content')||document.body;
    new MutationObserver(aplicar).observe(c,{childList:true,subtree:true});
    aplicar();
    setTimeout(aplicar,150);
    setTimeout(aplicar,600);
    setTimeout(aplicar,1500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',vigia); else vigia();
})();
