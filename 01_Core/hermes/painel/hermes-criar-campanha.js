(function(){
  if(window.__criaCampanha) return; window.__criaCampanha=true;

  var NOME      = 'Wha - Quentes - Mix - Decisor';
  var CAMP_ID   = 'WHA-MIXDEC';
  var LISTA_RE  = /mix.*decisor|decisor.*mix/i;
  var CHAVE     = 'hermes-os.v7.user';

  var MSG_D0 = 'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';
  var MSG_D3 = '{contato}, uma coisa que quase ninguém faz antes de automatizar: mapear o processo atual. É por isso que 70% das automações em pequena empresa morrem em 3 meses. Quer que eu mapeie os 3 principais da {empresa}?';
  var MSG_D7 = '{contato}, última mensagem da minha parte. Se em algum momento fizer sentido falar sobre processo e atendimento, é só responder aqui. Deixo o convite em aberto.';

  function acharLista(){
    var L = null;
    try{ L = (state.listas||[]).find(function(l){return LISTA_RE.test(l.nome||'');}); }catch(e){}
    if(L) return L;
    try{
      var s = JSON.parse(localStorage.getItem(CHAVE)||'{}');
      L = (s.listas||[]).find(function(l){return LISTA_RE.test(l.nome||'');});
    }catch(e){}
    return L;
  }

  function aplicar(){
    if(typeof state==='undefined' || !state.opportunities){ setTimeout(aplicar, 300); return; }

    var L = acharLista();
    if(!L || !L.ids || !L.ids.length){
      console.log('[criar-campanha] lista nao encontrada');
      if(window.__toastErro) window.__toastErro('Lista não encontrada', NOME);
      return;
    }

    var hoje = new Date().toISOString().slice(0,10);
    var fim  = new Date(); fim.setDate(fim.getDate()+7);
    var camp = {
      id:           CAMP_ID,
      nome:         NOME,
      nicho:        'Quentes + Decisores · base selecionada',
      canal:        'whatsapp',
      cadencia_min: 4,
      status:       'ATIVA',
      cor:          '#22c55e',
      inicio:       hoje,
      fim:          fim.toISOString().slice(0,10),
      meta_leads:   L.ids.length,
      lista_id:     L.id,
      lista_nome:   L.nome,
      publico:      { total: L.ids.length, ids: L.ids.slice() },
      mensagens: {
        D0: { corpo: MSG_D0 },
        D3: { corpo: MSG_D3 },
        D7: { corpo: MSG_D7 }
      },
      cadencia: ['D0','D3','D7'],
      tese:     '10min entre 1º contato · 4min entre base',
      criadaEm: new Date().toISOString()
    };

    /* --- state --- */
    state.campaigns = state.campaigns || [];
    var ix = state.campaigns.findIndex(function(c){return c.id===CAMP_ID;});
    if(ix>=0) state.campaigns[ix] = camp;
    else state.campaigns.push(camp);

    /* --- userStore --- */
    try{
      if(typeof loadUserStore==='function' && typeof saveUserStore==='function'){
        var st = loadUserStore();
        st.campanhas = st.campanhas || [];
        var iy = st.campanhas.findIndex(function(c){return c.id===CAMP_ID;});
        if(iy>=0) st.campanhas[iy] = camp;
        else st.campanhas.push(camp);
        saveUserStore(st);
      }
    }catch(e){}

    try{
      var s2 = JSON.parse(localStorage.getItem(CHAVE)||'{}');
      s2.campanhas = s2.campanhas || [];
      var iz = s2.campanhas.findIndex(function(c){return c.id===CAMP_ID;});
      if(iz>=0) s2.campanhas[iz] = camp;
      else s2.campanhas.push(camp);
      localStorage.setItem(CHAVE, JSON.stringify(s2));
    }catch(e){}

    if(typeof window.render==='function') window.render();

    console.log('[criar-campanha] OK · '+NOME+' · '+L.ids.length+' leads · status '+camp.status);
    if(window.__toastOK) window.__toastOK('Campanha criada', NOME+' · '+L.ids.length+' leads');
  }

  aplicar();
  setTimeout(aplicar, 1200);
})();
