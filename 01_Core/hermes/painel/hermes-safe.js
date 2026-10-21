(function(){
  if(window.__safe) return; window.__safe=true;

  function log(){ try{ console.log.apply(console, ['[safe]'].concat([].slice.call(arguments))); }catch(e){} }
  function tOK(t,s){ if(window.__toastOK) window.__toastOK(t,s); }
  function tErro(t,s){ if(window.__toastErro) window.__toastErro(t,s); }
  function tInfo(t,s){ if(window.__toastInfo) window.__toastInfo(t,s); }

  function acharTel(lead){
    var tel='';
    Object.keys(lead||{}).forEach(function(k){
      if(tel) return;
      var v = lead[k];
      if(typeof v!=='string') return;
      var d = v.replace(/\D/g,'');
      if(d.length>=10 && d.length<=15) tel=d;
    });
    return tel;
  }

  function go(){
    if(!window.state||!state.opportunities||!state.opportunities.length){
      setTimeout(go, 500); return;
    }
    var opps = state.opportunities;
    log('opps:', opps.length);

    /* Busca: lista existente, senão cria do zero */
    var lista = (state.listas||[]).find(function(l){ return /mix.*decisor/i.test(l.nome||''); });

    if(!lista){
      var cand = opps.filter(function(o){
        var c = (o.canal||o.channel||'').toString().toLowerCase();
        if(c && c.indexOf('whats')<0) return false;
        return !!acharTel(o);
      }).slice(0,83);
      if(!cand.length){
        tErro('Sem leads WhatsApp+tel', 'checar campos');
        log('amostra:', Object.keys(opps[0]||{}).join(','));
        return;
      }
      lista = {
        id:'LST-MIXDEC',
        nome:'Wha - Quentes - Mix - Decisor',
        ids: cand.map(function(o){return o.id;}),
        descricao: cand.length+' lead(s) · WhatsApp',
        criadaEm: new Date().toISOString()
      };
      state.listas = state.listas || [];
      state.listas.push(lista);
      log('lista criada:', lista.ids.length);
      tInfo('Lista criada', lista.ids.length+' leads');
    } else {
      log('lista existente:', lista.ids.length);
    }

    /* Busca: campanha existente, senão cria */
    var camp = (state.campaigns||[]).find(function(c){ return /mix.*decisor/i.test(c.nome||''); });
    if(!camp){
      var hoje = new Date().toISOString().slice(0,10);
      var fim = new Date(); fim.setDate(fim.getDate()+7);
      camp = {
        id:'WHA-MIXDEC',
        nome:'Wha - Quentes - Mix - Decisor',
        canal:'whatsapp', status:'ATIVA', cor:'#22c55e',
        inicio:hoje, fim:fim.toISOString().slice(0,10),
        meta_leads: lista.ids.length,
        lista_id: lista.id, lista_nome: lista.nome,
        publico:{total:lista.ids.length, ids:lista.ids.slice()},
        mensagens:{
          D0:{corpo:'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?'},
          D3:{corpo:'Follow-up — {contato}, ainda faz sentido?'},
          D7:{corpo:'Encerramento — {contato}, deixo em aberto.'}
        },
        cadencia:['D0','D3','D7'], cadencia_min:4,
        criadaEm:new Date().toISOString()
      };
      state.campaigns = state.campaigns || [];
      state.campaigns.push(camp);
      log('campanha criada');
      tInfo('Campanha criada', camp.nome);
    } else {
      log('campanha existente');
      camp.status = 'ATIVA';
    }

    /* Ações: só cria as que faltam, não apaga nada */
    var acoesCamp = (state.actions||[]).filter(function(a){
      return a.campaign_id === camp.id || a.campanha_id === camp.id;
    });
    if(acoesCamp.length >= lista.ids.length){
      log('ações já completas:', acoesCamp.length);
      persistir();
      if(typeof window.render==='function') window.render();
      tOK('Sistema pronto', lista.ids.length+' leads em fila');
      return;
    }

    /* Cria só as ações que faltam (compara por opportunity_id) */
    var jaTem = {};
    acoesCamp.forEach(function(a){ jaTem[a.opportunity_id] = true; });

    var porId = {};
    opps.forEach(function(o){ porId[o.id] = o; });

    var MSG = camp.mensagens && camp.mensagens.D0 ? camp.mensagens.D0.corpo : 'Oi {contato}';
    var GAP_NOVO = 10*60*1000, GAP_BASE = 4*60*1000;
    var agora = new Date();
    var cursor = new Date(agora.getTime() + 5*60*1000);
    cursor.setSeconds(0,0);

    var criadas = 0, novos = 0, base = 0, jaExistiam = 0;
    lista.ids.forEach(function(oid){
      if(jaTem[oid]){ jaExistiam++; return; }
      var l = porId[oid];
      if(!l) return;
      var tel = acharTel(l);
      if(!tel) return;
      var ehNovo = !(l.tentativas>0 || l.ultimo_contato);
      var gap = ehNovo ? GAP_NOVO : GAP_BASE;
      state.actions = state.actions || [];
      state.actions.push({
        id: 'ACT-' + Date.now() + '-sf-' + criadas,
        opportunity_id: oid,
        contato: l.contato || l.nome || '',
        empresa: l.empresa || l.nome || '',
        telefone: tel,
        canal: 'whatsapp',
        campanha_id: camp.id, campaign_id: camp.id,
        etapa: 'D0', acao: MSG, mensagem: MSG,
        prazo: cursor.toISOString(),
        prioridade: 'Alta', prioridade_fila: 1,
        status: 'AGENDADO',
        criadaEm: new Date().toISOString()
      });
      criadas++;
      if(ehNovo) novos++; else base++;
      cursor = new Date(cursor.getTime() + gap);
    });

    persistir();
    if(typeof window.render==='function') window.render();
    log('criadas='+criadas+' jaExistiam='+jaExistiam+' novos='+novos+' base='+base);
    tOK('Fila pronta', criadas+' novas · '+jaExistiam+' já existiam');
  }

  function persistir(){
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
  }

  go();
})();
