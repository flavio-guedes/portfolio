(function(){
  if(window.__push) return; window.__push=true;
  function push(){
    try{
      if(!window.state || !state.opportunities || !state.opportunities.length) return;
      fetch('http://127.0.0.1:8090/api/push', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          opportunities: state.opportunities,
          listas: state.listas || [],
          campanhas: state.campaigns || [],
          acoes: state.actions || []
        })
      }).then(function(r){return r.json();}).then(function(j){
        console.log('[push] enviado:', JSON.stringify(j.recebido));
      }).catch(function(e){ console.log('[push] erro:', e.message); });
    }catch(e){}
  }
  setTimeout(push, 2000);
  setTimeout(push, 5000);
  setTimeout(push, 10000);
})();
