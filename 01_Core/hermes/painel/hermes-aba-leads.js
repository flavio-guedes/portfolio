(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function num(v){return (typeof fmtNum==='function')?fmtNum(v):String(v);}
  function bd(t,tone){return '<span class="badge '+(tone||'')+'">'+esc(t)+'</span>';}
  function limpar(s){return String(s||'').replace(/\D/g,'');}
  var DDD=[11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99];
  function waValido(tel){
    var d=limpar(tel); if(!d)return false;
    if(d.length>=12 && d.slice(0,2)==='55'){var s=d.slice(2);if(s.length>=10 && DDD.indexOf(parseInt(s.slice(0,2),10))>=0)d=s;}
    if(d.length===13 && d[0]==='0')d=d.slice(1);
    if(d.length!==11)return false;
    var ddd=parseInt(d.slice(0,2),10); if(DDD.indexOf(ddd)<0)return false;
    if(d[2]!=='9')return false;
    return true;
  }

  /* Seleção persistente em memória */
  if(!state.leadsSel) state.leadsSel={};

  function selecionados(){return Object.keys(state.leadsSel).filter(function(k){return state.leadsSel[k];});}
  function contSel(){return selecionados().length;}

  /* Aplica filtros ativos */
  function match(o){
    var f=state.filters||{};
    if(f.contexto!=='all' && o.tipo!==f.contexto)return false;
    if(f.campanha!=='all' && String(o.campaign_id||'')!==String(f.campanha))return false;
    if(f.canal!=='all' && o.canal_preferido!==f.canal)return false;
    if(f.estagio!=='all' && o.estagio!==f.estagio)return false;
    if(f.prioridade!=='all' && o.prioridade!==f.prioridade)return false;
    if(f.grupo!=='all' && o.grupo!==f.grupo)return false;
    return true;
  }

  function viewLeads(){
    var all=(state.opportunities||[]).filter(match);
    var tot=all.length;
    var sel=contSel();
    var comWA=all.filter(function(o){return waValido(o.whatsapp||o.telefone||'');}).length;

    var h='<div class="op-kpis">'+
      '<button class="op-kpi"><b>'+num(tot)+'</b><span>Leads no filtro</span></button>'+
      '<button class="op-kpi is-ok"><b>'+num(comWA)+'</b><span>Com WhatsApp</span></button>'+
      '<button class="op-kpi'+(sel?' is-info':'')+'"><b>'+num(sel)+'</b><span>Selecionados</span></button>'+
      '</div>';

    /* Barra de ações em massa */
    if(sel){
      h+='<div class="card left-accent" style="padding:12px 14px;margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">';
      h+='<div style="flex:1;min-width:180px"><b>'+num(sel)+' lead(s) selecionado(s)</b>';
      h+='<div class="sub" style="font-size:11px;margin-top:2px">O que fazer com a seleção</div></div>';
      h+='<button class="btn primary sm" data-leads-criar-lista>💾 Salvar como lista</button>';
      h+='<button class="btn sm" data-leads-add-camp>＋ Adicionar a campanha</button>';
      h+='<button class="btn sm" data-leads-nova-camp>⚡ Criar campanha com seleção</button>';
      h+='<button class="btn sm" data-leads-criar-mensagem>✎ Gerar mensagem</button>';
      h+='<button class="btn sm ghost" data-leads-clear>Limpar seleção</button>';
      h+='</div>';
    }

    /* Ações para todos do filtro */
    h+='<div class="op-bar"><button class="btn sm" data-leads-sel-all>☑ Selecionar todos do filtro ('+num(tot)+')</button>';
    h+='<button class="btn sm ghost" data-leads-sel-wa>Selecionar só com WhatsApp ('+num(comWA)+')</button>';
    h+='<span class="sp"></span><span class="sub" style="font-size:11px">Use os filtros do topo para reduzir a lista</span></div>';

    /* Lista */
    if(!tot){h+='<div class="op-list"><div class="op-empty">Nenhum lead com esses filtros.</div></div>';return h;}
    h+='<div class="op-list" style="max-height:calc(100vh - 320px);overflow:auto">';
    all.slice(0,300).forEach(function(o){
      var sel2=!!state.leadsSel[o.id];
      var wa=waValido(o.whatsapp||o.telefone||'');
      var tom=o.grupo==='A'?'t-info':o.grupo==='B'?'t-warn':'';
      h+='<div class="op-row is-click '+tom+'" data-leads-toggle="'+esc(o.id)+'" style="grid-template-columns:24px minmax(0,1fr) auto auto auto">';
      h+='<div><input type="checkbox" '+(sel2?'checked':'')+' style="pointer-events:none;accent-color:var(--accent)"></div>';
      h+='<div style="min-width:0"><div class="t" style="overflow-wrap:anywhere">'+esc(o.empresa||o.contato||'—')+(wa?' <span style="color:#4ade80;font-size:9px;font-weight:800">✓ WA</span>':'')+'</div>';
      h+='<div class="d">'+esc(o.descricao||o.segmento||'')+'</div></div>';
      h+='<div><span class="chip-s">'+esc(o.grupo||'?')+'</span></div>';
      h+='<div><span class="chip-s">'+esc(o.score||0)+'</span></div>';
      h+='<div><span class="chip-s">'+esc(o.temperatura||'—')+'</span></div>';
      h+='</div>';
    });
    if(tot>300)h+='<div class="op-empty" style="padding:10px">+ '+(tot-300)+' além destes (refine os filtros)</div>';
    h+='</div>';

    /* Publicos salvos */
    var ls=(typeof userLists==='function')?userLists():[];
    h+='<div class="op-head" style="margin-top:22px"><h2>Públicos salvos</h2><span class="sub">'+ls.length+' lista(s)</span></div>';
    if(ls.length){
      h+='<div class="card" style="padding:0">';
      ls.forEach(function(l){
        h+='<div class="op-row is-click" data-leads-usar-lista="'+esc(l.id)+'" style="grid-template-columns:minmax(0,1fr) auto auto">';
        h+='<div><div class="t">'+esc(l.nome)+'</div><div class="d">'+num(l.ids.length)+' lead(s) · '+esc(l.filtro||'')+'</div></div>';
        h+='<div class="acts"><button class="btn sm" data-leads-lista-camp="'+esc(l.id)+'">Criar campanha</button></div>';
        h+='<div class="acts"><button class="btn sm ghost danger" data-leads-del-lista="'+esc(l.id)+'">×</button></div>';
        h+='</div>';
      });
      h+='</div>';
    } else {
      h+='<div class="op-empty">Nenhum público salvo ainda. Selecione leads e clique em <b>Salvar como lista</b>.</div>';
    }

    return h;
  }

  /* ========== AÇÕES ========== */
  function selAll(){
    var all=(state.opportunities||[]).filter(match);
    all.forEach(function(o){state.leadsSel[o.id]=true;});
    if(typeof render==='function')render();
  }
  function selWA(){
    var all=(state.opportunities||[]).filter(match).filter(function(o){return waValido(o.whatsapp||o.telefone||'');});
    all.forEach(function(o){state.leadsSel[o.id]=true;});
    if(typeof render==='function')render();
  }
  function clearSel(){state.leadsSel={};if(typeof render==='function')render();}

  function salvarComoLista(){
    var ids=selecionados();
    if(!ids.length){alert('Selecione pelo menos um lead.');return;}
    var nome=prompt('Nome do público:', 'Público '+new Date().toLocaleDateString('pt-BR'));
    if(!nome)return;
    var store=(typeof loadUserStore==='function')?loadUserStore():{campanhas:[],listas:[],leadsExtras:[],acoes:[]};
    var l={id:'LST-'+Date.now(),nome:nome,ids:ids,filtro:'criada na aba Leads',criadaEm:new Date().toISOString()};
    store.listas=store.listas||[];
    store.listas.push(l);
    if(typeof saveUserStore==='function')saveUserStore(store);
    state.leadsSel={};
    alert('Público salvo: "'+nome+'" ('+ids.length+' leads)');
    if(typeof render==='function')render();
  }

  function addCampanha(){
    var ids=selecionados();
    if(!ids.length){alert('Selecione pelo menos um lead.');return;}
    var cs=(state.campaigns||[]).filter(function(c){return !c.sugestao;});
    if(!cs.length){alert('Nenhuma campanha criada. Crie uma primeiro.');return;}
    var menu=cs.map(function(c,i){return (i+1)+') '+c.id+' · '+c.nome;}).join('\n');
    var resp=prompt('Adicionar '+ids.length+' lead(s) a qual campanha?\n\n'+menu+'\n\nDigite o número ou o ID:', cs[0].id);
    if(!resp)return;
    var idx=parseInt(resp,10);
    var c=(idx>0&&idx<=cs.length)?cs[idx-1]:cs.filter(function(x){return x.id===resp;})[0];
    if(!c){alert('Campanha não encontrada.');return;}
    /* Cria as ações */
    var criadas=0;
    var base=c.agendada_em||(c.inicio?c.inicio+'T09:00':new Date().toISOString().slice(0,16));
    var cadMin=c.cadencia_min||10;
    var canal=(c.canais&&c.canais[0])||'WhatsApp';
    ids.forEach(function(id,i){
      var o=(typeof oppOf==='function')?oppOf(id):null;if(!o)return;
      var quando=new Date(new Date(base).getTime()+cadMin*i*60000);
      var ac={id:'ACT-'+c.id+'-'+o.id,opportunity_id:o.id,campaign_id:c.id,contato:o.contato||o.empresa,empresa:o.empresa,canal:canal,etapa:'D0',acao:'Primeiro contato',prazo:quando.toISOString().slice(0,16),prioridade:'Média',prioridade_fila:2,status:'AGENDADO',publico:c.publico||{}};
      try{if(typeof upsertAction==='function')upsertAction(ac);else state.actions.push(ac);}catch(e){state.actions.push(ac);}
      criadas++;
    });
    state.leadsSel={};
    alert(criadas+' lead(s) adicionados à campanha '+c.id+'. Ações geradas na Fila.');
    if(typeof render==='function')render();
  }

  function novaCampanhaComSel(){
    var ids=selecionados();
    if(!ids.length){alert('Selecione pelo menos um lead.');return;}
    var nome=prompt('Nome da nova campanha:', 'Campanha '+new Date().toLocaleDateString('pt-BR'));
    if(!nome)return;
    /* Cria lista temporária */
    var store=(typeof loadUserStore==='function')?loadUserStore():{campanhas:[],listas:[],leadsExtras:[],acoes:[]};
    var lid='LST-SEL-'+Date.now();
    store.listas=store.listas||[];
    store.listas.push({id:lid,nome:nome+' · seleção',ids:ids,filtro:'seleção da aba Leads',criadaEm:new Date().toISOString()});
    if(typeof saveUserStore==='function')saveUserStore(store);
    /* Abre o formulário já preenchido */
    var prefill={nome:nome,lista:lid,publico:{segmento:'Multi',cargo:'',localizacao:''}};
    if(typeof modalCampanha==='function'&&typeof openModal==='function'){
      openModal(modalCampanha(false,prefill,false));
      if(typeof afterCampModal==='function')afterCampModal();
    }
    state.leadsSel={};
  }

  function gerarMensagem(){
    var ids=selecionados();
    if(!ids.length)return;
    var tmpl=prompt('Template da mensagem:\n\n{contato} {empresa} {oferta} {objetivo} {segmento}', 'Olá {contato}, tudo bem? Aqui é Flávio. Sobre {oferta} — {objetivo}. Podemos falar 10 min?');
    if(!tmpl)return;
    var msgs=[];
    ids.slice(0,50).forEach(function(id){
      var o=(typeof oppOf==='function')?oppOf(id):null;if(!o)return;
      var t=tmpl.replace(/\{contato\}/g,o.contato||o.empresa||'tudo bem').replace(/\{empresa\}/g,o.empresa||'sua empresa').replace(/\{oferta\}/g,'nosso trabalho').replace(/\{objetivo\}/g,'').replace(/\{segmento\}/g,o.segmento||'seu setor');
      msgs.push(o.empresa+' ('+(o.telefone||o.whatsapp||'')+')\n'+t);
    });
    var txt=msgs.join('\n\n---\n\n');
    try{
      var a=document.createElement('a');a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);a.download='mensagens.txt';document.body.appendChild(a);a.click();a.remove();
    }catch(e){}
    var el=document.createElement('pre');
    el.style.cssText='position:fixed;inset:0;background:#000;color:#0f0;font:12px monospace;padding:24px;z-index:999999;overflow:auto;white-space:pre-wrap';
    el.textContent=txt;
    el.onclick=function(){el.remove();};
    document.body.appendChild(el);
  }

  function criarCampanhaDLista(lid){
    var store=(typeof loadUserStore==='function')?loadUserStore():null;if(!store)return;
    var l=(store.listas||[]).filter(function(x){return x.id===lid;})[0];if(!l)return;
    var nome=prompt('Nome da campanha:', l.nome);
    if(!nome)return;
    var prefill={nome:nome,lista:lid,publico:{segmento:'Multi',cargo:'',localizacao:''}};
    if(typeof modalCampanha==='function'&&typeof openModal==='function'){
      openModal(modalCampanha(false,prefill,false));
      if(typeof afterCampModal==='function')afterCampModal();
    }
  }
  function delLista(lid){
    if(!confirm('Excluir este público?'))return;
    var store=(typeof loadUserStore==='function')?loadUserStore():null;if(!store)return;
    store.listas=(store.listas||[]).filter(function(x){return x.id!==lid;});
    if(typeof saveUserStore==='function')saveUserStore(store);
    if(typeof render==='function')render();
  }

  /* ========== APLICAR ========== */
  function aplicar(){
    if(typeof VIEWS==='undefined'||typeof userCfg==='undefined'){setTimeout(aplicar,200);return;}
    VIEWS.leads=viewLeads;
    if(typeof TITLES!=='undefined')TITLES.leads=['Leads','Filtre, selecione, salve como público ou crie campanha.'];
    if(typeof MINIMAL_TITLES!=='undefined')MINIMAL_TITLES.leads='Leads';
    /* Garante item no menu */
    if(!userCfg.nav.find(function(n){return n.id==='leads';})){
      var idx=userCfg.nav.findIndex(function(n){return n.id==='central';});
      var pos=idx>=0?idx+1:userCfg.nav.length;
      userCfg.nav.splice(pos,0,{id:'leads',ico:'◇',label:'Leads',visible:true});
      try{if(typeof saveConfig==='function')saveConfig();}catch(e){}
    }
    /* Só 3 menus visíveis: Central, Fila, Disparos — agora também Leads */
    var keep={central:1,fila:1,disparos:1,leads:1};
    userCfg.nav.forEach(function(n){ n.visible = !!keep[n.id]; });
    try{if(typeof saveConfig==='function')saveConfig();}catch(e){}
    if(typeof renderSidebar==='function')setTimeout(renderSidebar,60);
    if(typeof render==='function')setTimeout(render,80);
  }
  aplicar();

  /* Handlers */
  document.addEventListener('click',function(ev){
    var el;
    if(ev.target.closest('[data-leads-sel-all]')){ev.preventDefault();ev.stopPropagation();selAll();return;}
    if(ev.target.closest('[data-leads-sel-wa]')){ev.preventDefault();ev.stopPropagation();selWA();return;}
    if(ev.target.closest('[data-leads-clear]')){ev.preventDefault();ev.stopPropagation();clearSel();return;}
    if(ev.target.closest('[data-leads-criar-lista]')){ev.preventDefault();ev.stopPropagation();salvarComoLista();return;}
    if(ev.target.closest('[data-leads-add-camp]')){ev.preventDefault();ev.stopPropagation();addCampanha();return;}
    if(ev.target.closest('[data-leads-nova-camp]')){ev.preventDefault();ev.stopPropagation();novaCampanhaComSel();return;}
    if(ev.target.closest('[data-leads-criar-mensagem]')){ev.preventDefault();ev.stopPropagation();gerarMensagem();return;}
    el=ev.target.closest('[data-leads-lista-camp]');
    if(el){ev.preventDefault();ev.stopPropagation();criarCampanhaDLista(el.getAttribute('data-leads-lista-camp'));return;}
    el=ev.target.closest('[data-leads-del-lista]');
    if(el){ev.preventDefault();ev.stopPropagation();delLista(el.getAttribute('data-leads-del-lista'));return;}
    el=ev.target.closest('[data-leads-toggle]');
    if(el&&state.view==='leads'){
      ev.preventDefault();ev.stopPropagation();
      var id=el.getAttribute('data-leads-toggle');
      state.leadsSel[id]=!state.leadsSel[id];
      if(typeof render==='function')render();
      return;
    }
  },true);
})();
