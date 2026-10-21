(function(){
  function agir(){
    if(typeof state==='undefined'){ setTimeout(agir,200); return; }
    if(window.__filaLimpa) return;
    window.__filaLimpa = true;
    var ids = (state.actions||[]).map(function(a){ return String(a.id); });
    if(!ids.length) return;
    var store = {};
    try{ store = JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}'); }catch(e){}
    var newDead = (store.acoesExcluidas||[]).slice();
    ids.forEach(function(id){ if(newDead.indexOf(id)<0) newDead.push(id); });
    store.acoesExcluidas = newDead;
    store.acoes = [];
    try{ localStorage.setItem('hermes-os.v7.user', JSON.stringify(store)); }catch(e){}
    state.actions = [];
    if(typeof render==='function') render();
    setTimeout(function(){ location.reload(); }, 400);
  }
  agir();
})();
