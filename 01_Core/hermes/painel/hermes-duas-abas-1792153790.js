(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function num(v){return (typeof fmtNum==='function')?fmtNum(v):String(v);}

  /* ============ VIEW: FILA ============ */
  function viewFila(){
    if(typeof filteredActions!=='function'||typeof filaContagem!=='function')return '<div class="empty">A fila ainda não está pronta.</div>';
    var c=filaContagem();
    var grupos=filaAgrupada();
    var total=FILA_GRUPOS.reduce(function(n,g){return n+(c[g.id]||0);},0);
    var sel=state.filaFiltro||'tudo';
    var JA=['atrasadas','erro','bloqueadas'];
    var visiveis=FILA_GRUPOS.filter(function(g){return sel==='tudo'?!JA.includes(g.id):sel===g.id;});
    var pills='<div class="fila-filters" role="group" style="margin-bottom:14px">'+
      '<button class="pill '+(sel==='tudo'?'is-active':'tom-accent')+'" data-fila-filtro="tudo" aria-pressed="'+(sel==='tudo')+'">Tudo <b>'+total+'</b></button>'+
      FILA_GRUPOS.map(function(g){return '<button class="pill tom-'+g.tom+' '+(sel===g.id?'is-active':'')+' '+(c[g.id]?'':'is-zero')+'" data-fila-filtro="'+g.id+'"><span class="dot"></span>'+esc(g.label)+' <b>'+(c[g.id]||0)+'</b></button>';}).join('')+
      '</div>';
    var blocos=visiveis.filter(function(g){return grupos[g.id].length;}).map(function(g){
      var lista=grupos[g.id],lim=sel===g.id?200:10;
      return '<div class="op-sec"><div class="op-head"><h2>'+esc(g.label)+'</h2><span class="sub">'+lista.length+'</span></div>'+
        '<div class="op-list">'+lista.slice(0,lim).map(function(a){return opActionRowHTML(a);}).join('')+
        (lista.length>lim?'<div class="op-empty"><button class="btn sm ghost" data-fila-filtro="'+g.id+'">+ '+(lista.length-lim)+' nesta situação</button></div>':'')+
        '</div></div>';
    }).join('');
    var acima=JA.reduce(function(n,id){return n+(c[id]||0);},0);
    return '<div class="op-kpis">'+
      '<button class="op-kpi is-ok"><b>'+total+'</b><span>Total na fila</span></button>'+
      '<button class="op-kpi'+(c.atrasadas?' is-urgent':'')+'"><b>'+(c.atrasadas||0)+'</b><span>Atrasadas</span></button>'+
      '<button class="op-kpi'+(c.erro?' is-urgent':'')+'"><b>'+(c.erro||0)+'</b><span>Com erro</span></button>'+
      '<button class="op-kpi'+(c.bloqueadas?' is-warn':'')+'"><b>'+(c.bloqueadas||0)+'</b><span>Bloqueadas</span></button>'+
      '<button class="op-kpi"><b>'+(c.agendadas||0)+'</b><span>Agendadas</span></button>'+
      '</div>'+
      pills+
      (sel==='tudo'&&acima?'<div class="sub" style="margin-bottom:10px">'+acima+' item(ns) atrasado(s), com erro ou bloqueado(s) estão em <b>Fila · Precisa de você</b> (aba Operação). Clique na pílula acima para isolar aqui.</div>':'')+
      (blocos||'<div class="op-list"><div class="op-empty">Nada nesta seleção.</div></div>')+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px">'+
      '<button class="btn primary sm" data-new-action="global">＋ Nova ação</button>'+
      '<button class="btn sm" data-avulso>Envio avulso · agora</button>'+
      '<button class="btn sm ghost" data-goto-view="execucao">Abrir Operação</button>'+
      '</div>';
  }

  /* ============ VIEW: GERENCIAR DISPAROS ============ */
  function viewDisparos(){
    var cs=(state.campaigns||[]).filter(function(c){return !c.sugestao;});
    var waOK=(typeof waPronto==='function')?waPronto():false;
    var totalPend=cs.reduce(function(n,c){return n+((typeof campPendentes==='function')?campPendentes(c):0);},0);
    var totalEnv=cs.reduce(function(n,c){return n+((typeof campEnviados==='function')?campEnviados(c):0);},0);
    var totalErro=cs.reduce(function(n,c){return n+((typeof campFalhas==='function')?campFalhas(c):0);},0);

    var cards=cs.map(function(c){
      var pend=(typeof campPendentes==='function')?campPendentes(c):0;
      var env=(typeof campEnviados==='function')?campEnviados(c):0;
      var err=(typeof campFalhas==='function')?campFalhas(c):0;
      var teto=c.volume_dia||30;
      var quando=c.agendada_em?fmtWhen(c.agendada_em):'sem data';
      var tone=c.status==='EM EXECUÇÃO'?'ok':c.status==='PAUSADA'?'warn':c.status==='ENCERRADA'?'':'info';
      var cad=c.cadencia||'—';
      return '<div class="card left-'+tone+'" style="padding:14px">'+
        '<div class="card-head"><div><h3 style="margin:0">'+esc(c.nome)+'</h3><p>'+esc(c.objetivo||'')+'</p></div>'+
          (typeof C!=='undefined'&&C.badge?C.badge(c.status,tone):'')+
        '</div>'+
        '<div class="kv-mini" style="gap:14px;flex-wrap:wrap;margin-bottom:10px">'+
          '<span>Enviados <b>'+env+'</b></span>'+
          '<span>Pendentes <b>'+pend+'</b></span>'+
          (err?'<span style="color:var(--urgent)">Erros <b>'+err+'</b></span>':'')+
          '<span>Canal <b>'+esc((c.canais||[]).join(', ')||'—')+'</b></span>'+
          '<span>Cadência <b>'+esc(cad)+'</b></span>'+
          '<span>Teto/dia <b>'+teto+'</b></span>'+
          '<span>Agenda <b>'+esc(quando)+'</b></span>'+
        '</div>'+
        '<div class="kv-mini" style="gap:14px;flex-wrap:wrap;margin-bottom:12px;color:var(--muted2)">'+
          '<span>Limite WhatsApp <b>10/dia</b></span>'+
          '<span>Limite LinkedIn <b>10/dia</b></span>'+
          '<span>Limite E-mail <b>20/dia</b></span>'+
        '</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
          (pend?'<button class="btn primary sm" data-camp-run="'+esc(c.id)+'">Disparar '+pend+' pendente(s)</button>':'<button class="btn sm" disabled>Sem pendentes</button>')+
          (c.status==='PAUSADA'
            ?'<button class="btn success sm" data-camp-resume="'+esc(c.id)+'">▶ Retomar</button>'
            :(c.status==='ENCERRADA'
              ?'<button class="btn sm" data-camp-reopen="'+esc(c.id)+'">↺ Reabrir</button>'
              :'<button class="btn sm warn" data-camp-pause="'+esc(c.id)+'">❚❚ Pausar</button>'))+
          '<button class="btn sm" data-camp-reschedule="'+esc(c.id)+'">📅 Reagendar</button>'+
          '<button class="btn sm ghost" data-camp-clear-sched="'+esc(c.id)+'">remover agenda</button>'+
          '<button class="btn sm ghost" data-open-campaign="'+esc(c.id)+'">Ver detalhes</button>'+
        '</div>'+
        (!waOK&&(c.canais||[]).indexOf('WhatsApp')>=0?'<div class="sub" style="margin-top:10px;color:var(--warn)">WhatsApp sem integração — os envios vão falhar até configurar Baileys em Ajustes › Integrações.</div>':'')+
      '</div>';
    }).join('');

    return '<div class="op-kpis">'+
      '<button class="op-kpi"><b>'+cs.length+'</b><span>Campanhas</span></button>'+
      '<button class="op-kpi is-ok"><b>'+totalEnv+'</b><span>Enviados</span></button>'+
      '<button class="op-kpi'+(totalPend?' is-warn':'')+'"><b>'+totalPend+'</b><span>Pendentes</span></button>'+
      '<button class="op-kpi'+(totalErro?' is-urgent':'')+'"><b>'+totalErro+'</b><span>Falhas</span></button>'+
      '<button class="op-kpi'+(waOK?' is-ok':' is-warn')+'"><b>'+(waOK?'OK':'—')+'</b><span>WhatsApp</span></button>'+
      '</div>'+

      '<div class="op-bar">'+
        '<button class="btn primary sm" data-new-campaign>＋ Nova campanha</button>'+
        '<button class="btn sm" data-avulso>Envio avulso · agora</button>'+
        '<button class="btn sm ghost" data-goto-view="automacoes">Ver automações</button>'+
        '<span class="sp"></span>'+
        '<span class="sub" style="font-size:11px">'+cs.length+' campanha(s) · '+totalPend+' pendente(s)</span>'+
      '</div>'+

      '<div class="op-sec"><div class="op-head"><h2>Limites e cadência</h2><span class="sub">Por campanha</span></div>'+
        '<div class="card" style="padding:14px">'+
          '<div class="sub" style="line-height:1.7">'+
            '<b style="color:var(--txt)">Limite por canal:</b> WhatsApp 10/dia · LinkedIn 10/dia · E-mail 20/dia (valor padrão do painel).<br>'+
            '<b style="color:var(--txt)">Teto por campanha:</b> definido no campo <em>Teto/dia</em> de cada campanha.<br>'+
            '<b style="color:var(--txt)">Cadência:</b> definida na campanha, formato <em>D0, D3, D7, D14</em>.<br>'+
            '<b style="color:var(--txt)">Janela de envio:</b> WhatsApp 09h–18h · LinkedIn 09h–18h · E-mail 08h–18h.<br>'+
            '<b style="color:var(--warn)">Atenção:</b> o painel respeita o teto por campanha. Limite por canal e janela estão cadastrados mas <em>ainda não são aplicados automaticamente</em> no disparo.'+
          '</div>'+
        '</div>'+
      '</div>'+

      '<div class="op-sec"><div class="op-head"><h2>Campanhas</h2><span class="sub">Clique para configurar ou disparar</span></div>'+
        (cards||'<div class="op-list"><div class="op-empty">Nenhuma campanha criada ainda.</div></div>')+
      '</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px">'+
        '<button class="btn sm" data-goto-view="execucao">Abrir Operação</button>'+
        '<button class="btn sm" data-goto-view="campanhas">Modo campanhas (tabela)</button>'+
      '</div>';
  }

  /* ============ INJETAR NAS VIEWS E NO MENU ============ */
  function injetar(){
    if(typeof VIEWS==='undefined'||typeof userCfg==='undefined'){setTimeout(injetar,250);return;}
    if(window.__duasAbas)return;
    window.__duasAbas=true;

    VIEWS.fila=viewFila;
    VIEWS.disparos=viewDisparos;

    /* Reutiliza a busca de títulos do painel */
    if(typeof TITLES!=='undefined'){
      TITLES.fila=['Fila','A fila operacional: cada ação é um contato × canal × etapa.'];
      TITLES.disparos=['Gerenciar disparos','Campanhas, limites por canal, cadência e agendamento.'];
    }
    if(typeof MINIMAL_TITLES!=='undefined'){
      MINIMAL_TITLES.fila='Fila';
      MINIMAL_TITLES.disparos='Disparos';
    }

    /* Menu: Fila e Disparos logo depois de Operação */
    var temFila=userCfg.nav.find(function(n){return n.id==='fila';});
    var temDisp=userCfg.nav.find(function(n){return n.id==='disparos';});
    if(!temFila){
      var idx=userCfg.nav.findIndex(function(n){return n.id==='execucao';});
      var pos=idx>=0?idx+1:userCfg.nav.length;
      userCfg.nav.splice(pos,0,{id:'fila',ico:'▤',label:'Fila',visible:true});
    }
    if(!temDisp){
      var idx2=userCfg.nav.findIndex(function(n){return n.id==='fila';});
      var pos2=idx2>=0?idx2+1:userCfg.nav.length;
      userCfg.nav.splice(pos2,0,{id:'disparos',ico:'⚡',label:'Disparos',visible:true});
    }
    try{ if(typeof saveConfig==='function')saveConfig(); }catch(e){}
    if(typeof renderSidebar==='function') setTimeout(renderSidebar,50);
    if(typeof renderTopbar==='function') setTimeout(renderTopbar,50);
    if(typeof render==='function') setTimeout(render,80);
  }
  injetar();
})();
