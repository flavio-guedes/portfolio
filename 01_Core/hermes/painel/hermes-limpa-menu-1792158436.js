(function(){
  function aplicar(){
    if(typeof userCfg==='undefined'||!userCfg.nav){setTimeout(aplicar,200);return;}

    /* 1) Só estes 3 menus visíveis */
    var keep={central:1,fila:1,disparos:1};
    userCfg.nav.forEach(function(n){
      var id=String(n.id||'').toLowerCase();
      var label=String(n.label||'').toLowerCase();
      /* esconde se não está no keep OU se é modo/leads/oportunidades/prospecção */
      if(!keep[id] || id==='modo' || id==='leads' || id==='oportunidades' ||
         label.indexOf('modo')>=0 || label.indexOf('lead')>=0 ||
         label.indexOf('prospec')>=0 || label.indexOf('oportunidade')>=0){
        n.visible=false;
      } else {
        n.visible=true;
      }
    });

    /* 2) Modo nunca visível no config */
    if(userCfg.modes){ userCfg.modes.forEach(function(m){ m.visible=false; }); }
    if(userCfg.layout){ userCfg.layout.filtersPosition='header'; }
    if(userCfg.layout){ userCfg.layout.modesPosition='sidebar'; }

    try{ if(typeof saveConfig==='function') saveConfig(); }catch(e){}

    /* 3) Remove "Modo" e "Leads/Prospecção" de qualquer VIEWS/TITLES */
    try{
      if(typeof VIEWS!=='undefined'){
        delete VIEWS.modo; delete VIEWS.leads; delete VIEWS.oportunidades;
      }
      if(typeof TITLES!=='undefined'){
        delete TITLES.modo; delete TITLES.leads; delete TITLES.oportunidades;
      }
    }catch(e){}

    /* 4) Se a view atual for uma das removidas, joga pra Fila */
    if(state && (state.view==='modo'||state.view==='leads'||state.view==='oportunidades')){
      state.view='fila';
      if(typeof render==='function') render();
    }

    if(typeof renderSidebar==='function') renderSidebar();
  }
  aplicar();
  setTimeout(aplicar,600);
  setInterval(aplicar,1500);

  /* 5) CSS extra: mata qualquer resquício do menu Modo e itens de prospecção */
  var css=''+
    '.sidebar [data-section="modo"],.sidebar [data-toggle-section="modo"],'+
    '.sidebar [data-mode],.header-nav.modes-nav,.footer-nav.modes-nav,'+
    '.topbar .modes-nav,.app-footer .modes-nav{display:none!important}'+
    '.sidebar [data-nav="modo"],.sidebar [data-nav="leads"],'+
    '.sidebar [data-nav="oportunidades"]{display:none!important}';
  var st=document.createElement('style');
  st.id='limpa-menu-css';
  st.textContent=css;
  document.head.appendChild(st);
})();
