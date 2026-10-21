(function(){
  if(window.__leadsLimpo) return; window.__leadsLimpo=true;
  var KEEP_RE = /mix.*decisor|decisor.*mix/i;

  function filtraL(l){ return KEEP_RE.test(String(l.nome||l.name||'')); }

  function aplicar(){
    if(typeof state==='undefined'||typeof userCfg==='undefined'){setTimeout(aplicar,300);return;}

    /* 1) Reabilita Leads no menu */
    if(!userCfg.nav.find(function(n){return n.id==='leads';})){
      var idx=userCfg.nav.findIndex(function(n){return n.id==='central';});
      var pos=idx>=0?idx+1:userCfg.nav.length;
      userCfg.nav.splice(pos,0,{id:'leads',ico:'◇',label:'Leads',visible:true});
    }
    userCfg.nav.forEach(function(n){
      if(n.id==='leads') n.visible=true;
      if(n.id==='central'||n.id==='fila'||n.id==='disparos') n.visible=true;
      if(n.id==='modo'||n.id==='oportunidades') n.visible=false;
    });
    try{saveConfig();}catch(e){}

    /* 2) Filtra listas salvas: só "Wha - Quentes - Mix - Decisor" */
    try{ state.listas=(state.listas||[]).filter(filtraL); }catch(e){}

    try{
      var raw=localStorage.getItem('hermes-os.v7.user');
      if(raw){
        var st=JSON.parse(raw);
        st.listas=(st.listas||[]).filter(filtraL);
        /* remove campanha derivada da lista de 16 OUT, se existir */
        st.campanhas=(st.campanhas||[]).filter(function(c){
          return !/16 OUT|sele(ç|c)(ã|a)o/i.test(String(c.nome||''));
        });
        localStorage.setItem('hermes-os.v7.user',JSON.stringify(st));
      }
    }catch(e){}

    if(typeof renderSidebar==='function')renderSidebar();
    if(typeof render==='function')render();
  }
  aplicar();
  setTimeout(aplicar,900);
  setTimeout(aplicar,1800);
})();
