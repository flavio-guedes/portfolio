(function(){
  if(window.__delModo) return; window.__delModo=true;

  function aplicar(){
    if(typeof state==='undefined'||typeof userCfg==='undefined'){ setTimeout(aplicar,300); return; }

    /* 1. Remove "modo" da navegação */
    if(userCfg.nav){
      userCfg.nav = userCfg.nav.filter(function(n){
        return n.id!=='modo' && !/^modo$/i.test(String(n.label||''));
      });
    }

    /* 2. Desativa modos no config */
    if(userCfg.modes){
      userCfg.modes.forEach(function(m){ m.visible=false; });
    }
    try{ userCfg.mode = null; }catch(e){}

    /* 3. Remove VIEWS.modo e TITLES.modo */
    try{ if(typeof VIEWS!=='undefined') delete VIEWS.modo; }catch(e){}
    try{ if(typeof TITLES!=='undefined') delete TITLES.modo; }catch(e){}

    /* 4. Se a view atual é modo, joga pra fila */
    try{
      if(state.view==='modo'){
        state.view='fila';
        if(typeof render==='function') render();
      }
    }catch(e){}

    try{ if(typeof saveConfig==='function') saveConfig(); }catch(e){}
    try{ if(typeof renderSidebar==='function') renderSidebar(); }catch(e){}
  }

  /* CSS: esconde qualquer resquício visual do Modo */
  var css = ''+
    '.sidebar [data-nav="modo"],'+
    '.sidebar [data-section="modo"],'+
    '.sidebar [data-toggle-section="modo"],'+
    '.sidebar a[href*="modo"],'+
    '.sidebar button[data-view="modo"],'+
    '[data-mode],'+
    '.modes-nav,'+
    '.mode-switch{display:none!important}'+
    '.sidebar [data-nav="modo"] + *{display:none!important}';

  if(!document.getElementById('del-modo-css')){
    var s=document.createElement('style'); s.id='del-modo-css'; s.textContent=css;
    document.head.appendChild(s);
  }

  aplicar();
  setTimeout(aplicar, 800);
  setTimeout(aplicar, 2000);
})();
