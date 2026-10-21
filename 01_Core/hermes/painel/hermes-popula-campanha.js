(function(){
  if(window.__populaCampanha) return; window.__populaCampanha=true;

  var CAMP_ID = 'WHA-MIXDEC';
  var LISTA_RE = /mix.*decisor|decisor.*mix/i;
  var GAP_NOVO = 10*60*1000;
  var GAP_BASE =  4*60*1000;
  var INICIO_HOJE_HORA = 9;
  var FIM_DIA_HORA     = 18;
  var CHAVE = 'hermes-os.v7.user';

  function log(m){ try{ console.log('[popula]', m); }catch(e){} }
  function toastOK(t,s){ if(window.__toastOK) window.__toastOK(t,s); }
  function toastErro(t,s){ if(window.__toastErro) window.__toastErro(t,s); }

  function acharCampanha(){
    return (state.campaigns||[]).find(function(c){ return c.id===CAMP_ID; });
  }
  function acharLista(camp){
    if(camp && camp.lista_id){
      var L=(state.listas||[]).find(function(l){ return l.id===camp.lista_id; });
      if(L) return L;
    }
    var L2=(state.listas||[]).find(function(l){ return LISTA_RE.test(l.nome||''); });
    if(L2) return L2;
    if(camp && camp.publico && camp.publico.ids){
      return {id:'inline', nome:camp.nome, ids:camp.publico.ids.slice()};
    }
    return null;
  }
  function salvar(){
    try{
      if(typeof loadUserStore==='function' && typeof saveUserStore==='function'){
        var s=loadUserStore(); s.acoes=state.actions; saveUserStore(s);
      }
    }catch(e){}
    try{
      var s2=JSON.parse(localStorage.getItem(CHAVE)||'{}');
      s2.acoes=state.actions;
      localStorage.setItem(CHAVE, JSON.stringify(s2));
    }catch(e){}
  }

  function go(){
    if(typeof state==='undefined' || !state.opportunities){ setTimeout(go,400); return; }

    var camp = acharCampanha();
    if(!camp){ toastErro('Campanha não encontrada', CAMP_ID); return; }

    var L = acharLista(camp);
    if(!L || !L.ids || !L.ids.length){ toastErro('Lista vazia', 'sem leads'); return; }

    var porId = {};
    state.opportunities.forEach(function(o){ porId[o.id]=o; });

    var msg = 'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';
    if(camp.mensagens && camp.mensagens.D0 && camp.mensagens.D0.corpo){
      msg = camp.mensagens.D0.corpo;
    }

    var agora = new Date();
    var cursor = new Date();
    cursor.setHours(INICIO_HOJE_HORA, 0, 0, 0);
    if(cursor.getTime() < agora.getTime()){
      cursor = new Date(agora.getTime() + 5*60*1000);
      cursor.setSeconds(0,0);
    }

    state.actions = (state.actions||[]).filter(function(a){
      return a.campaign_id !== CAMP_ID && a.campanha_id !== CAMP_ID;
    });

    var criadas = 0, semTel = 0, novos = 0, base = 0;
    var porDia = {};

    L.ids.forEach(function(oppId, i){
      var l = porId[oppId];
      if(!l) return;

      var tel = (l.whatsapp || l.telefone || '').toString().trim();
      var ehNovo = !(l.tentativas>0 || l.ultimo_contato);
      var gap = ehNovo ? GAP_NOVO : GAP_BASE;

      if(cursor.getHours() >= FIM_DIA_HORA){
        cursor.setDate(cursor.getDate()+1);
        cursor.setHours(INICIO_HOJE_HORA, 0, 0, 0);
      }

      var dia = cursor.toISOString().slice(0,10);
      porDia[dia] = (porDia[dia]||0)+1;

      state.actions.push({
        id: 'ACT-'+Date.now()+'-p-'+i,
        opportunity_id: oppId,
        contato: l.contato || l.nome || '',
        empresa: l.empresa || l.nome || '',
        telefone: tel,
        canal: 'whatsapp',
        campanha_id: CAMP_ID,
        campaign_id: CAMP_ID,
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

    salvar();
    if(typeof window.render==='function') window.render();

    var dias = Object.keys(porDia).sort();
    var resumo = dias.map(function(d){ return d.slice(5)+': '+porDia[d]; }).join(' · ');

    log('criadas='+criadas+' novos='+novos+' base='+base+' semTel='+semTel);
    log('distribuição: '+resumo);
    toastOK('Campanha populada', criadas+' leads · '+dias.length+' dia(s)');
  }

  go();
  setTimeout(go, 1500);
})();
