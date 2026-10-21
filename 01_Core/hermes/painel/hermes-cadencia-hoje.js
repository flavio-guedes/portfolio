(function(){
  if(window.__cadenciaHoje) return; window.__cadenciaHoje=true;

  var ID_CAMP = 'WHA-MIXDEC';
  var LISTA_RE = /mix.*decisor|decisor.*mix/i;
  var GAP_NOVO = 10*60*1000;
  var GAP_BASE =  4*60*1000;
  var CHAVE = 'hermes-os.v7.user';
  var MSG = 'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';

  function log(m){ try{ console.log('[cadencia]',m); }catch(e){} }

  function persistir(){
    try{
      if(typeof loadUserStore==='function' && typeof saveUserStore==='function'){
        var s = loadUserStore();
        s.acoes = state.actions;
        s.campanhas = state.campaigns;
        s.listas = state.listas;
        saveUserStore(s);
      }
    }catch(e){}
    try{
      var s2 = JSON.parse(localStorage.getItem(CHAVE)||'{}');
      s2.acoes = state.actions;
      s2.campanhas = state.campaigns;
      s2.listas = state.listas;
      localStorage.setItem(CHAVE, JSON.stringify(s2));
    }catch(e){}
  }

  function acharLista(camp){
    if(camp && camp.lista_id){
      var L = (state.listas||[]).find(function(l){ return l.id===camp.lista_id; });
      if(L) return L;
    }
    var L2 = (state.listas||[]).find(function(l){ return LISTA_RE.test(l.nome||''); });
    if(L2) return L2;
    if(camp && camp.publico && camp.publico.ids){
      return {id:'inline', nome:camp.nome, ids:camp.publico.ids.slice()};
    }
    return null;
  }

  function go(){
    if(typeof state==='undefined' || !state.opportunities || !state.opportunities.length){
      setTimeout(go, 500);
      return;
    }

    var camp = (state.campaigns||[]).find(function(c){ return c.id === ID_CAMP; });
    if(!camp){
      log('campanha ' + ID_CAMP + ' não encontrada');
      if(window.__toastErro) window.__toastErro('Campanha não encontrada');
      return;
    }

    var L = acharLista(camp);
    if(!L || !L.ids || !L.ids.length){
      log('lista vazia');
      if(window.__toastErro) window.__toastErro('Lista vazia');
      return;
    }

    var porId = {};
    state.opportunities.forEach(function(o){ porId[o.id] = o; });

    var msg = MSG;
    if(camp.mensagens && camp.mensagens.D0 && camp.mensagens.D0.corpo){
      msg = camp.mensagens.D0.corpo;
    }

    /* Cursor começa em +5 minutos a partir de agora */
    var agora = new Date();
    var cursor = new Date(agora.getTime() + 5*60*1000);
    cursor.setSeconds(0, 0);

    /* Data de hoje (YYYY-MM-DD) */
    var hojeStr = agora.toISOString().slice(0,10);

    /* Limpa TODAS as ações antigas desta campanha */
    state.actions = (state.actions||[]).filter(function(a){
      return a.campaign_id !== ID_CAMP && a.campanha_id !== ID_CAMP;
    });

    var criadas = 0, semTel = 0, novos = 0, base = 0;
    var porHora = {};

    L.ids.forEach(function(oppId, i){
      var l = porId[oppId];
      if(!l) return;

      var tel = (l.whatsapp || l.telefone || '').toString().trim();
      var ehNovo = !(l.tentativas>0 || l.ultimo_contato);
      var gap = ehNovo ? GAP_NOVO : GAP_BASE;

      var hora = cursor.toTimeString().slice(0,5);
      porHora[hora] = (porHora[hora]||0)+1;

      state.actions.push({
        id: 'ACT-' + Date.now() + '-h-' + i,
        opportunity_id: oppId,
        contato: l.contato || l.nome || '',
        empresa: l.empresa || l.nome || '',
        telefone: tel,
        canal: 'whatsapp',
        campanha_id: ID_CAMP,
        campaign_id: ID_CAMP,
        etapa: 'D0',
        acao: msg,
        mensagem: msg,
        prazo: cursor.toISOString(),
        prioridade: 'Alta',
        prioridade_fila: 1,
        status: tel ? 'AGENDADO' : 'SEM_TELEFONE',
        criadaEm: new Date().toISOString()
      });

      criadas++;
      if(!tel) semTel++;
      if(ehNovo) novos++; else base++;

      cursor = new Date(cursor.getTime() + gap);
    });

    camp.status = 'ATIVA';
    camp.publico = camp.publico || {};
    camp.publico.total = L.ids.length;
    camp.publico.ids = L.ids.slice();
    camp.meta_leads = L.ids.length;

    persistir();
    if(typeof window.render==='function') window.render();

    var h = cursor.toTimeString().slice(0,5);
    var min = Math.round((cursor - agora) / 60000);

    log('criadas=' + criadas + ' novos=' + novos + ' base=' + base + ' semTel=' + semTel);
    log('início=' + agora.toTimeString().slice(0,5) + ' · fim=' + h + ' · duração=' + min + 'min');

    if(window.__toastOK){
      window.__toastOK('Cadência aplicada', criadas + ' leads · hoje ' + agora.toTimeString().slice(0,5) + '→' + h);
    }
  }

  go();
})();
