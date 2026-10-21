(function(){
  if(window.__refill) return; window.__refill=true;
  function go(){
    if(typeof state==='undefined'||!state.opportunities){setTimeout(go,400);return;}
    var L=(state.listas||[]).find(function(l){return /mix.*decisor/i.test(l.nome||'');});
    if(!L||!L.ids||!L.ids.length){console.log('[refill] lista MIXDEC nao existe');return;}
    var hoje=new Date();hoje.setHours(0,0,0,0);
    var jaTem={};
    (state.actions||[]).forEach(function(a){
      if(!/AGENDADO|PENDENTE|PRONTO/i.test(a.status||'')) return;
      var p=a.prazo?new Date(a.prazo):null;
      if(p&&p.getTime()>=hoje.getTime()) jaTem[a.opportunity_id]=true;
    });
    var porLead={};
    state.opportunities.forEach(function(o){porLead[o.id]=o;});
    var msg='Oi {contato}, tudo bem? Vi que voce esta a frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';
    var cursor=new Date();cursor.setMinutes(cursor.getMinutes()+1,0,0);
    var ok=0,criadas=0;
    L.ids.forEach(function(oppId,i){
      var l=porLead[oppId];if(!l)return;
      if(jaTem[oppId]){ok++;return;}
      var novo=!(l.tentativas>0||l.ultimo_contato);
      state.actions.push({
        id:'ACT-'+Date.now()+'-r-'+i,opportunity_id:oppId,
        contato:l.contato||l.nome||'',empresa:l.empresa||l.nome||'',
        telefone:l.whatsapp||l.telefone||'',canal:'whatsapp',
        campanha_id:'WAL-01',campaign_id:'WAL-01',etapa:'D0',
        acao:msg,mensagem:msg,prazo:cursor.toISOString(),
        prioridade:'Alta',prioridade_fila:1,status:'AGENDADO',
        criadaEm:new Date().toISOString()
      });
      criadas++;
      cursor=new Date(cursor.getTime()+(novo?10*60*1000:4*60*1000));
    });
    try{if(typeof loadUserStore==='function'&&typeof saveUserStore==='function'){var s=loadUserStore();s.acoes=state.actions;saveUserStore(s);}}catch(e){}
    try{var s2=JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}');s2.acoes=state.actions;localStorage.setItem('hermes-os.v7.user',JSON.stringify(s2));}catch(e){}
    if(typeof render==='function')render();
    console.log('[refill] ok='+ok+' criadas='+criadas);
  }
  go();
})();
