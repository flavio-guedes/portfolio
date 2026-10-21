(function(){
  if(window.__fixLista) return; window.__fixLista=true;
  var ALVO  = /mix.*decisor|decisor.*mix/i;
  var CHAVE = 'hermes-os.v7.user';

  function acharEmTudo(){
    var a=[];
    try{(state.listas||[]).forEach(function(l){if(ALVO.test(l.nome||''))a.push(l)})}catch(e){}
    try{var s=JSON.parse(localStorage.getItem(CHAVE)||'{}');(s.listas||[]).forEach(function(l){if(ALVO.test(l.nome||''))a.push(l)})}catch(e){}
    try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k===CHAVE)continue;if(!/hermes|painel|epq|lista/i.test(k))continue;try{var v=JSON.parse(localStorage.getItem(k));(v.listas||[]).forEach(function(l){if(ALVO.test(l.nome||''))a.push(l)});if(Array.isArray(v))v.forEach(function(l){if(l&&l.nome&&ALVO.test(l.nome))a.push(l)})}catch(e){}}}catch(e){}
    return a;
  }

  function reconstruir(){
    var ids=[];
    try{
      (state.opportunities||[]).forEach(function(o){
        var t = String(o.temperatura||o.temp||'').toLowerCase();
        var c = String(o.cargo||o.papel||'').toLowerCase();
        if(t.indexOf('quent')>=0 && c.indexOf('decisor')>=0) ids.push(o.id);
      });
    }catch(e){}
    if(!ids.length) return null;
    return {id:'LST-'+Date.now(),nome:'Wha - Quentes - Mix - Decisor',ids:ids,
      descricao:ids.length+' lead(s) · criada na aba Leads',criadaEm:new Date().toISOString()};
  }

  function gravar(L){
    try{
      state.listas = state.listas||[];
      var ix = state.listas.findIndex(function(l){return ALVO.test(l.nome||'')});
      if(ix>=0) state.listas[ix]=L; else state.listas.push(L);
    }catch(e){}
    try{
      var s=JSON.parse(localStorage.getItem(CHAVE)||'{}');
      s.listas=s.listas||[];
      var iy=s.listas.findIndex(function(l){return ALVO.test(l.nome||'')});
      if(iy>=0) s.listas[iy]=L; else s.listas.push(L);
      localStorage.setItem(CHAVE,JSON.stringify(s));
    }catch(e){}
    try{ if(typeof saveUserStore==='function'){var st=loadUserStore();st.listas=state.listas;saveUserStore(st);} }catch(e){}
  }

  function aplicar(){
    if(typeof state==='undefined'){setTimeout(aplicar,250);return;}
    var achadas = acharEmTudo();
    var L=null;
    if(achadas.length){
      achadas.sort(function(a,b){return ((b.ids||[]).length)-((a.ids||[]).length)});
      var m=achadas[0];
      L={id:m.id||('LST-'+Date.now()),nome:m.nome||'Wha - Quentes - Mix - Decisor',
         ids:Array.isArray(m.ids)?m.ids.slice():[],
         descricao:m.descricao||((m.ids||[]).length+' lead(s) · criada na aba Leads'),
         criadaEm:m.criadaEm||new Date().toISOString()};
    } else {
      L = reconstruir();
    }
    if(!L||!L.ids.length){ console.log('[fix] nada a restaurar'); return; }
    gravar(L);
    try{ if(typeof render==='function') render(); }catch(e){}
    console.log('[fix] OK · '+L.nome+' · '+L.ids.length+' ids');
  }
  aplicar();
  setTimeout(aplicar,800);
  setTimeout(aplicar,2000);
})();
