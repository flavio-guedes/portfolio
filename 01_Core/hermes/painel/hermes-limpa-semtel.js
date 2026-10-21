(function(){
  var n = 0;
  state.actions = (state.actions||[]).filter(function(a){
    if(a.status === 'SEM_TELEFONE'){ n++; return false; }
    return true;
  });
  if(n){
    try{ if(typeof loadUserStore==='function'&&typeof saveUserStore==='function'){var s=loadUserStore();s.acoes=state.actions;saveUserStore(s);} }catch(e){}
    try{ var s2=JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}'); s2.acoes=state.actions; localStorage.setItem('hermes-os.v7.user',JSON.stringify(s2)); }catch(e){}
  }
  if(typeof render==='function') render();
  if(window.__toastOK) window.__toastOK('Ações sem telefone removidas', n+' removidas');
  console.log('[limpa-semtel] removidas:', n);
})();
