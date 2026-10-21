(function(){
  /* 1) Backup completo antes */
  function backup(){
    var out={geradoEm:new Date().toISOString(),state_campaigns:[],userStore:null,acoes:[]};
    try{out.state_campaigns=JSON.parse(JSON.stringify(state.campaigns||[]));}catch(e){}
    try{
      var raw=localStorage.getItem('hermes-os.v7.user');
      if(raw)out.userStore=JSON.parse(raw);
    }catch(e){}
    try{out.acoes=JSON.parse(JSON.stringify(state.actions||[]));}catch(e){}
    var txt=JSON.stringify(out,null,2);
    try{
      var a=document.createElement('a');
      a.href='data:application/json;charset=utf-8,'+encodeURIComponent(txt);
      a.download='backup-campanhas-'+Date.now()+'.json';
      document.body.appendChild(a);a.click();a.remove();
    }catch(e){}
    return out.state_campaigns.length;
  }

  /* 2) Limpa tudo */
  function limpar(){
    var antes=(state.campaigns||[]).length;
    var acoesAntes=(state.actions||[]).length;

    /* Remove do state */
    state.campaigns=[];
    state.campaignExpanded={};

    /* Remove ações ligadas a campanhas */
    state.actions=(state.actions||[]).filter(function(a){return !a.campaign_id;});

    /* Remove do userStore (localStorage) */
    try{
      var raw=localStorage.getItem('hermes-os.v7.user');
      var store=raw?JSON.parse(raw):{campanhas:[],listas:[],leadsExtras:[],acoes:[],acoesExcluidas:[]};
      store.campanhas=[];
      store.acoes=(store.acoes||[]).filter(function(a){return !a.campaign_id;});
      store.acoesExcluidas=[];
      localStorage.setItem('hermes-os.v7.user',JSON.stringify(store));
    }catch(e){}

    return {campanhasRemovidas:antes,acoesRemovidas:acoesAntes-(state.actions||[]).length};
  }

  var n=backup();
  var r=limpar();
  var msg='BACKUP BAIXADO.\n\nAntes: '+r.campanhasRemovidas+' campanhas, '+r.acoesRemovidas+' ações ligadas.\nDepois: 0 campanhas.\n\nAgora recarregue a página (Cmd+Shift+R).';
  var el=document.createElement('pre');
  el.style.cssText='position:fixed;inset:0;background:#000;color:#0f0;font:14px monospace;padding:30px;z-index:999999;white-space:pre-wrap';
  el.textContent=msg;
  el.onclick=function(){el.remove();location.reload();};
  document.body.appendChild(el);
})();
