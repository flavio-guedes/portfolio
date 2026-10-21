(function(){
  if(window.__bootstrap) return; window.__bootstrap=true;

  var NOME_LISTA = 'Wha - Quentes - Mix - Decisor';
  var ID_LISTA   = 'LST-MIXDEC';
  var ID_CAMP    = 'WHA-MIXDEC';
  var META       = 83;
  var MSG_D0 = 'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';
  var CHAVE = 'hermes-os.v7.user';

  function isQ(o){
    var q=false,d=false;
    Object.keys(o||{}).forEach(function(k){
      var v=String(o[k]||'').toLowerCase();
      if(v.indexOf('quent')>=0||v.indexOf('hot')>=0) q=true;
      if(v.indexOf('decisor')>=0||v.indexOf('decision')>=0) d=true;
    });
    return q&&d;
  }

  function salvar(){
    try{
      if(typeof loadUserStore==='function'&&typeof saveUserStore==='function'){
        var s=loadUserStore(); s.campanhas=state.campaigns; s.acoes=state.actions; s.listas=state.listas; saveUserStore(s);
      }
    }catch(e){}
    try{
      var s2=JSON.parse(localStorage.getItem(CHAVE)||'{}');
      s2.campanhas=state.campaigns; s2.acoes=state.actions; s2.listas=state.listas;
      localStorage.setItem(CHAVE, JSON.stringify(s2));
    }catch(e){}
  }

  var tentativas = 0;
  function checar(){
    tentativas++;
    if(typeof state==='undefined'){ if(tentativas<120) setTimeout(checar,500); return; }
    var opps = state.opportunities||[];
    if(!opps.length){ if(tentativas<120) setTimeout(checar,500); return; }

    var precisaLista = !(state.listas||[]).some(function(l){return l.id===ID_LISTA;});
    var precisaCamp  = !(state.campaigns||[]).some(function(c){return c.id===ID_CAMP;});
    var precisaAcoes = !(state.actions||[]).some(function(a){return a.campaign_id===ID_CAMP;});

    if(!precisaLista && !precisaCamp && !precisaAcoes){
      console.log('[bootstrap] tudo ok · '+(state.actions||[]).filter(function(a){return a.campaign_id===ID_CAMP;}).length+' acoes');
      return;
    }

    console.log('[bootstrap] populando: lista='+precisaLista+' camp='+precisaCamp+' acoes='+precisaAcoes+' (opps='+opps.length+')');

    var ids = opps.filter(isQ).map(function(o){return o.id;});
    if(ids.length<20){
      ids = opps.filter(function(o){
        return Object.keys(o||{}).some(function(k){
          var v=String(o[k]||'').toLowerCase();
          return v.indexOf('quent')>=0||v.indexOf('hot')>=0;
        });
      }).map(function(o){return o.id;});
    }
    ids = ids.slice(0, META);

    if(!ids.length){
      console.log('[bootstrap] !!! 0 leads quentes encontrados — checar campos dos opportunities');
      console.log('  amostra:', JSON.stringify(opps[0], null, 2).slice(0,500));
      return;
    }

    /* LISTA */
    if(precisaLista){
      state.listas = (state.listas||[]).filter(function(l){return l.id!==ID_LISTA;});
      state.listas.push({
        id:ID_LISTA, nome:NOME_LISTA, ids:ids,
        descricao:ids.length+' lead(s) · Quentes + Decisores',
        criadaEm:new Date().toISOString()
      });
    }

    /* CAMPANHA */
    if(precisaCamp){
      var hoje=new Date().toISOString().slice(0,10);
      var fim=new Date(); fim.setDate(fim.getDate()+7);
      state.campaigns = (state.campaigns||[]).filter(function(c){return c.id!==ID_CAMP;});
      state.campaigns.push({
        id:ID_CAMP, nome:NOME_LISTA, canal:'whatsapp', status:'ATIVA', cor:'#22c55e',
        inicio:hoje, fim:fim.toISOString().slice(0,10),
        meta_leads:ids.length, lista_id:ID_LISTA, lista_nome:NOME_LISTA,
        publico:{total:ids.length, ids:ids.slice()},
        mensagens:{D0:{corpo:MSG_D0}, D3:{corpo:'Follow-up D3 — {contato}?'}, D7:{corpo:'Encerramento D7 — {contato}.'}},
        cadencia:['D0','D3','D7'], cadencia_min:4,
        criadaEm:new Date().toISOString()
      });
    }

    /* AÇÕES */
    if(precisaAcoes){
      var porId={}; opps.forEach(function(o){porId[o.id]=o;});
      var cursor=new Date(); cursor.setMinutes(cursor.getMinutes()+1,0,0);
      state.actions = (state.actions||[]).filter(function(a){return a.campaign_id!==ID_CAMP;});
      ids.forEach(function(oppId,i){
        var l=porId[oppId]; if(!l) return;
        var tel=(l.whatsapp||l.telefone||'').toString().trim();
        var novo=!(l.tentativas>0||l.ultimo_contato);
        state.actions.push({
          id:'ACT-'+Date.now()+'-'+i, opportunity_id:oppId,
          contato:l.contato||l.nome||'', empresa:l.empresa||l.nome||'', telefone:tel,
          canal:'whatsapp', campanha_id:ID_CAMP, campaign_id:ID_CAMP, etapa:'D0',
          acao:MSG_D0, mensagem:MSG_D0, prazo:cursor.toISOString(),
          prioridade:'Alta', prioridade_fila:1,
          status: tel?'AGENDADO':'SEM_TELEFONE',
          criadaEm:new Date().toISOString()
        });
        cursor=new Date(cursor.getTime()+(novo?10*60*1000:4*60*1000));
      });
    }

    salvar();
    if(typeof window.render==='function') window.render();
    console.log('[bootstrap] ok · '+ids.length+' leads · campanha criada · '+(state.actions||[]).filter(function(a){return a.campaign_id===ID_CAMP;}).length+' acoes');
    if(window.__toastOK) window.__toastOK('Bootstrap completo', ids.length+' leads · '+NOME_LISTA);
  }

  checar();
})();
