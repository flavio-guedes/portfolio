(function(){
  if(window.__criaLista) return; window.__criaLista=true;
  var CHAVE='hermes-os.v7.user';
  var NOME='Wha - Quentes - Mix - Decisor';
  var ID='LST-MIXDEC';

  function match(o){
    var temQ=false,temD=false;
    Object.keys(o).forEach(function(k){
      var v=String(o[k]||'').toLowerCase();
      if(v.indexOf('quent')>=0||v.indexOf('hot')>=0) temQ=true;
      if(v.indexOf('decisor')>=0||v.indexOf('decision')>=0) temD=true;
    });
    return temQ&&temD;
  }

  function soQuente(o){
    return Object.keys(o).some(function(k){
      var v=String(o[k]||'').toLowerCase();
      return v.indexOf('quent')>=0||v.indexOf('hot')>=0;
    });
  }

  function comWhats(o){
    var t=String(o.whatsapp||o.telefone||'');
    return t.length>=10;
  }

  function aplicar(){
    if(typeof state==='undefined'||!state.opportunities){setTimeout(aplicar,300);return;}
    var leads=state.opportunities;

    var ids=leads.filter(match).map(function(o){return o.id;});
    if(ids.length<20) ids=leads.filter(soQuente).map(function(o){return o.id;});
    if(ids.length<20) ids=leads.filter(comWhats).map(function(o){return o.id;});
    ids=ids.slice(0,83);

    var L={id:ID,nome:NOME,ids:ids,
      descricao:ids.length+' lead(s) · criada na aba Leads',
      criadaEm:new Date().toISOString()};

    try{
      state.listas=state.listas||[];
      state.listas=state.listas.filter(function(l){return l.id!==ID;});
      state.listas.push(L);
    }catch(e){}

    try{
      var s=JSON.parse(localStorage.getItem(CHAVE)||'{}');
      s.listas=(s.listas||[]).filter(function(l){return l.id!==ID;});
      s.listas.push(L);
      localStorage.setItem(CHAVE,JSON.stringify(s));
    }catch(e){}

    try{
      if(typeof loadUserStore==='function'&&typeof saveUserStore==='function'){
        var st=loadUserStore();
        st.listas=(st.listas||[]).filter(function(l){return l.id!==ID;});
        st.listas.push(L);
        saveUserStore(st);
      }
    }catch(e){}

    try{if(typeof render==='function')render();}catch(e){}
    console.log('[cria-lista] OK · '+ids.length+' ids');
  }
  aplicar();
  setTimeout(aplicar,1200);
})();
