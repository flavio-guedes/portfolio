(function(){
  function limpar(){
    /* Zera state */
    if(typeof state!=='undefined'){
      state.campaigns=[];
      state.actions=[];
      state.campaignExpanded={};
    }
    /* Zera localStorage das campanhas/ações */
    try{
      var raw=localStorage.getItem('hermes-os.v7.user');
      var s=raw?JSON.parse(raw):{campanhas:[],listas:[],leadsExtras:[],acoes:[],acoesExcluidas:[]};
      s.campanhas=[];
      s.acoes=[];
      s.acoesExcluidas=[];
      localStorage.setItem('hermes-os.v7.user',JSON.stringify(s));
    }catch(e){}
  }
  function configurarMenu(){
    if(typeof userCfg==='undefined'||!userCfg.nav)return false;
    var antes=userCfg.nav.length;
    userCfg.nav=userCfg.nav.filter(function(n){return n.id==='fila';});
    if(!userCfg.nav.find(function(n){return n.id==='fila';})){
      userCfg.nav.push({id:'fila',ico:'▤',label:'Fila',visible:true});
    }
    try{saveConfig();}catch(e){}
    return userCfg.nav.length!==antes;
  }
  function forcarFila(){
    if(typeof state==='undefined')return;
    if(state.view!=='fila'){
      state.view='fila';
      if(typeof render==='function')render();
    }
  }
  function aplicar(){
    if(typeof state==='undefined'||typeof userCfg==='undefined'){setTimeout(aplicar,300);return;}
    limpar();
    if(configurarMenu()){ if(typeof renderSidebar==='function')renderSidebar(); }
    forcarFila();
    if(window.__modoLimpoOk)return;
    window.__modoLimpoOk=true;
    /* Reaplica quando render() roda */
    var orig=window.render;
    if(typeof orig==='function'){
      window.render=function(){
        var r=orig.apply(this,arguments);
        setTimeout(function(){
          if(state.campaigns.length)state.campaigns=[];
          if(state.view!=='fila'){state.view='fila';orig.call(window);}
        },30);
        return r;
      };
    }
  }
  aplicar();
})();
