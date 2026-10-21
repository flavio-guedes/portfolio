(function(){
  if(window.__resetNuclear) return; window.__resetNuclear=true;

  var CHAVE = 'hermes-os.v7.user';
  var NOME_LISTA = 'Wha - Quentes - Mix - Decisor';
  var ID_LISTA   = 'LST-MIXDEC';
  var ID_CAMP    = 'WHA-MIXDEC';
  var CAMPANHA_ID_ACAO = ID_CAMP;
  var META = 83;

  var MSG_D0 = 'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';

  function isQuenteDecisor(o){
    var temQ=false, temD=false;
    Object.keys(o||{}).forEach(function(k){
      var v = String(o[k]||'').toLowerCase();
      if(v.indexOf('quent')>=0 || v.indexOf('hot')>=0) temQ=true;
      if(v.indexOf('decisor')>=0 || v.indexOf('decision')>=0) temD=true;
    });
    return temQ && temD;
  }

  function aplicar(){
    if(typeof state==='undefined' || !state.opportunities){ setTimeout(aplicar, 300); return; }

    var opps = state.opportunities || [];
    console.log('[reset] opportunities:', opps.length);

    /* ---------- 1. LIMPA TUDO ---------- */
    state.campaigns = [];
    state.actions = [];
    state.listas = [];
    state.campaignExpanded = {};
    console.log('[reset] state limpo');

    /* ---------- 2. RECONSTRÓI LISTA ---------- */
    var ids = opps.filter(isQuenteDecisor).map(function(o){ return o.id; });
    if(ids.length < 20){
      ids = opps.filter(function(o){
        return Object.keys(o||{}).some(function(k){
          var v = String(o[k]||'').toLowerCase();
          return v.indexOf('quent')>=0 || v.indexOf('hot')>=0;
        });
      }).map(function(o){ return o.id; });
    }
    ids = ids.slice(0, META);

    var lista = {
      id: ID_LISTA,
      nome: NOME_LISTA,
      ids: ids,
      descricao: ids.length + ' lead(s) · Quentes + Decisores · base',
      criadaEm: new Date().toISOString()
    };
    state.listas.push(lista);
    console.log('[reset] lista reconstruida:', ids.length, 'ids');

    /* ---------- 3. RECONSTRÓI CAMPANHA ---------- */
    var hoje = new Date().toISOString().slice(0,10);
    var fim = new Date(); fim.setDate(fim.getDate()+7);
    var camp = {
      id: ID_CAMP,
      nome: NOME_LISTA,
      nicho: 'Quentes + Decisores · base selecionada',
      canal: 'whatsapp',
      cadencia_min: 4,
      status: 'ATIVA',
      cor: '#22c55e',
      inicio: hoje,
      fim: fim.toISOString().slice(0,10),
      meta_leads: ids.length,
      lista_id: ID_LISTA,
      lista_nome: NOME_LISTA,
      publico: { total: ids.length, ids: ids.slice() },
      mensagens: {
        D0: { corpo: MSG_D0 },
        D3: { corpo: 'Follow-up D3 — {contato}, ainda faz sentido?' },
        D7: { corpo: 'Encerramento D7 — {contato}, deixo o convite em aberto.' }
      },
      cadencia: ['D0','D3','D7'],
      tese: '10min 1º contato · 4min base',
      criadaEm: new Date().toISOString()
    };
    state.campaigns.push(camp);
    console.log('[reset] campanha criada:', ID_CAMP);

    /* ---------- 4. RECONSTRÓI AÇÕES (fila) ---------- */
    var porId = {};
    opps.forEach(function(o){ porId[o.id] = o; });

    var cursor = new Date(); cursor.setMinutes(cursor.getMinutes()+1, 0, 0);
    var criadas = 0, semTel = 0;
    ids.forEach(function(oppId, i){
      var l = porId[oppId];
      if(!l) return;
      var tel = (l.whatsapp||l.telefone||'').toString().trim();
      var novo = !(l.tentativas>0 || l.ultimo_contato);

      state.actions.push({
        id: 'ACT-' + Date.now() + '-' + i,
        opportunity_id: oppId,
        contato: l.contato||l.nome||'',
        empresa: l.empresa||l.nome||'',
        telefone: tel,
        canal: 'whatsapp',
        campanha_id: CAMPANHA_ID_ACAO,
        campaign_id: CAMPANHA_ID_ACAO,
        etapa: 'D0',
        acao: MSG_D0,
        mensagem: MSG_D0,
        prazo: cursor.toISOString(),
        prioridade: 'Alta',
        prioridade_fila: 1,
        status: tel ? 'AGENDADO' : 'SEM_TELEFONE',
        criadaEm: new Date().toISOString()
      });
      criadas++;
      if(!tel) semTel++;
      cursor = new Date(cursor.getTime() + (novo ? 10*60*1000 : 4*60*1000));
    });
    console.log('[reset] acoes criadas:', criadas, '(sem telefone:', semTel + ')');

    /* ---------- 5. PERSISTE ---------- */
    try{
      if(typeof loadUserStore==='function' && typeof saveUserStore==='function'){
        var st = loadUserStore();
        st.campanhas = state.campaigns;
        st.acoes = state.actions;
        st.listas = state.listas;
        saveUserStore(st);
        console.log('[reset] userStore salvo');
      }
    }catch(e){ console.log('[reset] erro userStore:', e.message); }

    try{
      var s = JSON.parse(localStorage.getItem(CHAVE)||'{}');
      s.campanhas = state.campaigns;
      s.acoes = state.actions;
      s.listas = state.listas;
      localStorage.setItem(CHAVE, JSON.stringify(s));
      console.log('[reset] localStorage salvo');
    }catch(e){ console.log('[reset] erro localStorage:', e.message); }

    if(typeof window.render==='function') window.render();

    if(window.__toastOK){
      window.__toastOK('Reset completo',
        '1 lista · 1 campanha · ' + criadas + ' ações (' + semTel + ' sem telefone)');
    }
  }

  aplicar();
  setTimeout(aplicar, 1500);
})();
