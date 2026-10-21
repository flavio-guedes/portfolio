(function(){
  if(window.__hoje) return; window.__hoje=true;

  var CHAVE = 'hermes-os.v7.user';
  var ID_CAMP = 'WHA-MIXDEC';
  var ID_LISTA = 'LST-MIXDEC';
  var GAP_NOVO = 10*60*1000;
  var GAP_BASE = 4*60*1000;
  var MSG = 'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';

  function log(m){ try{ console.log('[hoje]',m); }catch(e){} }
  function toast(t,s,tipo){
    try{
      if(tipo==='ok'&&window.__toastOK) return window.__toastOK(t,s);
      if(tipo==='erro'&&window.__toastErro) return window.__toastErro(t,s);
      if(window.__toastInfo) return window.__toastInfo(t,s);
    }catch(e){}
  }

  function salvar(){
    try{
      if(typeof loadUserStore==='function' && typeof saveUserStore==='function'){
        var s = loadUserStore();
        s.listas = state.listas;
        s.campanhas = state.campaigns;
        s.acoes = state.actions;
        saveUserStore(s);
      }
    }catch(e){}
    try{
      var s2 = JSON.parse(localStorage.getItem(CHAVE)||'{}');
      s2.listas = state.listas;
      s2.campanhas = state.campaigns;
      s2.acoes = state.actions;
      localStorage.setItem(CHAVE, JSON.stringify(s2));
    }catch(e){}
  }

  var tent = 0;
  function go(){
    tent++;
    if(tent > 120) return;
    if(typeof state==='undefined' || !state.opportunities || !state.opportunities.length){
      setTimeout(go, 500); return;
    }

    log('opps=' + state.opportunities.length);

    var camp = (state.campaigns||[]).find(function(c){ return c.id === ID_CAMP; });
    if(!camp){ log('campanha ausente'); setTimeout(go, 1500); return; }

    var lista = (state.listas||[]).find(function(l){ return l.id === ID_LISTA; });
    if(!lista || !lista.ids || !lista.ids.length){
      log('lista ausente');
      setTimeout(go, 1500); return;
    }

    var porId = {};
    state.opportunities.forEach(function(o){ porId[o.id] = o; });

    /* ---- Conta as ações ATUAIS dessa campanha (que já aparecem em Hoje) ---- */
    var acoes = (state.actions||[]).filter(function(a){
      return a.campaign_id === ID_CAMP && /AGENDADO|PENDENTE|PRONTO/i.test(a.status||'');
    });

    /* ---- Se já tem 83 hoje, não mexe ---- */
    var hoje = new Date(); hoje.setHours(0,0,0,0);
    var amanha = new Date(hoje); amanha.setDate(amanha.getDate()+1);
    var acoesHoje = acoes.filter(function(a){
      if(!a.prazo) return false;
      var p = new Date(a.prazo);
      return p >= hoje && p < amanha;
    });

    if(acoesHoje.length >= lista.ids.length){
      log('já tem ' + acoesHoje.length + ' ações em Hoje — ok');
      camp.status = 'ATIVA';
      camp.publico = camp.publico || {};
      camp.publico.total = lista.ids.length;
      camp.publico.ids = lista.ids.slice();
      salvar();
      if(typeof window.render==='function') window.render();
      toast('Fila pronta', acoesHoje.length + ' leads em Hoje', 'ok');
      return;
    }

    log('recriando ' + lista.ids.length + ' ações em Hoje (tinha ' + acoesHoje.length + ')');

    /* ---- Remove TODAS as ações dessa campanha ---- */
    state.actions = (state.actions||[]).filter(function(a){
      return a.campaign_id !== ID_CAMP && a.campanha_id !== ID_CAMP;
    });

    /* ---- Cria as 83 ações com prazo HOJE, escalonado ---- */
    var agora = new Date();
    var cursor = new Date(agora.getTime() + 5*60*1000);
    cursor.setSeconds(0, 0);

    var criadas = 0, semTel = 0, novos = 0, base = 0;
    lista.ids.forEach(function(oppId, i){
      var l = porId[oppId]; if(!l) return;
      var tel = (l.whatsapp || l.telefone || '').toString().trim();
      var ehNovo = !(l.tentativas > 0 || l.ultimo_contato);
      var gap = ehNovo ? GAP_NOVO : GAP_BASE;

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
        acao: MSG,
        mensagem: MSG,
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

    /* ---- Garante que campanha está ATIVA e vinculada à lista ---- */
    camp.status = 'ATIVA';
    camp.lista_id = ID_LISTA;
    camp.lista_nome = lista.nome;
    camp.publico = camp.publico || {};
    camp.publico.total = lista.ids.length;
    camp.publico.ids = lista.ids.slice();
    camp.meta_leads = lista.ids.length;

    salvar();
    if(typeof window.render==='function') window.render();

    var dur = Math.round((cursor - agora) / 60000);
    log('OK · criadas=' + criadas + ' · novos=' + novos + ' · base=' + base + ' · semTel=' + semTel + ' · dur=' + dur + 'min');
    toast('Fila pronta em Hoje', criadas + ' leads · ' + Math.floor(dur/60) + 'h' + (dur%60) + 'min', 'ok');
  }

  go();
})();
