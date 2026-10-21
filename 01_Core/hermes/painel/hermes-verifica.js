(function(){
  if(window.__verifica) return; window.__verifica=true;
  function go(){
    if(typeof state==='undefined'){setTimeout(go,300);return;}
    var ac = state.actions||[];
    var cp = state.campaigns||[];
    var ls = state.listas||[];
    var total = ac.length;
    var st = {};
    ac.forEach(function(a){ var k=a.status||'(sem)'; st[k]=(st[k]||0)+1; });
    var porDia = {};
    ac.forEach(function(a){
      if(!a.prazo) return;
      var d = new Date(a.prazo).toISOString().slice(0,10);
      porDia[d]=(porDia[d]||0)+1;
    });
    var linhas = [
      '== ESTADO ATUAL ==',
      '',
      'oportunidades: '+(state.opportunities||[]).length,
      'listas:        '+ls.length,
      'campanhas:     '+cp.length,
      'ações:         '+total,
      '',
      '-- LISTAS --'
    ];
    ls.forEach(function(l){ linhas.push('  '+l.id+' | '+l.nome+' | '+(l.ids||[]).length+' ids'); });
    linhas.push('');
    linhas.push('-- CAMPANHAS --');
    cp.forEach(function(c){ linhas.push('  '+c.id+' | '+c.nome+' | '+c.status+' | '+(c.publico&&c.publico.total||0)+' lead(s)'); });
    linhas.push('');
    linhas.push('-- AÇÕES POR STATUS --');
    Object.keys(st).sort().forEach(function(k){ linhas.push('  '+k+': '+st[k]); });
    linhas.push('');
    linhas.push('-- AÇÕES POR DIA --');
    Object.keys(porDia).sort().forEach(function(k){ linhas.push('  '+k+': '+porDia[k]); });
    var txt = linhas.join('\n');
    console.log(txt);
    if(window.__toastInfo) window.__toastInfo('Estado verificado', total+' ações · '+cp.length+' campanha(s) · '+ls.length+' lista(s)');
  }
  go();
})();
