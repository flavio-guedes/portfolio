(function(){
  if(window.__msg) return; window.__msg=true;

  var D0 = 'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Estou mapeando operações que cresceram e travaram em processo — faz sentido eu te mostrar em 15 min como resolver sem precisar comprar ferramenta nova? Se não for o momento, sem problema.';
  var D3 = '{contato}, uma coisa que quase ninguém faz antes de automatizar: mapear o processo atual. É por isso que 70% das automações em pequena empresa morrem em 3 meses. Quer que eu mapeie os 3 principais da {empresa} em 15 min?';
  var D7 = '{contato}, última mensagem da minha parte. Se em algum momento fizer sentido falar sobre processo e atendimento, é só responder aqui. Deixo o convite em aberto.';

  function go(){
    if(!window.state || !state.campaigns){ setTimeout(go, 500); return; }
    var n = 0;
    state.campaigns.forEach(function(c){
      if(c.id !== 'WHA-MIXDEC' && !/mix.*decisor/i.test(c.nome||'')) return;
      c.mensagens = c.mensagens || {};
      c.mensagens.D0 = {corpo: D0};
      c.mensagens.D3 = {corpo: D3};
      c.mensagens.D7 = {corpo: D7};
      n++;
    });
    /* também atualiza ações existentes para usar D0 novo */
    var atualizadas = 0;
    (state.actions||[]).forEach(function(a){
      if(a.campaign_id !== 'WHA-MIXDEC' && a.campanha_id !== 'WHA-MIXDEC') return;
      if(a.etapa && a.etapa !== 'D0') return;
      a.acao = D0; a.mensagem = D0;
      atualizadas++;
    });
    try{
      if(typeof loadUserStore==='function' && typeof saveUserStore==='function'){
        var s = loadUserStore();
        s.campanhas = state.campaigns;
        s.acoes = state.actions;
        saveUserStore(s);
      }
    }catch(e){}
    try{
      var s2 = JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}');
      s2.campanhas = state.campaigns;
      s2.acoes = state.actions;
      localStorage.setItem('hermes-os.v7.user', JSON.stringify(s2));
    }catch(e){}
    if(typeof render==='function') render();
    if(window.__toastOK) window.__toastOK('Mensagens atualizadas', n+' campanha(s) · '+atualizadas+' ações');
    console.log('[msg] campanhas='+n+' acoes='+atualizadas);
  }
  go();
})();
