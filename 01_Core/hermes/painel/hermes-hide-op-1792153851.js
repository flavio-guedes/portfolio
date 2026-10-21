(function(){
  function aplicar(){
    if(typeof userCfg==='undefined'||!userCfg.nav){setTimeout(aplicar,200);return;}
    var mudou=false;
    userCfg.nav.forEach(function(n){
      if((n.id==='execucao'||n.id==='oportunidades')&&n.visible!==false){
        n.visible=false;mudou=true;
      }
    });
    if(mudou){
      try{saveConfig();}catch(e){}
      if(typeof renderSidebar==='function')renderSidebar();
      if(typeof render==='function')render();
    }
  }
  aplicar();
})();
