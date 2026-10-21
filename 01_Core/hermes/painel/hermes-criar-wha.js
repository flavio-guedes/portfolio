(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* --------- 1. Filtra leads: Quentes + Decisores --------- */
  var todos = state.opportunities || [];
  var leads = todos.filter(function(o){
    var quente = (o.temperatura === 'Quente' || o.temperatura === 'Muito quente');
    var decisor = (o.perfil === 'Decisor');
    var aberto = (o.estagio !== 'Fechado' && o.estagio !== 'Perdido');
    return quente && decisor && aberto;
  });

  if(!leads.length){
    alert('Nenhum lead Quente + Decisor encontrado na base.');
    return;
  }

  /* --------- 2. Cria a lista salva com esses leads --------- */
  var lid = 'LST-WHA-' + Date.now();
  var lNome = 'Wha - Quentes - Decisores - 16 OUT · seleção';
  try {
    var st = (typeof loadUserStore === 'function') ? loadUserStore() : {campanhas:[],listas:[],leadsExtras:[],acoes:[]};
    st.listas = st.listas || [];
    /* Remove lista anterior com o mesmo nome, se houver */
    st.listas = st.listas.filter(function(l){ return l.nome !== lNome; });
    st.listas.push({
      id: lid,
      nome: lNome,
      ids: leads.map(function(o){ return o.id; }),
      filtro: 'Quentes + Decisores · base',
      criadaEm: new Date().toISOString()
    });
    if(typeof saveUserStore === 'function') saveUserStore(st);
  } catch(e){
    alert('Erro ao salvar lista: ' + e.message);
    return;
  }

  /* --------- 3. Cria a campanha --------- */
  var MSG = 'Ola {contato}, dei uma olhada nas avaliacoes publicas sobre a {empresa} e o trabalho de voces com {segmento} chama atencao — os elogios sao consistentes.\n\nJustamente por isso estranhei ver empresas com essa reputacao perdendo venda em dois pontos: o comercial nao responde no tempo certo e o trafego pago fica caro sem gerar retorno.\n\nE o que eu resolvo com Automacao Comercial + Trafego Pago: monto o funil pra responder rapido sem perder lead e rodo midia em cima do que de fato converte.\n\nFaz sentido falarmos 10 minutos essa semana?';

  var cid = 'WHA-01';
  /* Se já existir WHA-01, gera WHA-02, WHA-03... */
  var usados = (state.campaigns || []).map(function(c){ return c.id; });
  if(usados.indexOf(cid) >= 0){
    var n = 2;
    while(usados.indexOf('WHA-0' + n) >= 0) n++;
    cid = 'WHA-0' + n;
  }

  var camp = {
    id: cid,
    nome: 'Wha - Quentes - Decisores - 16 OUT',
    cor: '#4ade80',
    objetivo: 'Apresentar Automacao Comercial e Trafego Pago a leads quentes e decisores',
    publico: {segmento: 'Multi', cargo: 'Decisor', localizacao: 'BR'},
    oferta: 'Automacao Comercial + Trafego Pago',
    canais: ['WhatsApp'],
    cadencia: 'D0, D3, D7',
    cadencia_min: 10,
    volume_dia: 30,
    meta_leads: leads.length,
    inicio: '2026-10-16',
    fim: '2026-10-31',
    status: 'EM EXECUÇÃO',
    responsavel: 'Flávio',
    periodo: '16 out – 31 out',
    etapas: ['Abordar', 'Follow-up', 'Conversar'],
    mensagem: MSG,
    estilo: 'Consultivo',
    lista: lid,
    origem: 'criada pelo painel',
    metricas: {enviados:0,respondidos:0,conversas:0,reunioes:0,propostas:0,ganhos:0},
    sugestao: false,
    criadaEm: new Date().toISOString()
  };

  state.campaigns = state.campaigns || [];
  state.campaigns.push(camp);

  try {
    var st2 = loadUserStore();
    st2.campanhas = st2.campanhas || [];
    st2.campanhas.push(JSON.parse(JSON.stringify(camp)));
    if(typeof saveUserStore === 'function') saveUserStore(st2);
  } catch(e){}

  /* --------- 4. Cria as ações (mover para Fila) --------- */
  var teto = 30;
  var lote = leads.slice(0, teto);
  var base = '2026-10-16T09:00';
  var cadMin = 10;
  var criadas = 0;

  lote.forEach(function(l, i){
    var quando = new Date(new Date(base).getTime() + cadMin * i * 60000);
    var preview = MSG
      .replace(/\{contato\}/g, l.contato || l.empresa || 'tudo bem')
      .replace(/\{empresa\}/g, l.empresa || 'sua empresa')
      .replace(/\{segmento\}/g, l.segmento || 'seu setor');
    var ac = {
      id: 'ACT-' + cid + '-' + l.id,
      opportunity_id: l.id,
      campaign_id: cid,
      contato: l.contato || l.empresa,
      empresa: l.empresa,
      canal: 'WhatsApp',
      etapa: 'D0',
      acao: preview.slice(0, 140),
      prazo: quando.toISOString().slice(0, 16),
      prioridade: 'Alta',
      prioridade_fila: 1,
      status: 'AGENDADO',
      publico: camp.publico
    };
    try { if(typeof upsertAction === 'function') upsertAction(ac); else state.actions.push(ac); }
    catch(e){ state.actions.push(ac); }
    criadas++;
  });

  if(typeof render === 'function') render();

  /* --------- 5. Resultado --------- */
  var el = document.createElement('pre');
  el.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:13px monospace;padding:24px;z-index:999999;overflow:auto;white-space:pre-wrap';
  el.textContent =
    'CAMPANHA CRIADA\n\n' +
    'ID: ' + cid + '\n' +
    'Nome: Wha - Quentes - Decisores - 16 OUT\n' +
    'Lista: ' + lNome + '\n' +
    'Leads no publico: ' + leads.length + '\n' +
    'Acoes criadas agora: ' + criadas + '\n' +
    'Teto/dia: ' + teto + '\n' +
    'Canal: WhatsApp\n' +
    'Inicio: 16/10 as 09:00\n' +
    'Cadencia: 10 min entre cada\n' +
    'Status: EM EXECUCAO\n\n' +
    'Mensagem aplicada:\n\n' + MSG + '\n\n' +
    'Clique aqui para fechar e ver na Fila.';
  el.onclick = function(){
    el.remove();
    if(typeof setView === 'function') setView('fila');
  };
  document.body.appendChild(el);
})();
