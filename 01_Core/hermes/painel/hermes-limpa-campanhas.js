(function(){
  if(window.__limpaCampanhas) return; window.__limpaCampanhas=true;

  var MANTER = 'WHA-MIXDEC';
  var CHAVE  = 'hermes-os.v7.user';

  function aplicar(){
    if(typeof state==='undefined'){ setTimeout(aplicar, 300); return; }

    var antes = (state.campaigns||[]).length;

    /* 1. state.campaigns */
    state.campaigns = (state.campaigns||[]).filter(function(c){ return c.id === MANTER; });

    /* 2. userStore via API */
    try{
      if(typeof loadUserStore==='function' && typeof saveUserStore==='function'){
        var st = loadUserStore();
        st.campanhas = (st.campanhas||[]).filter(function(c){ return c.id === MANTER; });
        /* limpa ações órfãs de campanhas removidas */
        st.acoes = (st.acoes||[]).filter(function(a){
          return !a.campaign_id || a.campaign_id === MANTER;
        });
        saveUserStore(st);
      }
    }catch(e){}

    /* 3. localStorage direto */
    try{
      var s = JSON.parse(localStorage.getItem(CHAVE)||'{}');
      s.campanhas = (s.campanhas||[]).filter(function(c){ return c.id === MANTER; });
      s.acoes = (s.acoes||[]).filter(function(a){
        return !a.campaign_id || a.campaign_id === MANTER;
      });
      localStorage.setItem(CHAVE, JSON.stringify(s));
    }catch(e){}

    /* 4. limpa ações em memória com campaign_id de campanhas removidas */
    state.actions = (state.actions||[]).filter(function(a){
      return !a.campaign_id || a.campaign_id === MANTER;
    });

    /* 5. limpa campanha expandida */
    if(state.campaignExpanded){
      Object.keys(state.campaignExpanded).forEach(function(k){
        if(k !== MANTER) delete state.campaignExpanded[k];
      });
    }

    if(typeof window.render==='function') window.render();

    var depois = (state.campaigns||[]).length;
    console.log('[limpa-campanhas] antes='+antes+' depois='+depois);
    if(window.__toastOK && antes !== depois){
      window.__toastOK('Campanhas limpas', (antes-depois)+' removidas · 1 mantida');
    }
  }

  aplicar();
  setTimeout(aplicar, 1200);
})();
