(function(){
  /* Distingue as duas abas:
     FILA     → o que está em andamento (monitor ao vivo)
     DISPAROS → criação e edição de campanhas/filas (painel de controle) */

  function patchTitulos(){
    if(typeof TITLES!=='undefined'){
      TITLES.fila=['Fila','O que está em andamento agora — ações vivas, executando ou aguardando.'];
      TITLES.disparos=['Gerenciar Disparos','Crie, edite e configure campanhas e filas. Aqui se define antes de disparar.'];
    }
    if(typeof MINIMAL_TITLES!=='undefined'){
      MINIMAL_TITLES.fila='Fila';
      MINIMAL_TITLES.disparos='Gerenciar Disparos';
    }
    if(typeof userCfg!=='undefined'&&userCfg.nav){
      var mudou=false;
      userCfg.nav.forEach(function(n){
        if(n.id==='disparos'&&n.label!=='Gerenciar Disparos'){n.label='Gerenciar Disparos';mudou=true;}
        if(n.id==='fila'&&n.label!=='Fila'){n.label='Fila';mudou=true;}
      });
      if(mudou){try{saveConfig();}catch(e){}}
    }
  }

  function avisoFila(){
    return '<div class="card left-info" style="padding:14px 16px;margin-bottom:14px;background:linear-gradient(160deg,rgba(96,165,250,.06),rgba(255,255,255,.01))">'+
      '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">'+
        '<div style="flex:1;min-width:200px">'+
          '<div class="eyebrow" style="color:var(--info);margin-bottom:4px">Monitor ao vivo</div>'+
          '<div style="font-family:var(--font-display);font-size:17px;font-weight:700;margin-bottom:4px">Fila · o que está em andamento</div>'+
          '<div class="sub" style="font-size:12px;line-height:1.6">'+
            'Tudo que está <b>executando</b>, <b>agendado</b>, <b>bloqueado</b> ou <b>com erro</b> aparece aqui. Ações são criadas e configuradas em <b>Gerenciar Disparos</b>.'+
            ' Daqui você só <em>acompanha e destrava</em>.'+
          '</div>'+
        '</div>'+
        '<button class="btn sm" data-goto-view="disparos" style="flex-shrink:0">→ Ir para Gerenciar Disparos</button>'+
      '</div>'+
    '</div>';
  }

  function avisoDisparos(){
    return '<div class="card left-accent" style="padding:14px 16px;margin-bottom:14px;background:linear-gradient(160deg,rgba(224,184,120,.06),rgba(255,255,255,.01))">'+
      '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">'+
        '<div style="flex:1;min-width:200px">'+
          '<div class="eyebrow" style="color:var(--accent);margin-bottom:4px">Painel de controle</div>'+
          '<div style="font-family:var(--font-display);font-size:17px;font-weight:700;margin-bottom:4px">Gerenciar Disparos · aqui você configura</div>'+
          '<div class="sub" style="font-size:12px;line-height:1.6">'+
            'Cria campanhas, define <b>público</b>, <b>oferta</b>, <b>cadência</b>, <b>teto por dia</b>, <b>agenda</b> e <b>mensagens</b>. Depois de criar, as ações vão para a <b>Fila</b> — aqui é onde se decide <em>o que</em> e <em>para quem</em> disparar.'+
          '</div>'+
        '</div>'+
        '<button class="btn sm" data-goto-view="fila" style="flex-shrink:0">→ Ver Fila em andamento</button>'+
      '</div>'+
    '</div>';
  }

  function injetar(){
    if(typeof state==='undefined')return;
    var c=document.getElementById('content');if(!c)return;
    var alvo=c.querySelector('section.view');if(!alvo)return;
    if(state.view==='fila'){
      if(!alvo.querySelector('[data-papel-fila]')){
        var t=document.createElement('div');
        t.innerHTML=avisoFila();
        var el=t.firstChild;el.setAttribute('data-papel-fila','1');
        alvo.insertBefore(el,alvo.firstChild);
      }
    }
    if(state.view==='disparos'){
      if(!alvo.querySelector('[data-papel-disp]')){
        var t2=document.createElement('div');
        t2.innerHTML=avisoDisparos();
        var el2=t2.firstChild;el2.setAttribute('data-papel-disp','1');
        alvo.insertBefore(el2,alvo.firstChild);
      }
    }
  }

  function iniciar(){
    patchTitulos();
    if(typeof renderSidebar==='function')setTimeout(renderSidebar,80);
    if(typeof renderTopbar==='function')setTimeout(renderTopbar,80);
    setInterval(injetar,500);
    injetar();
  }
  iniciar();
})();
