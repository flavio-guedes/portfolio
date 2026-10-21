(function(){
  function go(){
    if(!window.state||!state.opportunities||!state.opportunities.length){setTimeout(go,500);return;}
    var L=(state.listas||[]).find(function(l){return /mix/i.test(l.nome||'');});
    if(!L){document.title='SEM LISTA · total listas: '+((state.listas||[]).length);return;}
    var id=L.ids[0];
    var lead=state.opportunities.find(function(o){return o.id===id;});
    if(!lead){document.title='ID ORFAO: '+id+' · opps='+state.opportunities.length;return;}
    var campos=Object.keys(lead).filter(function(k){
      var v=lead[k];
      return typeof v==='string' && v.length>0;
    });
    document.title=id.slice(0,20)+' · '+campos.join('|');
    console.log('=== LEAD ===', lead);
  }
  go();
})();
