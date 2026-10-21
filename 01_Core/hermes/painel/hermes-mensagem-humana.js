(function(){
  /* Mensagem reescrita sem travessões, tom mais natural */
  var MSG = 'Ola {contato}, tudo bem? Estive olhando as avaliacoes publicas da {empresa} e o trabalho de voces com {segmento} chama atencao. Os elogios sao bem consistentes, da pra ver que a base de clientes esta satisfeita.\n\nPois justamente por isso me chamou atencao uma coisa. Empresas com essa reputacao ainda costumam perder venda em dois pontos: o comercial demora pra responder o lead e o trafego pago acaba ficando caro sem devolver o investimento.\n\nE nesses dois pontos que eu trabalho com Automacao Comercial e Trafego Pago. Monto o funil pra responder rapido sem deixar lead esfriar e rodo midia em cima do que realmente converte, nao do que so gera clique.\n\nFaz sentido a gente conversar 10 minutos essa semana?';

  var mudouC = 0;
  (state.campaigns || []).forEach(function(c){
    if(c.mensagem && c.mensagem.indexOf('—') >= 0){
      c.mensagem = MSG;
      mudouC++;
    }
  });

  var mudouA = 0;
  (state.actions || []).forEach(function(a){
    if(a.acao && a.acao.indexOf('—') >= 0){
      var o = (typeof oppOf === 'function') ? (oppOf(a.opportunity_id) || {}) : {};
      var nova = MSG
        .replace(/\{contato\}/g, a.contato || o.contato || 'tudo bem')
        .replace(/\{empresa\}/g, a.empresa || o.empresa || 'sua empresa')
        .replace(/\{segmento\}/g, o.segmento || 'seu setor');
      a.acao = nova.slice(0, 140) + (nova.length > 140 ? '...' : '');
      mudouA++;
    }
  });

  /* Persiste */
  try {
    var st = loadUserStore();
    (st.campanhas || []).forEach(function(c){
      if(c.mensagem && c.mensagem.indexOf('—') >= 0) c.mensagem = MSG;
    });
    (st.acoes || []).forEach(function(a){
      if(a.acao && a.acao.indexOf('—') >= 0){
        var o2 = (typeof oppOf === 'function') ? (oppOf(a.opportunity_id) || {}) : {};
        var n2 = MSG
          .replace(/\{contato\}/g, a.contato || o2.contato || 'tudo bem')
          .replace(/\{empresa\}/g, a.empresa || o2.empresa || 'sua empresa')
          .replace(/\{segmento\}/g, o2.segmento || 'seu setor');
        a.acao = n2.slice(0, 140) + (n2.length > 140 ? '...' : '');
      }
    });
    saveUserStore(st);
  } catch(e){}

  if(typeof render === 'function') render();

  var el = document.createElement('pre');
  el.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:13px monospace;padding:24px;z-index:999999;overflow:auto;white-space:pre-wrap';
  el.textContent =
    'MENSAGENS ATUALIZADAS\n\n' +
    'Campanhas ajustadas: ' + mudouC + '\n' +
    'Acoes ajustadas: ' + mudouA + '\n\n' +
    'Nova mensagem (sem travesoes, tom mais humano):\n\n' + MSG + '\n\n' +
    'Clique para fechar.';
  el.onclick = function(){ el.remove(); };
  document.body.appendChild(el);
})();
