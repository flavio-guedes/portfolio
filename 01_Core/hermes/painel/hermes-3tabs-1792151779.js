(function(){
  function go(){
    if(typeof VIEWS==='undefined'||typeof state==='undefined'||typeof userCfg==='undefined'){setTimeout(go,250);return;}
    if(window.__threeTabs)return;
    window.__threeTabs=true;

    var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
    var B=function(t,tone){return typeof C!=='undefined'&&C.badge?C.badge(t,tone):'<span class="badge '+(tone||'')+'">'+E(t)+'</span>';};
    var P=function(pct,tone){return '<div class="progress"><i class="'+(tone||'')+'" style="width:'+Math.min(100,Math.max(0,pct))+'%"></i></div>';};
    var K=function(k,n,d,cls){return '<div class="kpi '+(cls||'')+'"><div class="k">'+E(k)+'</div><div class="n">'+n+'</div><div class="d">'+E(d||'')+'</div></div>';};
    var F=function(ts){return typeof fmtWhen==='function'?fmtWhen(ts):String(ts||'');};
    var N=function(v){return typeof fmtNum==='function'?fmtNum(v):String(v);};
    var DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];

    function diaKey(d){var x=new Date(d);x.setHours(0,0,0,0);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');}

    /* -------- NAV -------- */
    var keep={central:1,execucao:1,oportunidades:1};
    userCfg.nav.forEach(function(n){n.visible=!!keep[n.id];});
    userCfg.nav.forEach(function(n){
      if(n.id==='central')n.label='Central';
      if(n.id==='execucao')n.label='Fila';
      if(n.id==='oportunidades')n.label='Gerenciar';
    });
    userCfg.modes.forEach(function(m){m.visible=false;});
    userCfg.mode='explore';
    try{saveConfig();}catch(e){}

    /* -------- CENTRAL -------- */
    VIEWS.central=function(){
      var all=state.opportunities||[];
      var hoje=new Date();
      var diasDesde=function(iso){if(!iso)return 9999;return (hoje-new Date(iso))/86400000;};
      var semToque=function(d){return all.filter(function(o){if(o.estagio==='Fechado'||o.estagio==='Perdido')return false;return diasDesde(o.ultima_interacao)>d;});};
      var sem7=semToque(7),sem15=semToque(15),sem30=semToque(30);

      var porEtapa={Descoberta:0,'Qualificacao':0,Conversa:0,Proposta:0,Fechado:0,Perdido:0};
      var alias={Descoberta:'Descoberta','Qualificação':'Qualificacao','Conversa':'Conversa','Proposta':'Proposta','Fechado':'Fechado','Perdido':'Perdido'};
      all.forEach(function(o){var k=alias[o.estagio];if(k&&porEtapa[k]!==undefined)porEtapa[k]++;});
      var maxEt=1;Object.keys(porEtapa).forEach(function(k){if(porEtapa[k]>maxEt)maxEt=porEtapa[k];});

      var quentes=all.filter(function(o){return o.temperatura==='Quente'||o.temperatura==='Muito quente';}).length;
      var abertos=all.filter(function(o){return o.estagio!=='Fechado'&&o.estagio!=='Perdido';}).length;

      var enviados=0,respondidos=0;
      (state.campaigns||[]).forEach(function(c){if(c.metricas){enviados+=c.metricas.enviados||0;respondidos+=c.metricas.respondidos||0;}});
      var txResp=enviados?Math.round(respondidos/enviados*100):0;
      var comCampanha=all.filter(function(o){return o.campaign_id;}).length;
      var cobertura=all.length?Math.round(comCampanha/all.length*100):0;

      var h='';
      h+='<div class="grid g4" style="margin-bottom:14px">';
      h+=K('Leads na base',N(all.length),'total','accent');
      h+=K('Abertos',N(abertos),'em pipeline','info');
      h+=K('Quentes',N(quentes),'alta prioridade','alert');
      h+=K('Sem toque 7d+',N(sem7.length),'pede atenção',sem7.length>100?'risk':'warn');
      h+='</div>';

      h+='<div class="card" style="margin-bottom:14px">';
      h+='<div class="card-head"><h3>Leads por etapa</h3><span class="sub">'+N(all.length)+' total</span></div>';
      h+='<div class="bars">';
      Object.keys(porEtapa).forEach(function(k){
        var lbl=k==='Qualificacao'?'Qualificação':k;
        h+='<div class="bar-line"><span>'+E(lbl)+'</span>'+P(porEtapa[k]/maxEt*100,'info')+'<b>'+N(porEtapa[k])+'</b></div>';
      });
      h+='</div></div>';

      h+='<div class="grid g3" style="margin-bottom:14px">';
      h+='<div class="card" style="text-align:center;padding:14px"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Sem toque 7d+</div><div style="font:500 28px/1 var(--font-display);color:var(--warn);margin:8px 0">'+N(sem7.length)+'</div></div>';
      h+='<div class="card" style="text-align:center;padding:14px"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Sem toque 15d+</div><div style="font:500 28px/1 var(--font-display);color:var(--risk);margin:8px 0">'+N(sem15.length)+'</div></div>';
      h+='<div class="card" style="text-align:center;padding:14px"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Sem toque 30d+</div><div style="font:500 28px/1 var(--font-display);color:var(--urgent);margin:8px 0">'+N(sem30.length)+'</div></div>';
      h+='</div>';

      var parados=sem15.slice().sort(function(a,b){return (b.score||0)-(a.score||0);}).slice(0,12);
      h+='<div class="card" style="margin-bottom:14px"><div class="card-head"><h3>Leads parados (15d+ sem toque)</h3><span class="sub">'+N(sem15.length)+' no total</span></div>';
      if(parados.length){
        parados.forEach(function(o){
          h+='<div class="kv" style="cursor:pointer" data-open="'+E(o.id)+'">';
          h+='<span style="text-align:left;color:var(--txt);min-width:0"><b>'+E(o.empresa||o.contato)+'</b>';
          h+='<br><span class="sub">'+E(o.segmento||'')+' · '+E(o.estagio||'')+' · ultimo: '+(o.ultima_interacao?F(o.ultima_interacao):'nunca')+'</span></span>';
          h+='<b style="white-space:nowrap">'+B(o.grupo||'?','gold')+' '+B('score '+(o.score||0),'')+'</b>';
          h+='</div>';
        });
      } else h+='<div class="empty">Ninguem parado.</div>';
      h+='</div>';

      h+='<div class="grid g3" style="margin-bottom:14px">';
      h+=K('Taxa de resposta',txResp+'%',respondidos+' / '+enviados,txResp>10?'ok':'warn');
      h+=K('Cobertura',cobertura+'%',comCampanha+' em campanha',cobertura>50?'ok':'warn');
      h+=K('Conversas',N(porEtapa.Conversa||0),'em negociacao ativa','ai');
      h+='</div>';
      return h;
    };

    /* -------- FILA -------- */
    function renderBloco(k,acts){
      var partes=k.split('-');
      var d=new Date(+partes[0],+partes[1]-1,+partes[2]);
      var hoje=new Date();hoje.setHours(0,0,0,0);
      var delta=Math.round((d-hoje)/86400000);
      var label=delta===0?'Hoje':delta===1?'Amanha':delta===-1?'Ontem':(delta<0?Math.abs(delta)+'d atras':'Em '+delta+'d · '+DIAS[d.getDay()]);
      var cor=delta===0?'var(--accent)':delta<0?'var(--muted)':'var(--info)';
      var cnt={};acts.forEach(function(a){cnt[a.status]=(cnt[a.status]||0)+1;});
      var resumo=Object.keys(cnt).map(function(s){return cnt[s]+' '+s.toLowerCase();}).join(' · ');
      var h='<div style="margin-bottom:10px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;flex-wrap:wrap;gap:8px">';
      h+='<span style="font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:9.5px;color:'+cor+'">'+label+'</span>';
      h+='<span class="sub" style="font-size:10.5px">'+acts.length+' · '+resumo+'</span>';
      h+='</div>';
      h+='<div style="display:flex;flex-direction:column;gap:1px">';
      acts.slice(0,8).forEach(function(a){
        var o=(typeof oppOf==='function')?oppOf(a.opportunity_id):null;
        var nome=o?(o.empresa||o.contato):(a.contato||'—');
        var tone=a.status==='ENVIADO'?'ok':a.status==='ERRO'?'urgent':a.status==='BLOQUEADO'?'warn':(a.status==='PRONTO'||a.status==='AGENDADO')?'info':'';
        h+='<div style="display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;padding:4px 8px;border-radius:4px;font-size:11.5px;cursor:pointer;align-items:center" data-open="'+E(a.opportunity_id||'')+'">';
        h+='<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--txt)">'+E(nome)+'</span>';
        h+='<span class="sub" style="font-size:10.5px">'+E(a.canal||'')+'</span>';
        h+='<span class="badge '+tone+'" style="font-size:9.5px;padding:2px 6px">'+E(a.status)+'</span>';
        h+='</div>';
      });
      if(acts.length>8)h+='<div class="sub" style="font-size:10.5px;padding:4px 8px">+ '+(acts.length-8)+' alem</div>';
      h+='</div></div>';
      return h;
    }

    VIEWS.execucao=function(){
      var campaigns=(state.campaigns||[]).filter(function(c){return !c.sugestao;});
      var all=state.actions||[];
      var rodando=campaigns.filter(function(c){return c.status==='EM EXECUCAO'||c.status==='EM EXECUÇÃO';}).length;
      var pausadas=campaigns.filter(function(c){return c.status==='PAUSADA';}).length;
      var erros=all.filter(function(a){return a.status==='ERRO';}).length;
      var hojeK=diaKey(new Date());
      var agendHoje=all.filter(function(a){if(!a.prazo)return false;return diaKey(a.prazo)===hojeK&&(a.status==='AGENDADO'||a.status==='PRONTO');}).length;

      var h='';
      h+='<div style="margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap;padding:14px 18px;border:1px solid var(--line);border-radius:12px;background:linear-gradient(160deg,rgba(224,184,120,.06),rgba(255,255,255,.01))">';
      h+='<div style="display:flex;align-items:center;gap:8px"><span style="width:9px;height:9px;background:var(--ok);box-shadow:0 0 0 4px rgba(74,222,128,.2);border-radius:50%"></span><b style="font-size:12px;letter-spacing:.08em">FILA ATIVA</b></div>';
      h+='<div style="display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:var(--muted)">';
      h+='<span><b style="color:var(--ok);font:500 16px/1 var(--font-display)">'+rodando+'</b> rodando</span>';
      h+='<span><b style="color:var(--warn);font:500 16px/1 var(--font-display)">'+pausadas+'</b> pausadas</span>';
      h+='<span><b style="color:'+(erros?'var(--urgent)':'var(--muted)')+';font:500 16px/1 var(--font-display)">'+erros+'</b> erro'+(erros!==1?'s':'')+'</span>';
      h+='<span><b style="color:var(--info);font:500 16px/1 var(--font-display)">'+agendHoje+'</b> agendadas hoje</span>';
      h+='</div></div>';

      if(!campaigns.length){
        h+='<div class="empty" style="padding:60px 20px;text-align:center;border:1px dashed var(--line);border-radius:12px">Nenhuma campanha criada ainda.<br><br>Va em <b>Gerenciar</b> para criar a primeira.</div>';
        return h;
      }

      campaigns.forEach(function(c){
        var acts=all.filter(function(a){return a.campaign_id===c.id;});
        var porDia={};
        acts.forEach(function(a){var d=a.enviado_em||a.prazo;if(!d)return;var k=diaKey(d);if(!porDia[k])porDia[k]=[];porDia[k].push(a);});

        var hojeK2=diaKey(new Date());
        var statusTone=c.status==='EM EXECUCAO'||c.status==='EM EXECUÇÃO'?'ok':c.status==='PAUSADA'?'warn':'';
        var statusColor=statusTone==='ok'?'var(--ok)':statusTone==='warn'?'var(--warn)':'var(--muted)';

        h+='<details style="margin-bottom:8px;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden">';
        h+='<summary style="cursor:pointer;padding:12px 16px;display:flex;align-items:center;gap:10px;list-style:none">';
        h+='<span style="width:8px;height:8px;background:'+statusColor+';border-radius:50%;flex-shrink:0"></span>';
        h+='<b style="flex:1;min-width:0;font-size:13.5px">'+E(c.nome)+'</b>';
        h+='<span class="sub" style="font-size:11.5px">'+E(c.status)+' · '+acts.length+' acoes</span>';
        h+='</summary>';
        h+='<div style="padding:12px 16px;border-top:1px solid var(--line);background:rgba(255,255,255,.01)">';
        h+='<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">';
        if(c.status==='EM EXECUCAO'||c.status==='EM EXECUÇÃO')h+='<button class="btn sm warn" data-camp-pause="'+E(c.id)+'">Pausar</button>';
        else if(c.status==='PAUSADA')h+='<button class="btn sm success" data-camp-resume="'+E(c.id)+'">Retomar</button>';
        h+='<button class="btn sm" data-camp-run="'+E(c.id)+'">Disparar pendentes</button>';
        h+='<button class="btn sm ghost" data-camp-edit="'+E(c.id)+'">Editar</button>';
        h+='<button class="btn sm ghost" data-camp-reschedule="'+E(c.id)+'">Reagendar</button>';
        h+='</div>';

        var chaves=Object.keys(porDia).sort();
        var passadas=chaves.filter(function(k){return k<=hojeK2;}).slice(-4);
        var proximas=chaves.filter(function(k){return k>hojeK2;}).slice(0,5);

        if(passadas.length){
          h+='<div class="sub" style="font-size:9.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted2);margin-bottom:6px">Historico</div>';
          passadas.forEach(function(k){h+=renderBloco(k,porDia[k]);});
        }
        if(proximas.length){
          h+='<div class="sub" style="font-size:9.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted2);margin:14px 0 6px">Programado</div>';
          proximas.forEach(function(k){h+=renderBloco(k,porDia[k]);});
        }
        if(!chaves.length)h+='<div class="sub">Sem acoes agendadas.</div>';

        h+='</div></details>';
      });
      return h;
    };

    /* -------- GERENCIAR -------- */
    VIEWS.oportunidades=function(){
      var campaigns=(state.campaigns||[]).filter(function(c){return !c.sugestao;});
      var h='';
      h+='<div class="card left-accent" style="padding:18px;margin-bottom:16px">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">';
      h+='<div><div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:4px">Criar</div>';
      h+='<h2 style="margin:0 0 4px;font:500 18px/1.2 var(--font-display)">Nova campanha de disparo</h2>';
      h+='<div class="sub" style="font-size:12px">Escolha base, canal, cadencia e agende. Os leads entram na fila automaticamente.</div></div>';
      h+='<button class="btn primary" data-new-campaign style="white-space:nowrap">+ Nova campanha</button>';
      h+='</div></div>';

      h+='<div class="section-head"><div><h2>Campanhas</h2><p>'+campaigns.length+' no total</p></div></div>';

      if(!campaigns.length){
        h+='<div class="empty" style="padding:60px 20px;text-align:center;border:1px dashed var(--line);border-radius:12px">Nenhuma campanha criada ainda.<br><br>Comece pela <b>Nova campanha</b> acima.</div>';
        return h;
      }

      campaigns.forEach(function(c){
        var acts=(state.actions||[]).filter(function(a){return a.campaign_id===c.id;});
        var env=acts.filter(function(a){return a.status==='ENVIADO';}).length;
        var pend=acts.filter(function(a){return a.status==='AGENDADO'||a.status==='PRONTO';}).length;
        var err=acts.filter(function(a){return a.status==='ERRO';}).length;
        var bloq=acts.filter(function(a){return a.status==='BLOQUEADO';}).length;
        var statusTone=c.status==='EM EXECUCAO'||c.status==='EM EXECUÇÃO'?'ok':c.status==='PAUSADA'?'warn':'';

        h+='<details style="margin-bottom:8px;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden">';
        h+='<summary style="cursor:pointer;padding:14px 16px;display:flex;align-items:center;gap:12px;list-style:none;flex-wrap:wrap">';
        h+='<span class="dot '+statusTone+'" style="flex-shrink:0"></span>';
        h+='<div style="flex:1;min-width:180px">';
        h+='<b style="font-size:13.5px;display:block">'+E(c.nome)+'</b>';
        h+='<span class="sub" style="font-size:11.5px">'+E(c.objetivo||'')+'</span>';
        h+='</div>';
        h+='<div style="display:flex;gap:6px;flex-wrap:wrap">';
        (c.canais||[]).forEach(function(ch){h+='<span class="chip-s">'+E(ch)+'</span>';});
        h+='<span class="chip-s">'+E(c.status)+'</span>';
        if(c.volume_dia)h+='<span class="chip-s">'+c.volume_dia+'/dia</span>';
        h+='</div>';
        h+='<span class="sub" style="font-size:11px;white-space:nowrap">'+env+' env · '+pend+' pend'+(err?' · '+err+' err':'')+'</span>';
        h+='</summary>';
        h+='<div style="padding:14px 16px;border-top:1px solid var(--line)">';
        h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">';
        h+='<div style="text-align:center;padding:10px;background:rgba(74,222,128,.06);border-radius:8px;border:1px solid var(--ok-bd)"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Enviados</div><div style="font:500 20px/1 var(--font-display);color:var(--ok);margin-top:4px">'+env+'</div></div>';
        h+='<div style="text-align:center;padding:10px;background:rgba(96,165,250,.06);border-radius:8px;border:1px solid var(--info-bd)"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Pendentes</div><div style="font:500 20px/1 var(--font-display);color:var(--info);margin-top:4px">'+pend+'</div></div>';
        h+='<div style="text-align:center;padding:10px;background:rgba(255,91,91,.06);border-radius:8px;border:1px solid var(--urgent-bd)"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Erros</div><div style="font:500 20px/1 var(--font-display);color:var(--urgent);margin-top:4px">'+err+'</div></div>';
        h+='<div style="text-align:center;padding:10px;background:rgba(251,191,36,.06);border-radius:8px;border:1px solid var(--warn-bd)"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Bloqueios</div><div style="font:500 20px/1 var(--font-display);color:var(--warn);margin-top:4px">'+bloq+'</div></div>';
        h+='</div>';
        h+='<div style="display:flex;gap:6px;flex-wrap:wrap">';
        if(c.status==='EM EXECUCAO'||c.status==='EM EXECUÇÃO')h+='<button class="btn sm warn" data-camp-pause="'+E(c.id)+'">Pausar</button>';
        else if(c.status==='PAUSADA')h+='<button class="btn sm success" data-camp-resume="'+E(c.id)+'">Retomar</button>';
        h+='<button class="btn sm" data-camp-run="'+E(c.id)+'">Disparar pendentes</button>';
        h+='<button class="btn sm" data-camp-edit="'+E(c.id)+'">Editar</button>';
        h+='<button class="btn sm ghost" data-camp-reschedule="'+E(c.id)+'">Reagendar</button>';
        h+='<button class="btn sm danger" data-camp-del="'+E(c.id)+'">Excluir</button>';
        h+='</div></div></details>';
      });
      return h;
    };

    ['campanhas','acoes','projetos','ativos','inteligencia','conversas','resultados','automacoes','agentes','dados'].forEach(function(id){VIEWS[id]=VIEWS.execucao;});

    if(typeof TITLES!=='undefined'){
      TITLES.central=['Central','Metricas da operacao e leads que precisam de atencao.'];
      TITLES.execucao=['Fila','O que esta rodando, agendado e programado por campanha.'];
      TITLES.oportunidades=['Gerenciar disparos','Criar e editar campanhas de prospeccao.'];
    }

    var st=document.createElement('style');
    st.textContent='.sidebar .nav-sep{display:none!important}.sidebar [data-toggle-section="workspace"],.sidebar [data-toggle-section="modo"],.sidebar [data-toggle-section="filtros"]{display:none!important}.sidebar [data-section="modo"],.sidebar [data-section="filtros"]{display:none!important}.sidebar .nav-group-label{display:none!important}.sidebar .nav-group{margin-bottom:0!important;gap:0!important}details>summary::-webkit-details-marker{display:none}';
    document.head.appendChild(st);

    if(typeof renderSidebar==='function')renderSidebar();
    if(typeof render==='function')render();
  }
  setTimeout(go,700);
})();
