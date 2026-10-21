(function(){
  function apply(){
    if(typeof userCfg==='undefined'){setTimeout(apply,200);return;}
    if(userCfg.__simpleV1)return;
    userCfg.__simpleV1=true;

    /* Mantém só: Central, Operação, Leads */
    var keep={central:1,execucao:1,oportunidades:1};
    userCfg.nav.forEach(function(n){ n.visible=!!keep[n.id]; });
    ['central','execucao','oportunidades'].forEach(function(id){
      if(!userCfg.nav.find(function(n){return n.id===id;})){
        var L={central:'Central',execucao:'Operação',oportunidades:'Leads'};
        var I={central:'◎',execucao:'◉',oportunidades:'◇'};
        userCfg.nav.push({id:id,ico:I[id],label:L[id],visible:true});
      }
    });
    userCfg.nav.forEach(function(n){
      if(n.id==='execucao') n.label='Operação';
      if(n.id==='oportunidades') n.label='Leads';
      if(n.id==='central') n.label='Central';
    });

    /* Esconde todos os modos */
    userCfg.modes.forEach(function(m){ m.visible=false; });
    userCfg.mode='explore';

    /* Sem filtros na barra lateral */
    userCfg.layout.filtersPosition='header';

    try{ saveConfig(); }catch(e){}
    if(typeof renderSidebar==='function') renderSidebar();
    if(typeof render==='function') render();
  }
  apply();

  /* CSS: esconde Modo, Filtros, separadores e rótulos de grupo */
  var css=''+
    '.sidebar .nav-sep{display:none!important}'+
    '.sidebar [data-section="modo"],.sidebar [data-toggle-section="modo"]{display:none!important}'+
    '.sidebar [data-section="filtros"],.sidebar [data-toggle-section="filtros"]{display:none!important}'+
    '.sidebar [data-toggle-section="workspace"]{display:none!important}'+
    '.sidebar .nav-group-label{display:none!important}'+
    '.sidebar .nav-group{margin-bottom:0!important;gap:0!important}'+
    '.header-nav.modes-nav,.footer-nav.modes-nav{display:none!important}'+
    '.topbar .modes-nav{display:none!important}'+
    '.app-footer .modes-nav{display:none!important}';
  var st=document.createElement('style'); st.id='hermes-simple-css'; st.textContent=css; document.head.appendChild(st);

  /* Rede de segurança: esconde qualquer botão de modo em header/footer */
  setInterval(function(){
    document.querySelectorAll('[data-mode]').forEach(function(b){
      if(b.closest('.header-nav')||b.closest('.footer-nav')) b.style.display='none';
    });
  },800);
})();
