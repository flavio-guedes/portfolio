(function(){
  try{
    var _orig=window.applyData;
    if(typeof _orig==='function'){
      window.applyData=function(data){
        _orig(data);
        try{
          var store=loadUserStore();
          var idx=new Map(state.campaigns.map(function(c){return [c.id,c];}));
          (store.campanhas||[]).forEach(function(c){
            if(idx.has(c.id)) Object.assign(idx.get(c.id), c);
            else state.campaigns.push(c);
          });
        }catch(e){}
      };
    }
  }catch(e){}
  window.setCampaignStatus=function(id,status){
    var c=(state.campaigns||[]).filter(function(x){return x.id===id;})[0];
    if(!c) return false;
    c.status=status;
    try{
      var store=loadUserStore();
      var u=(store.campanhas||[]).filter(function(x){return x.id===id;})[0];
      if(u){ u.status=status; }
      else { store.campanhas.push(JSON.parse(JSON.stringify(c))); }
      saveUserStore(store);
    }catch(e){}
    if(typeof render==='function') render();
    return true;
  };
})();
