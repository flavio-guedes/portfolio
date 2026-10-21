(function(){
  // desativa TODOS os scripts de fila anteriores pra não brigar
  window.__filaCore = true;
  window.__cadenciaHoje = true;
  window.__setup = true;
  window.__populaCampanha = true;
  window.__bootstrap = true;
  window.__refill = true;
  window.__forca83 = true;
  window.__filaHojeLista = true;
  window.__hermesSetup = true;

  if(window.__kill) return; window.__kill=true;

  function acharTel(lead){
    // procura QUALQUER campo com 10-15 dígitos
    var tel = '';
    Object.keys(lead||{}).forEach(function(k){
      if(tel) return;
      var v = lead[k];
      if(typeof v !== 'string') return;
      var d = v.replace(/\D/g,'');
      if(d.length >= 10 && d.length <= 15){ tel = d; }
    });
    return tel;
  }

  function go(){
    if(typeof state==='undefined' || !state.opportunities || !state.opportunities.length){
      setTimeout(go, 500); return;
    }
    var opps = state.opportunities;
    console.log('[kill] opps:', opps.length);

    // 1. QUEM TEM TELEFONE?
    var comTel = [];
    opps.forEach(function(o){
      var t = acharTel(o);
      if(t) comTel.push({lead:o, tel:t});
    });
    console.log('[kill] com telefone:', comTel.length);

    if(!comTel.length){
      if(window.__toastErro) window.__toastErro('Nenhum lead com telefone', 'checar campos');
      return;
    }

    // limita a 83
    comTel = comTel.slice(0, 83);

    // 2. CRIA LISTA
    var ids = comTel.map(function(x){ return x.lead.id; });
    state.listas = (state.listas||[]).filter(function(l){ return l.id !== 'LST-MIXDEC'; });
    state.listas.push({
      id:'LST-MIXDEC',
      nome:'Wha - Quentes - Mix - Decisor',
      ids: ids,
      descricao: ids.length+' lead(s) · com telefone',
      criadaEm: new Date().toISOString()
    });
    console.log('[kill] lista criada:', ids.length);

    // 3. CRIA CAMPANHA
    var hoje = new Date().toISOString().slice(0,10);
    var fim = new Date(); fim.setDate(fim.getDate()+7);
    state.campaigns = (state.campaigns||[]).filter(function(c){ return c.id !== 'WHA-MIXDEC'; });
    state.campaigns.push({
      id:'WHA-MIXDEC',
      nome:'Wha - Quentes - Mix - Decisor',
      canal:'whatsapp', status:'ATIVA', cor:'#22c55e',
      inicio: hoje, fim: fim.toISOString().slice(0,10),
      meta_leads: ids.length,
      lista_id:'LST-MIXDEC',
      lista_nome:'Wha - Quentes - Mix - Decisor',
      publico:{total:ids.length, ids:ids.slice()},
      mensagens:{
        D0:{corpo:'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?'},
        D3:{corpo:'Follow-up — {contato}, ainda faz sentido?'},
        D7:{corpo:'Encerramento — {contato}, deixo em aberto.'}
      },
      cadencia:['D0','D3','D7'], cadencia_min:4,
      criadaEm: new Date().toISOString()
    });
    console.log('[kill] campanha criada');

    // 4. POPULA AÇÕES
    state.actions = (state.actions||[]).filter(function(a){
      return a.campaign_id !== 'WHA-MIXDEC' && a.campanha_id !== 'WHA-MIXDEC';
    });

    var MSG = 'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';
    var GAP_NOVO = 10*60*1000;
    var GAP_BASE = 4*60*1000;
    var agora = new Date();
    var cursor = new Date(agora.getTime() + 5*60*1000);
    cursor.setSeconds(0,0);

    var criadas = 0, novos = 0, base = 0;
    comTel.forEach(function(x, i){
      var l = x.lead;
      var ehNovo = !(l.tentativas>0 || l.ultimo_contato);
      var gap = ehNovo ? GAP_NOVO : GAP_BASE;
      state.actions.push({
        id: 'ACT-' + Date.now() + '-k-' + i,
        opportunity_id: l.id,
        contato: l.contato || l.nome || '',
        empresa: l.empresa || l.nome || '',
        telefone: x.tel,
        canal: 'whatsapp',
        campanha_id: 'WHA-MIXDEC',
        campaign_id: 'WHA-MIXDEC',
        etapa: 'D0',
        acao: MSG, mensagem: MSG,
        prazo: cursor.toISOString(),
        prioridade: 'Alta', prioridade_fila: 1,
        status: 'AGENDADO',
        criadaEm: new Date().toISOString()
      });
      criadas++;
      if(ehNovo) novos++; else base++;
      cursor = new Date(cursor.getTime() + gap);
    });
    console.log('[kill] ações:', criadas, 'novos:', novos, 'base:', base);

    // 5. PERSISTE
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
      var s2 = JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}');
      s2.listas = state.listas;
      s2.campanhas = state.campaigns;
      s2.acoes = state.actions;
      localStorage.setItem('hermes-os.v7.user', JSON.stringify(s2));
    }catch(e){}

    if(typeof window.render==='function') window.render();
    if(window.__toastOK) window.__toastOK('Pronto', criadas+' leads em Hoje · '+novos+' novos · '+base+' base');
  }

  go();
})();
