(function(){
  /* Novos códigos: CUL-01, AGE-01, WAL-01, WAL-02
     Legíveis, curtos, óbvios. */
  var CAMPANHAS=[
    {id:'CUL-01', nome:'Produtoras Culturais +R$1MM', cor:'#e0b878',
     objetivo:'Prospecção de produtoras culturais com projetos acima de R$1MM',
     publico:{segmento:'Cultural',cargo:'Produtor, Diretor',localizacao:'BR'},
     oferta:'Estratégia + Conteúdo + IA', canais:['WhatsApp'],
     cadencia:'D0, D3, D7', volume_dia:10, meta_leads:42,
     inicio:'2026-10-07', fim:'2026-10-11', status:'EM EXECUÇÃO',
     origem:'hermes-work/C1'},

    {id:'AGE-01', nome:'Agências de Marketing · SP', cor:'#60a5fa',
     objetivo:'Prospecção de agências digitais médias em São Paulo',
     publico:{segmento:'Marketing',cargo:'Diretor, Sócio',localizacao:'SP'},
     oferta:'Squad de produto + IA aplicada', canais:['WhatsApp'],
     cadencia:'D0, D3, D7', volume_dia:10, meta_leads:60,
     inicio:'2026-10-14', fim:'2026-10-18', status:'PLANEJADA',
     origem:'hermes-work/C2'},

    {id:'WAL-01', nome:'WhatsApp · Tier 1-4 · Lista 1', cor:'#16a34a',
     objetivo:'Aquecimento da Lista 1 (Tier 1 a 4) por WhatsApp',
     publico:{segmento:'Multi',cargo:'Decisor',localizacao:'BR'},
     oferta:'Diagnóstico + IA aplicada', canais:['WhatsApp'],
     cadencia:'D0, D3, D7', volume_dia:10, meta_leads:30,
     inicio:'2026-10-08', fim:'2026-10-20', status:'PLANEJADA',
     origem:'hermes-work/W1'},

    {id:'WAL-02', nome:'WhatsApp · Tier 1-4 · Lista 2', cor:'#7c3aed',
     objetivo:'Aquecimento da Lista 2 (Tier 1 a 4) por WhatsApp',
     publico:{segmento:'Multi',cargo:'Decisor',localizacao:'BR'},
     oferta:'Diagnóstico + IA aplicada', canais:['WhatsApp'],
     cadencia:'D0, D3, D7', volume_dia:10, meta_leads:10,
     inicio:'2026-10-08', fim:'2026-10-20', status:'PLANEJADA',
     origem:'hermes-work/W2'}
  ];

  function aplicar(){
    if(typeof state==='undefined'||typeof loadUserStore!=='function'){setTimeout(aplicar,200);return;}
    if(window.__seedCampanhas)return;
    window.__seedCampanhas=true;

    /* 1) Zera tudo */
    state.campaigns=[];
    state.actions=[];
    state.campaignExpanded={};

    /* 2) Cria as 4 novas com métricas zeradas */
    CAMPANHAS.forEach(function(base){
      var c=Object.assign({},base,{
        responsavel:'Flávio',
        periodo:base.inicio+' – '+base.fim,
        etapas:['Qualificar','Aquecer','Abordar','Follow-up','Conversar','Reunião'],
        metricas:{enviados:0,respondidos:0,conversas:0,reunioes:0,propostas:0,ganhos:0},
        sugestao:false,
        criadaEm:new Date().toISOString()
      });
      state.campaigns.push(c);
    });

    /* 3) Salva no userStore */
    try{
      var store=loadUserStore();
      store.campanhas=state.campaigns.map(function(c){return JSON.parse(JSON.stringify(c));});
      store.acoes=[];
      store.acoesExcluidas=[];
      saveUserStore(store);
    }catch(e){}

    /* 4) Redesenha */
    if(typeof renderSidebar==='function')renderSidebar();
    if(typeof render==='function')render();
  }
  aplicar();
})();
