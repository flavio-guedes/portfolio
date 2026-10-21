(function(){
  if(window.__setup) return; window.__setup=true;

  var CHAVE    = 'hermes-os.v7.user';
  var ID_LISTA = 'LST-MIXDEC';
  var ID_CAMP  = 'WHA-MIXDEC';
  var NOME     = 'Wha - Quentes - Mix - Decisor';
  var META     = 83;
  var GAP_NOVO = 10*60*1000;
  var GAP_BASE = 4*60*1000;
  var MSG      = 'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';

  function toast(t,s,tipo){
    try{
      if(tipo==='ok'  && window.__toastOK)   return window.__toastOK(t,s);
      if(tipo==='erro'&& window.__toastErro) return window.__toastErro(t,s);
      if(window.__toastInfo) return window.__toastInfo(t,s);
    }catch(e){}
  }
  function log(m){ try{ console.log('[setup]',m); }catch(e){} }

  function isQ(o){
    var q=false, d=false;
    Object.keys(o||{}).forEach(function(k){
      var v = String(o[k]||'').toLowerCase();
      if(v.indexOf('quent')>=0||v.indexOf('hot')>=0) q=true;
      if(v.indexOf('decisor')>=0||v.indexOf('decision')>=0) d=true;
    });
    return q && d;
  }
  function isQuente(o){
    return Object.keys(o||{}).some(function(k){
      var v = String(o[k]||'').toLowerCase();
      return v.indexOf('quent')>=0||v.indexOf('hot')>=0;
    });
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

  var tentativas = 0;
  function go(){
    tentativas++;
    if(tentativas > 120) { log('desisti'); return; }
    if(typeof state==='undefined' || !state.opportunities || !state.opportunities.length){
      setTimeout(go, 500); return;
    }
    log('opportunities: ' + state.opportunities.length);

    var opps = state.opportunities;
    var porId = {};
    opps.forEach(function(o){ porId[o.id] = o; });

    /* ============ 1. LISTA (cria se não existe) ============ */
    var listaExiste = (state.listas||[]).some(function(l){ return l.id === ID_LISTA; });
    if(!listaExiste){
      var ids = opps.filter(isQ).map(function(o){ return o.id; });
      if(ids.length < 20) ids = opps.filter(isQuente).map(function(o){ return o.id; });
      ids = ids.slice(0, META);
      if(!ids.length){ setTimeout(go, 2000); return; }
      state.listas = state.listas || [];
      state.listas.push({
        id: ID_LISTA, nome: NOME, ids: ids,
        descricao: ids.length + ' lead(s) · Quentes + Decisores',
        criadaEm: new Date().toISOString()
      });
      log('lista criada: ' + ids.length + ' leads');
    } else {
      log('lista já existe');
    }
    var L = (state.listas||[]).find(function(l){ return l.id === ID_LISTA; });
    if(!L || !L.ids || !L.ids.length){ log('lista vazia!'); return; }

    /* ============ 2. CAMPANHA (cria se não existe) ============ */
    var campExiste = (state.campaigns||[]).some(function(c){ return c.id === ID_CAMP; });
    if(!campExiste){
      var hoje = new Date().toISOString().slice(0,10);
      var fim = new Date(); fim.setDate(fim.getDate()+7);
      state.campaigns = state.campaigns || [];
      state.campaigns.push({
        id: ID_CAMP, nome: NOME, canal: 'whatsapp', status: 'ATIVA', cor: '#22c55e',
        inicio: hoje, fim: fim.toISOString().slice(0,10),
        meta_leads: L.ids.length, lista_id: ID_LISTA, lista_nome: NOME,
        publico: { total: L.ids.length, ids: L.ids.slice() },
        mensagens: {
          D0: { corpo: MSG },
          D3: { corpo: 'Follow-up D3 — {contato}, ainda faz sentido?' },
          D7: { corpo: 'Encerramento D7 — {contato}, deixo em aberto.' }
        },
        cadencia: ['D0','D3','D7'], cadencia_min: 4,
        criadaEm: new Date().toISOString()
      });
      log('campanha criada: ' + ID_CAMP);
    } else {
      /* atualiza publico */
      var c = state.campaigns.find(function(x){ return x.id === ID_CAMP; });
      c.status = 'ATIVA';
      c.publico = c.publico || {};
      c.publico.total = L.ids.length;
      c.publico.ids = L.ids.slice();
      log('campanha já existe — atualizada');
    }

    /* ============ 3. AÇÕES (cria se faltar) ============ */
    var acoesWha = (state.actions||[]).filter(function(a){ return a.campaign_id === ID_CAMP; });
    var metas = acoesWha.filter(function(a){ return /AGENDADO|PENDENTE|PRONTO/i.test(a.status||''); });

    if(metas.length >= L.ids.length){
      log('ações já existem: ' + metas.length);
      salvar();
      if(typeof window.render==='function') window.render();
      return;
    }

    log('ações faltando (' + metas.length + '/' + L.ids.length + ') — recriando');

    /* remove TODAS as ações antigas dessa campanha */
    state.actions = (state.actions||[]).filter(function(a){
      return a.campaign_id !== ID_CAMP && a.campanha_id !== ID_CAMP;
    });

    var agora = new Date();
    var cursor = new Date(agora.getTime() + 5*60*1000);
    cursor.setSeconds(0,0);

    var criadas=0, semTel=0, novos=0, base=0;
    L.ids.forEach(function(oppId, i){
      var l = porId[oppId]; if(!l) return;
      var tel = (l.whatsapp||l.telefone||'').toString().trim();
      var ehNovo = !(l.tentativas>0 || l.ultimo_contato);
      var gap = ehNovo ? GAP_NOVO : GAP_BASE;

      state.actions.push({
        id: 'ACT-' + Date.now() + '-s-' + i,
        opportunity_id: oppId,
        contato: l.contato || l.nome || '',
        empresa: l.empresa || l.nome || '',
        telefone: tel,
        canal: 'whatsapp',
        campanha_id: ID_CAMP, campaign_id: ID_CAMP,
        etapa: 'D0', acao: MSG, mensagem: MSG,
        prazo: cursor.toISOString(),
        prioridade: 'Alta', prioridade_fila: 1,
        status: tel ? 'AGENDADO' : 'SEM_TELEFONE',
        criadaEm: new Date().toISOString()
      });
      criadas++;
      if(!tel) semTel++;
      if(ehNovo) novos++; else base++;
      cursor = new Date(cursor.getTime() + gap);
    });

    salvar();
    if(typeof window.render==='function') window.render();

    var horas = Math.round((cursor - agora) / 60000);
    log('OK · criadas=' + criadas + ' · novos=' + novos + ' · base=' + base + ' · semTel=' + semTel + ' · duracao=' + horas + 'min');
    toast('Fila pronta', criadas + ' leads · ' + Math.floor(horas/60) + 'h' + (horas%60) + ' de duração', 'ok');
  }

  go();
})();
