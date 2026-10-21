(function(){
  if(window.__forca83b) return; window.__forca83b=true;
  window.__forca83=true;
  function go(){
    if(typeof state==='undefined'||!state.opportunities){setTimeout(go,300);return;}
    /* forca83 guard: nao recria se a fila ja tem itens */
    if((state.actions||[]).length > 5){ console.log('[forca83] ja tem '+state.actions.length+' acoes, pulando recriacao'); return; }

    /* 1. Acha a lista por nome */
    var L=null;
    try{ L=(state.listas||[]).find(function(l){return /mix.*decisor|decisor.*mix/i.test(l.nome||'');}); }catch(e){}
    if(!L){
      try{ var s=JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}');
           L=(s.listas||[]).find(function(l){return /mix.*decisor|decisor.*mix/i.test(l.nome||'');}); }catch(e){}
    }

    /* 2. Se não achou, reconstrói a partir dos leads */
    if(!L || !L.ids || !L.ids.length){
      var ids=[];
      state.opportunities.forEach(function(o){
        var t=String(o.temperatura||o.temp||'').toLowerCase();
        var c=String(o.cargo||o.papel||'').toLowerCase();
        if(t.indexOf('quent')>=0 && c.indexOf('decisor')>=0) ids.push(o.id);
      });
      if(!ids.length){
        state.opportunities.forEach(function(o){
          var t=String(o.temperatura||o.temp||'').toLowerCase();
          if(t.indexOf('quent')>=0) ids.push(o.id);
        });
      }
      ids=ids.slice(0,83);
      L={id:'LST-MIXDEC',nome:'Wha - Quentes - Mix - Decisor',ids:ids,
         descricao:ids.length+' lead(s)',criadaEm:new Date().toISOString()};
      state.listas=state.listas||[];
      state.listas=state.listas.filter(function(x){return x.id!=='LST-MIXDEC';});
      state.listas.push(L);
      try{ var s2=JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}');
           s2.listas=(s2.listas||[]).filter(function(x){return x.id!=='LST-MIXDEC';});
           s2.listas.push(L); localStorage.setItem('hermes-os.v7.user',JSON.stringify(s2)); }catch(e){}
    }

    /* 3. Apaga TODAS as ações e recria as 83 com cadência */
    state.actions=[];
    var porId={}; state.opportunities.forEach(function(o){porId[o.id]=o;});
    var msgBase='Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';
    try{
      var c=(state.campaigns||[]).find(function(x){return x.id==='WAL-01';})||(state.campaigns||[])[0];
      if(c&&c.mensagens&&c.mensagens.D0&&c.mensagens.D0.corpo) msgBase=c.mensagens.D0.corpo;
    }catch(e){}

    var cursor=new Date(); cursor.setMinutes(cursor.getMinutes()+1,0,0);
    var criadas=0, novos=0, base=0;
    L.ids.forEach(function(oppId,i){
      var l=porId[oppId]; if(!l) return;
      var ehNovo=!(l.tentativas>0||l.ultimo_contato);
      if(ehNovo) novos++; else base++;
      state.actions.push({
        id:'ACT-'+Date.now()+'-'+i, opportunity_id:oppId,
        contato:l.contato||l.nome||'', empresa:l.empresa||l.nome||'',
        telefone:l.whatsapp||l.telefone||'', canal:'whatsapp',
        campanha_id:'WAL-01', campaign_id:'WAL-01', etapa:'D0',
        acao:msgBase, mensagem:msgBase,
        prazo:cursor.toISOString(), prioridade:'Alta', prioridade_fila:1,
        status:'AGENDADO', criadaEm:new Date().toISOString()
      });
      criadas++;
      cursor=new Date(cursor.getTime()+(ehNovo?10*60*1000:4*60*1000));
    });

    /* 4. Persiste */
    try{ if(typeof loadUserStore==='function'&&typeof saveUserStore==='function'){
      var st=loadUserStore(); st.acoes=state.actions; st.listas=state.listas; saveUserStore(st); } }catch(e){}
    try{ var s3=JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}');
         s3.acoes=state.actions; s3.listas=state.listas;
         localStorage.setItem('hermes-os.v7.user',JSON.stringify(s3)); }catch(e){}

    if(typeof render==='function') render();

    var dur=Math.round((cursor-Date.now())/60000);
    var el=document.createElement('div');
    el.style.cssText='position:fixed;bottom:16px;right:16px;z-index:99999;background:#12171e;color:#f2f4f6;border:1px solid #2a3441;border-radius:10px;padding:12px 16px;font:12px Manrope,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.6);max-width:360px';
    el.innerHTML='<b>Fila recriada</b><br><span style="color:#8b93a1;font-size:11.5px;line-height:1.7">Lista: '+L.nome+'<br>'+
      '<b style="color:#22c55e">'+novos+'</b> novos · <b style="color:#f59e0b">'+base+'</b> base<br>'+
      'Criadas: '+criadas+' ações · duração ~'+dur+' min</span><br>'+
      '<span style="color:#8b93a1;font-size:10px">clique pra fechar</span>';
    el.onclick=function(){el.remove()};
    document.body.appendChild(el); setTimeout(function(){el.remove()},9000);
  }
  function tentaAte(){
    var n=(state.actions||[]).length;
    if(n < 50){
      // limpa e recria
      state.actions=[];
      if(typeof window.__forca83run==='function') window.__forca83run();
      setTimeout(function(){
        if((state.actions||[]).length < 50) tentaAte();
      }, 1500);
    }
  }
  window.__forca83run=go;
  go();
  setTimeout(tentaAte, 2000);
})();
