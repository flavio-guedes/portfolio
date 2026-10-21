(function(){
  /* ---------- 1. Lista o que existe para diagnóstico ---------- */
  var cs = (state.campaigns || []);
  var ls = [];
  try { ls = (typeof userLists === 'function') ? userLists() : []; } catch(e){}

  /* ---------- 2. Acha campanha ---------- */
  var target = cs.filter(function(c){
    var n = String(c.nome || '').toLowerCase();
    return n.indexOf('wha') >= 0 && n.indexOf('quente') >= 0 && n.indexOf('decisor') >= 0;
  })[0];

  /* ---------- 3. Acha lista (pela referência da campanha ou pelo nome) ---------- */
  var lista = null;
  if(target && target.lista && target.lista !== 'base'){
    lista = ls.filter(function(l){ return l.id === target.lista; })[0] || null;
  }
  if(!lista){
    /* tenta pelo nome "selecao" ou "seleção" ou "quentes" */
    lista = ls.filter(function(l){
      var n = String(l.nome || '').toLowerCase();
      return (n.indexOf('sele') >= 0 || n.indexOf('quente') >= 0 || n.indexOf('decis') >= 0);
    })[0] || null;
  }

  /* ---------- 4. Monta lista de leads ---------- */
  var leads = [];
  if(lista && Array.isArray(lista.ids)){
    leads = lista.ids.map(function(id){
      return (typeof OPP_INDEX !== 'undefined' ? OPP_INDEX.get(id) : null) ||
             (state.opportunities || []).filter(function(o){ return o.id === id; })[0];
    }).filter(Boolean);
  }
  /* Se nada na lista, tenta campTargets */
  if(!leads.length && target){
    try { leads = (typeof campTargets === 'function') ? (campTargets(target) || []) : []; } catch(e){}
  }
  /* Último recurso: quentes do Grupo A */
  if(!leads.length){
    leads = (state.opportunities || []).filter(function(o){
      return o.grupo === 'A' && (o.temperatura === 'Quente' || o.temperatura === 'Muito quente');
    });
  }

  if(!target || !leads.length){
    var nomesC = cs.map(function(c){ return c.id + ' · ' + c.nome; }).join('\n') || '(nenhuma)';
    var nomesL = ls.map(function(l){ return l.id + ' · ' + l.nome + ' (' + (l.ids||[]).length + ')'; }).join('\n') || '(nenhuma)';
    var el0 = document.createElement('pre');
    el0.style.cssText = 'position:fixed;inset:0;background:#000;color:#f88;font:12px monospace;padding:24px;z-index:999999;overflow:auto;white-space:pre-wrap';
    el0.textContent =
      'DIAGNOSTICO\n\n' +
      'Campanha encontrada: ' + (target ? (target.id + ' · ' + target.nome) : 'NAO') + '\n' +
      'Lista encontrada: ' + (lista ? (lista.id + ' · ' + lista.nome + ' com ' + (lista.ids||[]).length + ' ids') : 'NAO') + '\n' +
      'Leads resolvidos: ' + leads.length + '\n\n' +
      '--- CAMPANHAS ---\n' + nomesC + '\n\n' +
      '--- LISTAS SALVAS ---\n' + nomesL + '\n\n' +
      'Clique para fechar.';
    el0.onclick = function(){ el0.remove(); };
    document.body.appendChild(el0);
    return;
  }

  /* ---------- 5. Nova abordagem ---------- */
  var MSG = 'Ola {contato}, dei uma olhada nas avaliacoes publicas sobre a {empresa} e o trabalho de voces com {segmento} chama atencao — os elogios sao consistentes.\n\nJustamente por isso estranhei ver empresas com essa reputacao perdendo venda em dois pontos: o comercial nao responde no tempo certo e o trafego pago fica caro sem gerar retorno.\n\nE o que eu resolvo com Automacao Comercial + Trafego Pago: monto o funil pra responder rapido sem perder lead e rodo midia em cima do que de fato converte.\n\nFaz sentido falarmos 10 minutos essa semana?';

  target.mensagem = MSG;
  target.estilo = 'Consultivo';
  target.oferta = 'Automacao Comercial + Trafego Pago';
  target.objetivo = 'Apresentar Automacao Comercial e Trafego Pago conectando com avaliacoes do lead';
  target.status = 'EM EXECUÇÃO';
  if(lista) target.lista = lista.id;

  /* ---------- 6. Move para a fila, respeitando o teto ---------- */
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

  /* ---------- 7. Persiste a campanha ---------- */
  try {
    var st = loadUserStore();
    var idx = (st.campanhas || []).findIndex(function(x){ return x.id === target.id; });
    if(idx >= 0) st.campanhas[idx] = JSON.parse(JSON.stringify(target));
    else st.campanhas.push(JSON.parse(JSON.stringify(target)));
    saveUserStore(st);
  } catch(e){}

  if(typeof render === 'function') render();

  /* ---------- 8. Resultado ---------- */
  var el = document.createElement('pre');
  el.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:13px monospace;padding:24px;z-index:999999;overflow:auto;white-space:pre-wrap';
  el.textContent =
    'CAMPANHA INICIADA\n\n' +
    'ID: ' + target.id + '\n' +
    'Nome: ' + target.nome + '\n' +
    'Lista: ' + (lista ? lista.nome : '(publico direto)') + '\n' +
    'Leads no publico: ' + leads.length + '\n' +
    'Ja estavam na fila: ' + (leads.length - novos.length) + '\n' +
    'Acoes criadas agora: ' + criadas + '\n' +
    'Teto/dia: ' + teto + '\n' +
    'Canal: ' + canal + '\n' +
    'Status: EM EXECUCAO\n\n' +
    'Mensagem aplicada:\n\n' + MSG + '\n\n' +
    'Clique aqui para fechar e ver na Fila.';
  el.onclick = function(){ el.remove(); if(typeof setView === 'function') setView('fila'); };
  document.body.appendChild(el);
})();
