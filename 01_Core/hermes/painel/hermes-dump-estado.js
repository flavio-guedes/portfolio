(function(){
  if(window.__dumpEstado) return; window.__dumpEstado=true;
  function go(){
    if(typeof state==='undefined'){setTimeout(go,300);return;}
    var ac = state.actions||[];
    var cp = state.campaigns||[];
    var ls = state.listas||[];
    var st = {};
    ac.forEach(function(a){ var k=a.status||'(sem)'; st[k]=(st[k]||0)+1; });
    var porDia = {};
    ac.forEach(function(a){
      if(!a.prazo) return;
      var d = new Date(a.prazo).toISOString().slice(0,10);
      porDia[d]=(porDia[d]||0)+1;
    });
    var out = {
      quando: new Date().toISOString(),
      oportunidades: (state.opportunities||[]).length,
      listas: ls.map(function(l){ return {id:l.id, nome:l.nome, n:(l.ids||[]).length}; }),
      campanhas: cp.map(function(c){ return {id:c.id, nome:c.nome, status:c.status, leads:(c.publico&&c.publico.total)||0}; }),
      acoes_status: st,
      acoes_dia: porDia,
      acoes_total: ac.length,
      amostra: ac.slice(0,3).map(function(a){ return {id:a.id, empresa:a.empresa, tel:a.telefone, status:a.status, prazo:a.prazo, campanha:a.campaign_id}; })
    };
    var txt = JSON.stringify(out, null, 2);
    console.log(txt);
    try{
      var a = document.createElement('a');
      a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(txt);
      a.download = 'hermes-estado.json';
      document.body.appendChild(a); a.click(); a.remove();
    }catch(e){}
    if(window.__toastInfo) window.__toastInfo('Estado exportado', ac.length+' ações · '+cp.length+' campanhas');
  }
  go();
})();
