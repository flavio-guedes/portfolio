(function(){
  /* 1. Localiza a campanha */
  var cs = state.campaigns || [];
  var target = cs.filter(function(c){
    var n = String(c.nome || '').toLowerCase();
    return n.indexOf('wha') >= 0 && n.indexOf('quente') >= 0 && n.indexOf('decisor') >= 0;
  })[0];

  if(!target){
    var nomes = cs.map(function(c){ return c.id + ' · ' + c.nome; }).join('\n') || '(nenhuma)';
    var el0 = document.createElement('pre');
    el0.style.cssText = 'position:fixed;inset:0;background:#000;color:#f55;font:12px monospace;padding:24px;z-index:999999;overflow:auto;white-space:pre-wrap';
    el0.textContent = 'Campanha nao encontrada.\n\nCampanhas existentes:\n' + nomes + '\n\nClique para fechar.';
    el0.onclick = function(){ el0.remove(); };
    document.body.appendChild(el0);
    return;
  }

  /* 2. Nova abordagem: avaliações -> Automação Comercial + Tráfego Pago */
  var MSG = 'Ola {contato}, dei uma olhada nas avaliacoes publicas sobre a {empresa} e o trabalho de voces com {segmento} chama atencao — os elogios sao consistentes. Justamente por isso estranhei ver empresas com essa reputacao perdendo venda em dois pontos: o comercial nao responde no tempo certo e o trafego pago fica caro sem gerar retorno.\n\nE o que eu resolvo com Automacao Comercial + Trafego Pago: monto o funil pra responder rapido sem perder lead e rodo midia em cima do que de fato converte.\n\nFaz sentido falarmos 10 minutos essa semana?';

  target.mensagem = MSG;
  target.estilo = 'Consultivo';
  target.oferta = 'Automacao Comercial + Trafego Pago';
  target.objetivo = 'Apresentar Automacao Comercial e Trafego Pago conectando com avaliacoes do lead';
  target.status = 'EM EXECUÇÃO';

  /* 3. Coleta leads do público */
  var leads = [];
  try { leads = (typeof campTargets === 'function') ? (campTargets(target) || []) : []; } catch(e){}
  if(!leads.length && target.lista && target.lista !== 'base'){
    try {
      var store = loadUserStore();
      var l = (store.listas || []).filter(function(x){ return x.id === target.lista; })[0];
      if(l){
        leads = l.ids.map(function(id){
          return (typeof OPP_INDEX !== 'undefined' ? OPP_INDEX.get(id) : null) ||
                 (state.opportunities || []).filter(function(o){ return o.id === id; })[0];
        }).filter(Boolean);
      }
    } catch(e){}
  }
  if(!leads.length) leads = (state.opportunities || []).filter(function(o){
    return o.grupo === 'A' && (o.temperatura === 'Quente' || o.temperatura === 'Muito quente');
  });

  if(!leads.length){
    alert('Campanha encontrada (' + target.id + ' · ' + target.nome + ') mas sem leads.');
    return;
  }

  /* 4. Move para a fila, respeitando o teto diário */
  var existentes = (state.actions || []).filter(function(a){ return String(a.campaign_id) === String(target.id); });
  var jaTem = existentes.map(function(a){ return String(a.opportunity_id); });
  var novos = leads.filter(function(l){ return jaTem.indexOf(String(l.id)) < 0; });
  var teto = target.volume_dia || 30;
  var lote = novos.slice(0, teto);
  var base = target.agendada_em || (target.inicio ? target.inicio + 'T09:00' : null);
  if(!base){
    var d0 = new Date(); d0.setMinutes(0,0,0); d0.setHours(d0.getHours() + 1);
    var p2 = function(n){ return String(n).padStart(2,'0'); };
    base = d0.getFullYear() + '-' + p2(d0.getMonth()+1) + '-' + p2(d0.getDate()) + 'T' + p2(d0.getHours()) + ':' + p2(d0.getMinutes());
  }
  var cadMin = target.cadencia_min || 10;
  var canal = (target.canais && target.canais[0]) || 'WhatsApp';
  var criadas = 0;

  lote.forEach(function(l, i){
    var quando = new Date(new Date(base).getTime() + cadMin * i * 60000);
    var preview = MSG
      .replace(/\{contato\}/g, l.contato || l.empresa || 'tudo bem')
      .replace(/\{empresa\}/g, l.empresa || 'sua empresa')
      .replace(/\{segmento\}/g, (target.publico && target.publico.segmento) || l.segmento || 'seu setor');
    var ac = {
      id: 'ACT-' + target.id + '-' + l.id,
      opportunity_id: l.id,
      campaign_id: target.id,
      contato: l.contato || l.empresa,
      empresa: l.empresa,
      canal: canal,
      etapa: 'D0',
      acao: preview.slice(0, 140) + (preview.length > 140 ? '…' : ''),
      prazo: quando.toISOString().slice(0, 16),
      prioridade: 'Alta',
      prioridade_fila: 1,
      status: 'AGENDADO',
      publico: target.publico || {}
    };
    try { if(typeof upsertAction === 'function') upsertAction(ac); else state.actions.push(ac); }
    catch(e){ state.actions.push(ac); }
    criadas++;
  });

  /* 5. Persiste a campanha com o novo texto e o status */
  try {
    var st = loadUserStore();
    var idx = (st.campanhas || []).findIndex(function(x){ return x.id === target.id; });
    if(idx >= 0) st.campanhas[idx] = JSON.parse(JSON.stringify(target));
    else st.campanhas.push(JSON.parse(JSON.stringify(target)));
    saveUserStore(st);
  } catch(e){}

  if(typeof render === 'function') render();

  /* 6. Resultado */
  var el = document.createElement('pre');
  el.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:13px monospace;padding:24px;z-index:999999;overflow:auto;white-space:pre-wrap';
  el.textContent =
    'CAMPANHA INICIADA\n\n' +
    'ID: ' + target.id + '\n' +
    'Nome: ' + target.nome + '\n' +
    'Leads no publico: ' + leads.length + '\n' +
    'Acoes criadas agora: ' + criadas + '\n' +
    'Teto/dia: ' + teto + '\n' +
    'Canal: ' + canal + '\n' +
    'Status: EM EXECUCAO\n\n' +
    'Mensagem aplicada (variaveis resolvidas por lead no envio):\n\n' + MSG + '\n\n' +
    'Clique aqui para fechar e ver na Fila.';
  el.onclick = function(){ el.remove(); if(typeof setView === 'function') setView('fila'); };
  document.body.appendChild(el);
})();
