(function(){
  if(window.__filaHojeLista) return; window.__filaHojeLista=true;

  var LISTA_ID  = 'LST-MIXDEC';
  var LISTA_RE  = /mix.*decisor|decisor.*mix/i;
  var CHAVE     = 'hermes-os.v7.user';
  var CANAL     = 'whatsapp';
  var CAMPANHA  = 'WAL-01';

  var GAP_NOVO = 10*60*1000;  /* 10 min entre leads novos */
  var GAP_BASE =  4*60*1000;  /*  4 min entre já abordados */

  function acharLista(){
    var L=null;
    try{ L=(state.listas||[]).find(function(l){return l.id===LISTA_ID||LISTA_RE.test(l.nome||'');}); }catch(e){}
    if(L) return L;
    try{
      var s=JSON.parse(localStorage.getItem(CHAVE)||'{}');
      L=(s.listas||[]).find(function(l){return l.id===LISTA_ID||LISTA_RE.test(l.nome||'');});
    }catch(e){}
    return L;
  }

  function isNovo(a, l){
    if(a.etapa && !/^(D0|INICIAL|PRIMEIRO)/i.test(a.etapa)) return false;
    if(l){
      if(l.tentativas && l.tentativas>0) return false;
      if(l.ultimo_contato) return false;
    }
    if(a.historico && a.historico.length) return false;
    return true;
  }

  function acharAcaoExistente(oppId){
    return (state.actions||[]).find(function(a){ return a.opportunity_id===oppId; });
  }

  function aplicar(){
    if(typeof state==='undefined'||!state.opportunities){setTimeout(aplicar,300);return;}

    var L=acharLista();
    if(!L||!L.ids||!L.ids.length){ console.log('[fila-hoje] lista vazia'); return; }

    var porId={};
    state.opportunities.forEach(function(o){ porId[o.id]=o; });

    /* mensagem base */
    var msgBase='';
    try{
      var c=(state.campaigns||[]).find(function(x){return x.id===CAMPANHA;}) ||
            (state.campaigns||[])[0];
      if(c && c.mensagens && c.mensagens.D0 && c.mensagens.D0.corpo) msgBase=c.mensagens.D0.corpo;
    }catch(e){}
    if(!msgBase){
      msgBase = "Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. "+
                "Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?";
    }

    state.actions = state.actions || [];

    /* ---------- 1. Monta lista ordenada de leads com tipo ---------- */
    var fila = [];
    L.ids.forEach(function(oppId){
      var l = porId[oppId];
      if(!l) return;
      var a = acharAcaoExistente(oppId);
      var novo = isNovo(a||{etapa:'D0'}, l);
      fila.push({oppId:oppId, lead:l, acao:a||null, novo:novo});
    });

    /* ---------- 2. Distribui prazos respeitando a cadência ---------- */
    var inicio = new Date();
    inicio.setSeconds(0,0);
    inicio.setMinutes(inicio.getMinutes()+1);   /* começa em +1 min */

    var cursor = inicio.getTime();
    var criadas=0, atualizadas=0, jaOk=0;

    fila.forEach(function(item, i){
      var prazo = new Date(cursor);

      if(item.acao){
        /* ação já existe — só atualiza prazo se ela é pendente de hoje */
        if(/AGENDADO|PENDENTE|agendado|pendente/i.test(String(item.acao.status||''))){
          var atual = item.acao.prazo?new Date(item.acao.prazo).getTime():0;
          var diff = Math.abs(atual - prazo.getTime());
          if(diff > 5000){  /* se está com mais de 5s de diferença, reajusta */
            item.acao.prazo = prazo.toISOString();
            atualizadas++;
          } else {
            jaOk++;
          }
        }
      } else {
        /* cria nova ação */
        var acao = {
          id:              'ACT-'+Date.now()+'-'+i,
          opportunity_id:  item.oppId,
          contato:         item.lead.contato||item.lead.nome||'',
          empresa:         item.lead.empresa||item.lead.nome||'',
          telefone:        item.lead.whatsapp||item.lead.telefone||'',
          canal:           CANAL,
          campanha_id:     CAMPANHA,
          campaign_id:     CAMPANHA,
          etapa:           'D0',
          acao:            msgBase,
          mensagem:        msgBase,
          prazo:           prazo.toISOString(),
          prioridade:      'Alta',
          prioridade_fila: 1,
          status:          'AGENDADO',
          criadaEm:        new Date().toISOString()
        };
        state.actions.push(acao);
        criadas++;
      }

      /* avança o cursor conforme a cadência DESTE item */
      cursor += item.novo ? GAP_NOVO : GAP_BASE;
    });

    /* ---------- 3. Persiste ---------- */
    try{
      if(typeof loadUserStore==='function' && typeof saveUserStore==='function'){
        var s = loadUserStore(); s.acoes = state.actions; saveUserStore(s);
      }
    }catch(e){}
    try{
      var ls = JSON.parse(localStorage.getItem(CHAVE)||'{}');
      ls.acoes = state.actions;
      localStorage.setItem(CHAVE, JSON.stringify(ls));
    }catch(e){}

    if(typeof render==='function') render();

    /* ---------- 4. Toast ---------- */
    var totalNovos = fila.filter(function(x){return x.novo;}).length;
    var totalBase = fila.length - totalNovos;
    var duracaoMin = Math.round((cursor - inicio.getTime())/60000);

    var el=document.createElement('div');
    el.style.cssText='position:fixed;bottom:16px;right:16px;z-index:99999;background:#12171e;'+
      'color:#f2f4f6;border:1px solid #2a3441;border-radius:10px;padding:12px 16px;'+
      'font:12px Manrope,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.6);max-width:360px';
    el.innerHTML = '<b style="display:block;margin-bottom:6px">Fila de hoje com cadência aplicada</b>'+
      '<div style="font-size:11.5px;line-height:1.7;color:#8b93a1">'+
      'Lista: <b style="color:#f2f4f6">'+String(L.nome).slice(0,40)+'</b><br>'+
      '<b style="color:#22c55e">'+totalNovos+'</b> novos  ·  <b style="color:#f59e0b">'+totalBase+'</b> base<br>'+
      'Cadência: <b style="color:#f2f4f6">10min</b> após novo · <b style="color:#f2f4f6">4min</b> após base<br>'+
      'Duração total estimada: <b style="color:#f2f4f6">'+duracaoMin+' min</b><br>'+
      'Criadas: '+criadas+' · Reajustadas: '+atualizadas+' · OK: '+jaOk+
      '</div>'+
      '<div style="margin-top:8px;font-size:10px;color:#8b93a1;opacity:.7">clique para fechar</div>';
    el.onclick=function(){el.remove()};
    document.body.appendChild(el);
    setTimeout(function(){el.remove()}, 9000);

    console.log('[fila-hoje] criadas='+criadas+' reajustadas='+atualizadas+' ok='+jaOk+
                ' · novos='+totalNovos+' base='+totalBase+' · duração='+duracaoMin+'min');
  }

  aplicar();
  setTimeout(aplicar, 1500);
})();
