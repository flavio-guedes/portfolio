(function(){
  if(window.__export) return; window.__export=true;
  function go(){
    if(typeof state==='undefined' || !state.opportunities || !state.opportunities.length){
      setTimeout(go, 500); return;
    }
    var L = (state.listas||[]).find(function(l){ return /mix.*decisor/i.test(l.nome||''); });
    if(!L){
      var s = JSON.stringify((state.listas||[]).map(function(l){return l.nome;}));
      if(window.__toastErro) window.__toastErro('Lista não encontrada', 'tenho: '+s);
      return;
    }
    var porId = {};
    state.opportunities.forEach(function(o){ porId[o.id]=o; });
    var amostra = L.ids.slice(0, 5).map(function(id){ return porId[id] || {id:id, _erro:'não achado'}; });
    var out = {
      quando: new Date().toISOString(),
      oportunidades_total: state.opportunities.length,
      lista: { id:L.id, nome:L.nome, n:L.ids.length },
      amostra_leads: amostra,
      campos_do_primeiro: state.opportunities[0] ? Object.keys(state.opportunities[0]) : []
    };
    var txt = JSON.stringify(out, null, 2);
    try{
      var a = document.createElement('a');
      a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(txt);
      a.download = 'hermes-export.json';
      document.body.appendChild(a); a.click(); a.remove();
      if(window.__toastOK) window.__toastOK('Exportado', 'hermes-export.json → Downloads');
    }catch(e){
      if(window.__toastErro) window.__toastErro('Falha', e.message);
    }
    console.log(txt);
  }
  go();
})();
