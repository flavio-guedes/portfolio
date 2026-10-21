(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function num(v){return (typeof fmtNum==='function')?fmtNum(v):String(v);}
  function bd(t,tone){return '<span class="badge '+(tone||'')+'">'+esc(t)+'</span>';}
  function hj(){return new Date().toISOString().slice(0,10);}

  function leadsDa(c){
    var arr=[];
    try{arr=(typeof campTargets==='function')?campTargets(c)||[]:[];}catch(e){}
    if(arr.length)return arr;
    var all=(typeof state!=='undefined'&&state.opportunities)||[];
    var p=c.publico||{}, seg=String(p.segmento||'').toLowerCase();
    if(seg&&seg!=='multi'){
      arr=all.filter(function(o){
        var hay=String(o.segmento||'').toLowerCase()+' '+String(o.empresa||'').toLowerCase()+' '+String(o.descricao||'').toLowerCase();
        return hay.indexOf(seg)>=0;
      });
    }
    if(!arr.length){
      var cargos=String(p.cargo||'').toLowerCase().split(',').map(function(s){return s.trim();}).filter(Boolean);
      if(cargos.length)arr=all.filter(function(o){var h=String(o.descricao||'').toLowerCase();return cargos.some(function(g){return h.indexOf(g)>=0;});});
    }
    if(!arr.length)arr=all.filter(function(o){return o.grupo==='A';});
    if(!arr.length)arr=all.slice(0,30);
    return arr;
  }
  function msgPara(c,lead){
    var t=c.mensagem||('Olá {contato}, tudo bem? Aqui é {responsavel}. Sobre {oferta} — {objetivo}. Podemos falar 10 min?');
    var p=c.publico||{};
    var map={'{contato}':lead.contato||lead.empresa||'tudo bem','{empresa}':lead.empresa||'sua empresa','{responsavel}':c.responsavel||'Flávio','{objetivo}':c.objetivo||'','{oferta}':c.oferta||'nosso trabalho','{segmento}':p.segmento||lead.segmento||'seu setor'};
    Object.keys(map).forEach(function(k){t=t.split(k).join(map[k]);});
    return t;
  }
  function dataProg(c,i){
    var base=c.agendada_em||(c.inicio?c.inicio+'T09:00':null);
    if(!base)return '—';
    var d=new Date(base);if(isNaN(d.getTime()))return base;
    var min=(c.cadencia_min||10)*i;
    d=new Date(d.getTime()+min*60000);
    var pad=function(n){return String(n).padStart(2,'0');};
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes());
  }
  function modalLead(c,lead,i){
    var p=c.publico||{};
    var msg=msgPara(c,lead);
    var data=dataProg(c,i);
    var h='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><div class="eyebrow">'+esc(c.id)+' · lead '+(i+1)+'</div><h2>'+esc(lead.empresa||lead.contato||'—')+'</h2><div class="sub">'+esc(lead.descricao||lead.segmento||'')+'</div></div><button class="close" data-close>×</button></div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px;margin-top:14px">';
    [['Empresa',lead.empresa],['Contato',lead.contato],['Cargo',lead.descricao],['Segmento',lead.segmento],['Grupo',lead.grupo],['Score',lead.score],['Temperatura',lead.temperatura],['Perfil',lead.perfil],['Telefone',lead.telefone],['WhatsApp',lead.whatsapp],['E-mail',lead.email],['LinkedIn',lead.linkedin_url]].forEach(function(r){
      h+='<div class="kv" style="border:0;padding:5px 0"><span>'+esc(r[0])+'</span><b>'+esc(r[1]==null?'—':r[1])+'</b></div>';
    });
    h+='</div><div style="height:1px;background:var(--line);margin:12px 0"></div>';
    h+='<div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Campanha</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">';
    [['Objetivo',c.objetivo],['Período',(c.inicio||'—')+' – '+(c.fim||'—')],['Segmento',p.segmento],['Público',[p.cargo,p.localizacao].filter(Boolean).join(' · ')],['Canais',(c.canais||[]).join(', ')],['Cadência',(c.cadencia||'—')+' · teto '+(c.volume_dia||30)+'/dia']].forEach(function(r){
      h+='<div class="kv" style="border:0;padding:5px 0"><span>'+esc(r[0])+'</span><b>'+esc(r[1]==null?'—':r[1])+'</b></div>';
    });
    h+='</div>';
    h+='<div style="margin-top:14px;padding:12px;background:linear-gradient(160deg,rgba(34,211,238,.06),rgba(255,255,255,.01));border:1px solid var(--recommend-bd);border-radius:10px"><div class="eyebrow" style="color:var(--recommend);margin-bottom:6px">Mensagem preparada</div><div style="font-size:12.5px;line-height:1.6;white-space:pre-wrap">'+esc(msg)+'</div></div>';
    h+='<div style="margin-top:10px;padding:10px 12px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:10px;display:flex;gap:16px;flex-wrap:wrap;font-size:12px">';
    h+='<span style="color:var(--muted)">Data programada <b style="color:var(--txt)">'+esc(data)+'</b></span>';
    h+='<span style="color:var(--muted)">Canal <b style="color:var(--txt)">'+esc((c.canais||[])[0]||'—')+'</b></span>';
    h+='</div>';
    if(typeof openDrawer==='function')openDrawer(h);
  }
  function chip(l,v){return '<span style="display:inline-flex;gap:4px;align-items:baseline;font-size:11px;color:var(--muted)">'+esc(l)+' <b style="color:var(--txt);font-weight:600">'+esc(v==null?'—':v)+'</b></span>';}

  function cardDisparo(c){
    var ab=!!(state.campaignExpanded&&state.campaignExpanded[c.id]);
    var leads=leadsDa(c);
    var p=c.publico||{};
    var t=c.status==='EM EXECUÇÃO'?'ok':c.status==='PAUSADA'?'warn':c.status==='ENCERRADA'?'':'info';
    var h='<div class="camp-row'+(ab?' expanded':'')+'" style="border:1px solid var(--line);border-radius:10px;margin-bottom:6px;overflow:hidden">';
    h+='<div data-disp-expand="'+esc(c.id)+'" style="display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;flex-wrap:wrap">';
    h+='<span style="transform:rotate('+(ab?'90deg':'0')+');transition:.15s;font-size:9px;color:var(--muted2)">▶</span>';
    h+='<span style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--accent)">'+esc(c.id)+'</span>';
    h+='<span style="font-size:13px;font-weight:600;flex:1;min-width:120px">'+esc(c.nome)+'</span>';
    h+=bd(c.status,t);
    h+='<span style="font-family:var(--font-display);font-size:14px;font-weight:600">'+num(leads.length)+'</span><span class="sub" style="font-size:10px">leads</span></div>';
    if(ab){
      h+='<div style="border-top:1px solid var(--line);padding:12px;background:rgba(255,255,255,.015)">';
      h+='<div style="display:flex;flex-wrap:wrap;gap:6px 18px;margin-bottom:12px">'+chip('Objetivo',c.objetivo)+chip('Período',(c.inicio||'—')+' – '+(c.fim||'—'))+chip('Segmento',p.segmento)+chip('Canais',(c.canais||[]).join(', '))+chip('Público',[p.cargo,p.localizacao].filter(Boolean).join(' · '))+chip('Cadência',(c.cadencia||'—')+' · '+(c.volume_dia||30)+'/dia')+'</div>';
      h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
      h+= (typeof campPendentes==='function'&&campPendentes(c)?'<button class="btn sm primary" data-camp-run="'+esc(c.id)+'">Disparar '+campPendentes(c)+'</button>':'');
      h+= (c.status==='PAUSADA'?'<button class="btn success sm" data-camp-resume="'+esc(c.id)+'">▶ Retomar</button>':'<button class="btn sm warn" data-camp-pause="'+esc(c.id)+'">❚❚ Pausar</button>');
      h+= '<button class="btn sm" data-camp-reschedule="'+esc(c.id)+'">📅 Reagendar</button>';
      h+= '<button class="btn sm ghost" data-open-campaign="'+esc(c.id)+'">Ver tudo</button>';
      h+='</div>';
      h+='<div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Leads</div>';
      if(!leads.length){h+='<div class="empty" style="padding:10px">Nenhum lead.</div>';}
      else{
        h+='<div style="display:flex;flex-direction:column;gap:2px;max-height:280px;overflow:auto">';
        leads.slice(0,100).forEach(function(l,i){
          h+='<div data-disp-lead="'+esc(c.id)+'|'+i+'" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:12px">';
          h+='<div style="min-width:0"><div style="font-weight:600;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(l.empresa||l.contato||'—')+'</div><div class="sub" style="font-size:10.5px;color:var(--muted)">'+esc(l.descricao||l.segmento||'')+'</div></div>';
          h+='<div style="display:flex;gap:6px;align-items:center"><span class="chip-s" style="font-size:10px">'+esc(l.grupo||'?')+'</span><span class="chip-s" style="font-size:10px">'+esc(l.score||0)+'</span></div></div>';
        });
        h+='</div>';
      }
      h+='</div>';
    }
    h+='</div>';
    return h;
  }
  function historicoHTML(){
    var env=(state.actions||[]).filter(function(a){return ['ENVIADO','RESPONDIDO','CONCLUÍDO','CANCELADO'].indexOf(a.status)>=0;});
    env.sort(function(a,b){return String(b.enviado_em||b.prazo||'').localeCompare(String(a.enviado_em||a.prazo||''));});
    if(!env.length)return '<div class="op-empty">Nenhum envio registrado ainda.</div>';
    var h='<div class="op-list">';
    env.slice(0,60).forEach(function(a){
      var o=(typeof oppOf==='function')?(oppOf(a.opportunity_id)||{}):{};
      var camp=a.campaign_id?((state.campaigns||[]).filter(function(c){return c.id===a.campaign_id;})[0]||null):null;
      h+='<div class="op-row"><div>'+bd(a.status,a.status==='RESPONDIDO'?'ok':a.status==='ENVIADO'?'info':'')+'</div>';
      h+='<div style="min-width:0"><div class="t">'+esc(o.empresa||a.contato||'—')+'<small>'+esc(a.canal||'')+' · '+esc(a.etapa||'')+'</small></div>';
      h+='<div class="d">'+esc(a.acao||'')+(camp?' · '+esc(camp.id):'')+' · '+esc(String(a.enviado_em||a.prazo||'').slice(0,16).replace('T',' '))+'</div></div>';
      h+='<div class="acts"><span class="sub" style="font-size:10.5px">'+esc(a.enviado_para||'—')+'</span></div></div>';
    });
    h+='</div>';
    return h;
  }

  function viewDisparos(){
    var cs=(state.campaigns||[]).filter(function(c){return !c.sugestao;});
    var tot=0;cs.forEach(function(c){tot+=leadsDa(c).length;});
    var env=(state.actions||[]).filter(function(a){return ['ENVIADO','RESPONDIDO','CONCLUÍDO'].indexOf(a.status)>=0;}).length;
    var h='<div class="op-kpis">'+
      '<button class="op-kpi"><b>'+cs.length+'</b><span>Campanhas</span></button>'+
      '<button class="op-kpi is-ok"><b>'+cs.filter(function(c){return c.status==='EM EXECUÇÃO';}).length+'</b><span>Ativas</span></button>'+
      '<button class="op-kpi"><b>'+num(tot)+'</b><span>Leads no público</span></button>'+
      '<button class="op-kpi is-info"><b>'+env+'</b><span>Enviados</span></button>'+
      '</div>';
    h+='<div class="op-bar"><button class="btn primary sm" data-new-campaign>＋ Nova campanha</button><button class="btn sm" data-goto-view="fila">→ Ver Fila em andamento</button></div>';
    h+='<div class="op-head" style="margin-bottom:8px"><h2>Campanhas</h2><span class="sub">Clique para ver público, cadência, leads e mensagem</span></div>';
    h+=cs.length?cs.map(cardDisparo).join(''):'<div class="op-empty">Nenhuma campanha criada.</div>';
    h+='<div class="op-head" style="margin-top:22px"><h2>Histórico de disparos</h2><span class="sub">Envios registrados</span></div>';
    h+=historicoHTML();
    return h;
  }

  function rotuloDia(iso){
    if(!iso)return '(sem data)';
    var d=new Date(iso+'T12:00:00');if(isNaN(d.getTime()))return iso;
    var hoje=new Date();hoje.setHours(12,0,0,0);
    var diff=Math.round((d-hoje)/86400000);
    var dias=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
    if(diff===0)return 'Hoje · '+dias[d.getDay()];
    if(diff===1)return 'Amanhã · '+dias[d.getDay()];
    if(diff>1&&diff<7)return dias[d.getDay()].charAt(0).toUpperCase()+dias[d.getDay()].slice(1);
    return String(iso).slice(8,10)+'/'+String(iso).slice(5,7)+' · '+dias[d.getDay()];
  }
  function viewFila(){
    var acts=(state.actions||[]).filter(function(a){return ['PRONTO','AGENDADO','EXECUTANDO','ERRO','BLOQUEADO'].indexOf(a.status)>=0;});
    var porDia={},ordem=[];
    acts.forEach(function(a){
      var d=String(a.prazo||'').slice(0,10)||'';
      if(!porDia[d]){porDia[d]=[];ordem.push(d);}
      porDia[d].push(a);
    });
    ordem.sort();
    var hoje=hj();
    var atras=acts.filter(function(a){return String(a.prazo||'').slice(0,10)<hoje;}).length;
    var hoje_=acts.filter(function(a){return String(a.prazo||'').slice(0,10)===hoje;}).length;
    var prox=ordem.filter(function(d){return d>hoje;}).length;

    var h='<div class="op-kpis">'+
      '<button class="op-kpi"><b>'+acts.length+'</b><span>Na fila</span></button>'+
      '<button class="op-kpi is-ok"><b>'+hoje_+'</b><span>Hoje</span></button>'+
      '<button class="op-kpi'+(atras?' is-urgent':'')+'"><b>'+atras+'</b><span>Atrasadas</span></button>'+
      '<button class="op-kpi is-info"><b>'+prox+'</b><span>Próximos dias</span></button>'+
      '</div>';
    h+='<div class="op-bar"><button class="btn sm" data-goto-view="disparos">→ Gerenciar Disparos</button><span class="sp"></span><span class="sub" style="font-size:11px">'+acts.length+' ação(ões) · ordenadas por dia</span></div>';

    if(!acts.length){
      h+='<div class="op-list"><div class="op-empty">Fila vazia. Crie campanhas em <b>Gerenciar Disparos</b>.</div></div>';
    } else {
      ordem.forEach(function(dia){
        var lista=porDia[dia];
        var cor=dia<hoje?'var(--urgent)':dia===hoje?'var(--accent)':'var(--info)';
        h+='<div class="op-sec" style="margin-top:14px">';
        h+='<div class="op-head"><h2 style="display:flex;align-items:center;gap:8px"><span class="dot" style="background:'+cor+'"></span>'+esc(rotuloDia(dia))+'</h2><span class="sub">'+lista.length+'</span></div>';
        h+='<div class="op-list">';
        lista.slice(0,50).forEach(function(a){
          var o=(typeof oppOf==='function')?(oppOf(a.opportunity_id)||{}):{};
          var camp=a.campaign_id?((state.campaigns||[]).filter(function(c){return c.id===a.campaign_id;})[0]||null):null;
          var pode=a.canal==='WhatsApp'&&['PRONTO','AGENDADO','ERRO','BLOQUEADO'].indexOf(a.status)>=0;
          var tr=a.status==='ERRO'?'t-urgent':a.status==='BLOQUEADO'?'t-warn':'';
          h+='<div class="op-row '+tr+'"><div>'+bd(a.status,a.status==='ERRO'?'hot':a.status==='BLOQUEADO'?'warm':a.status==='EXECUTANDO'?'info':'')+'</div>';
          h+='<div style="min-width:0"><div class="t" style="overflow-wrap:anywhere">'+esc(o.empresa||a.contato||'—')+'<small>'+esc(a.canal||'')+' · '+esc(a.etapa||'')+'</small></div>';
          h+='<div class="d">'+esc(a.acao||'')+(camp?' · '+esc(camp.id):'')+' · <b>'+esc(String(a.prazo||'').slice(11,16)||'—')+'</b></div></div>';
          h+='<div class="acts">';
          if(pode)h+='<button class="btn sm primary" data-act-send="'+esc(a.id)+'">Enviar</button>';
          h+='<button class="btn sm ghost" data-edit-action="'+esc(a.id)+'">✎</button></div></div>';
        });
        h+='</div></div>';
      });
    }
    h+='<div class="op-head" style="margin-top:22px"><h2>Histórico</h2><span class="sub">Disparos já feitos</span></div>';
    h+=historicoHTML();
    return h;
  }

  function viewCentral(){
    var cs=(state.campaigns||[]).filter(function(c){return !c.sugestao;});
    var acts=(state.actions||[]);
    var hoje=hj();
    var ativas=cs.filter(function(c){return c.status==='EM EXECUÇÃO';});
    var totLead=0;cs.forEach(function(c){totLead+=leadsDa(c).length;});
    var hoje_=acts.filter(function(a){return String(a.prazo||'').slice(0,10)===hoje;}).length;
    var atras=acts.filter(function(a){return String(a.prazo||'').slice(0,10)<hoje&&['PRONTO','AGENDADO'].indexOf(a.status)>=0;}).length;
    var am=new Date();am.setDate(am.getDate()+1);
    var amanha=am.toISOString().slice(0,10);
    var amanha_=acts.filter(function(a){return String(a.prazo||'').slice(0,10)===amanha;}).length;
    var sent=acts.filter(function(a){return a.status==='ENVIADO'&&String(a.enviado_em||'').slice(0,10)===hoje;}).length;
    var err=acts.filter(function(a){return a.status==='ERRO';}).length;

    var h='<div class="op-kpis">'+
      '<button class="op-kpi is-ok" data-goto-view="disparos"><b>'+ativas.length+'</b><span>Campanhas ativas</span></button>'+
      '<button class="op-kpi" data-goto-view="fila"><b>'+num(totLead)+'</b><span>Leads no público</span></button>'+
      '<button class="op-kpi" data-goto-view="fila"><b>'+hoje_+'</b><span>Na fila hoje</span></button>'+
      '<button class="op-kpi'+(atras?' is-urgent':'')+'" data-goto-view="fila"><b>'+atras+'</b><span>Atrasadas</span></button>'+
      '<button class="op-kpi is-info"><b>'+sent+'</b><span>Enviados hoje</span></button>'+
      (err?'<button class="op-kpi is-urgent"><b>'+err+'</b><span>Com erro</span></button>':'')+
      '</div>';

    h+='<div class="op-head" style="margin-top:18px"><h2>Campanhas ativas</h2><span class="sub">'+ativas.length+' em execução · '+amanha_+' programada(s) para amanhã</span></div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px">';
    ativas.forEach(function(c){
      var leads=leadsDa(c);
      h+='<div class="card left-ok" style="padding:12px;cursor:pointer" data-goto-view="disparos">';
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><div style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--accent)">'+esc(c.id)+'</div><div style="font-size:12.5px;font-weight:600;margin-top:2px">'+esc(c.nome)+'</div></div>'+bd(c.status,'ok')+'</div>';
      h+='<div style="margin-top:8px;display:flex;justify-content:space-between;font-size:11px;color:var(--muted)"><span>Leads <b style="color:var(--txt)">'+num(leads.length)+'</b></span><span>Canais <b style="color:var(--txt)">'+esc((c.canais||[]).join(', '))+'</b></span></div>';
      h+='</div>';
    });
    if(!ativas.length)h+='<div class="op-empty">Nenhuma campanha ativa.</div>';
    h+='</div>';

    h+='<div class="op-head" style="margin-top:22px"><h2>Distribuição dos leads</h2><span class="sub">Onde estão os '+num(totLead)+' leads dos públicos</span></div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">';
    cs.forEach(function(c){
      var leads=leadsDa(c);
      h+='<div class="card" style="padding:10px;cursor:pointer" data-goto-view="disparos">';
      h+='<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-family:var(--font-display);font-size:12px;font-weight:700;color:var(--accent)">'+esc(c.id)+'</span><span style="font-family:var(--font-display);font-size:18px;font-weight:500">'+num(leads.length)+'</span></div>';
      h+='<div class="sub" style="font-size:11px;margin-top:2px">'+esc(c.nome)+'</div>';
      h+='</div>';
    });
    h+='</div>';

    h+='<div class="op-head" style="margin-top:22px"><h2>Histórico recente</h2></div>'+historicoHTML();
    return h;
  }

  function aplicar(){
    if(typeof VIEWS==='undefined'){setTimeout(aplicar,200);return;}
    VIEWS.fila=viewFila;
    VIEWS.disparos=viewDisparos;
    VIEWS.central=viewCentral;
    if(typeof TITLES!=='undefined'){
      TITLES.central=['Central','Tudo mapeado: campanhas, leads, fila e histórico.'];
      TITLES.fila=['Fila','Dia a dia da fila: hoje, próximos dias e histórico.'];
      TITLES.disparos=['Gerenciar Disparos','Campanhas, leads e histórico de disparos.'];
    }
    if(typeof render==='function')setTimeout(render,60);
  }
  aplicar();

  document.addEventListener('click',function(ev){
    var el;
    el=ev.target.closest('[data-disp-expand]');
    if(el){ev.preventDefault();ev.stopPropagation();var id=el.dataset.dispExpand;state.campaignExpanded=state.campaignExpanded||{};state.campaignExpanded[id]=!state.campaignExpanded[id];if(typeof render==='function')render();return;}
    el=ev.target.closest('[data-disp-lead]');
    if(el){ev.preventDefault();ev.stopPropagation();var p=el.dataset.dispLead.split('|');var c=(state.campaigns||[]).filter(function(x){return x.id===p[0];})[0];if(!c)return;var leads=leadsDa(c);var lead=leads[parseInt(p[1],10)];if(lead)modalLead(c,lead,parseInt(p[1],10));return;}
  },true);
})();
