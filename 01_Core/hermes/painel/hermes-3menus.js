(function(){
  function aplicar(){
    if(typeof userCfg==='undefined'||!userCfg.nav){setTimeout(aplicar,200);return;}
    var keep={central:1,fila:1,disparos:1};
    var mudou=false;
    userCfg.nav.forEach(function(n){
      var want=!!keep[n.id];
      if(n.visible!==want){n.visible=want;mudou=true;}
    });
    /* Garante que os 3 existam */
    ['central','fila','disparos'].forEach(function(id){
      if(!userCfg.nav.find(function(n){return n.id===id;})){
        var L={central:'Central',fila:'Fila',disparos:'Disparos'};
        var I={central:'◎',fila:'▤',disparos:'⚡'};
        userCfg.nav.push({id:id,ico:I[id],label:L[id],visible:true});
        mudou=true;
      }
    });
    if(mudou){
      try{saveConfig();}catch(e){}
      if(typeof renderSidebar==='function')renderSidebar();
    }
  }
  aplicar();
})();
