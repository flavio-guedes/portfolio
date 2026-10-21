(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function num(v){return (typeof fmtNum==='function')?fmtNum(v):String(v);}
  function bd(t,tone){return '<span class="badge '+(tone||'')+'">'+esc(t)+'</span>';}

  function leadsDa(c){
    var arr=[];
    try{arr=(typeof campTargets==='function')?campTargets(c)||[]:[];}catch(e){}
    if(arr.length)return arr;
    var all=(typeof state!=='undefined'&&state.opportunities)||[];
    var p=c.publico||{}, seg=String(p.segmento||'').toLowerCase();
    if(seg&&seg!=='multi')arr=all.filter(function(o){var h=(String(o.segmento||'')+' '+String(o.empresa||'')+' '+String(o.descricao||'')).toLowerCase();return h.indexOf(seg)>=0;});
    if(!arr.length)arr=all.filter(function(o){return o.grupo==='A';});
    if(!arr.length)arr=all.slice(0,30);
    return arr;
  }
  function acoesDa(id){
    return (state.actions||[]).filter(function(a){return String(a.campaign_id)===String(id);});
  }
  function pendentesDa(id){
    return acoesDa(id).filter(function(a){return ['PRONTO','AGENDADO','EXECUTANDO'].indexOf(a.status)>=0;});
  }
  function msgPara(c,lead){
    var t=c.mensagem||('Olá {contato}, tudo bem? Aqui é {responsavel}. Sobre {oferta} — {objetivo}. Podemos falar 10 min?');
    var p=c.publico||{};
    var map={'{contato}':lead.contato||lead.empresa||'tudo bem','{empresa}':lead.empresa||'sua empresa','{responsavel}':c.responsavel||'Flávio','{objetivo}':c.objetivo||'','{oferta}':c.oferta||'nosso trabalho','{segmento}':p.segmento||lead.segmento||'seu setor'};
    Object.keys(map).forEach(function(k){t=t.split(k).join(map[k]);});
    return t;
  }

  /* ========= MOVER CAMPANHA PARA FILA ========= */
  function moverParaFila(c){
    var leads=leadsDa(c);
    if(!leads.length){alert('Nenhum lead no público desta campanha.');return 0;}
    var jaTem=acoesDa(c.id).map(function(a){return String(a.opportunity_id);});
    var novos=leads.filter(function(l){return jaTem.indexOf(String(l.id))<0;});
    if(!novos.length){alert('Todos os leads já estão na fila.');return 0;}
    /* Limita ao volume diário */
    var teto=c.volume_dia||30;
    var lote=novos.slice(0,teto);
    /* Data base = agendada_em ou início, senão agora */
    var base=c.agendada_em||(c.inicio?c.inicio+'T09:00':null);
    if(!base){
      var d=new Date();d.setMinutes(0,0,0);d.setHours(d.getHours()+1);
      var pad=function(n){return String(n).padStart(2,'0');};
      base=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
    }
    var cadMin=c.cadencia_min||10;
    var canal=(c.canais&&c.canais[0])||'WhatsApp';
    var criadas=0;
    lote.forEach(function(l,i){
      var quando=new Date(new Date(base).getTime()+cadMin*i*60000);
      var iso=quando.toISOString().slice(0,16);
      var ac={
        id:'ACT-'+c.id+'-'+l.id,
        opportunity_id:l.id,
        campaign_id:c.id,
        contato:l.contato||l.empresa,
        empresa:l.empresa,
        canal:canal,
        etapa:(c.cadencia||'D0').split(',')[0].trim()||'D0',
        acao:msgPara(c,l),
        prazo:iso,
        prioridade:'Média',
        prioridade_fila:2,
        status:'AGENDADO',
        publico:c.publico||{},
        lista:c.lista||''
      };
      try{ if(typeof upsertAction==='function')upsertAction(ac); else state.actions.push(ac); }
      catch(e){ state.actions.push(ac); }
      criadas++;
    });
    /* Muda status para EM EXECUÇÃO */
    if(typeof setCampaignStatus==='function')setCampaignStatus(c.id,'EM EXECUÇÃO');
    else c.status='EM EXECUÇÃO';
    if(typeof registerEvent==='function'){
      try{registerEvent({canal:canal,acao:'Campanha '+c.id+' disparada',contato:c.nome},true);}catch(e){}
    }
    if(typeof render==='function')render();
    return criadas;
  }

  /* ========= EXPANDIR ========= */
  function modalLead(c,lead,i){
    var p=c.publico||{}, msg=msgPara(c,lead);
    var base=c.agendada_em||(c.inicio?c.inicio+'T09:00':new Date().toISOString().slice(0,16));
    var d=new Date(new Date(base).getTime()+(c.cadencia_min||10)*i*60000);
    var pad=function(n){return String(n).padStart(2,'0');};
    var data=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes());
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
    h+='<div style="margin-top:10px;padding:10px 12px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:10px;display:flex;gap:16px;flex-wrap:wrap;font-size:12px"><span style="color:var(--muted)">Data programada <b style="color:var(--txt)">'+esc(data)+'</b></span><span style="color:var(--muted)">Canal <b style="color:var(--txt)">'+esc((c.canais||[])[0]||'—')+'</b></span></div>';
    if(typeof openDrawer==='function')openDrawer(h);
  }
  function chip(l,v){return '<span style="display:inline-flex;gap:4px;align-items:baseline;font-size:11px;color:var(--muted)">'+esc(l)+' <b style="color:var(--txt);font-weight:600">'+esc(v==null?'—':v)+'</b></span>';}

  function cardDisparo(c){
    var ab=!!(state.campaignExpanded&&state.campaignExpanded[c.id]);
    var leads=leadsDa(c), p=c.publico||{};
    var pend=pendentesDa(c.id).length;
    var enviadas=acoesDa(c.id).filter(function(a){return a.status==='ENVIADO';}).length;
    var t=c.status==='EM EXECUÇÃO'?'ok':c.status==='PAUSADA'?'warn':c.status==='ENCERRADA'?'':'info';
    var ativa=c.status==='EM EXECUÇÃO';
    var pausada=c.status==='PAUSADA';
    var h='<div class="camp-row'+(ab?' expanded':'')+'" style="border:1px solid var(--line);border-radius:10px;margin-bottom:6px;overflow:hidden">';
    h+='<div data-disp-expand="'+esc(c.id)+'" style="display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;flex-wrap:wrap">';
    h+='<span style="transform:rotate('+(ab?'90deg':'0')+');transition:.15s;font-size:9px;color:var(--muted2)">▶</span>';
    h+='<span style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--accent)">'+esc(c.id)+'</span>';
    h+='<span style="font-size:13px;font-weight:600;flex:1;min-width:120px">'+esc(c.nome)+'</span>';
    h+=bd(c.status,t);
    h+='<span style="font-family:var(--font-display);font-size:14px;font-weight:600">'+num(leads.length)+'</span><span class="sub" style="font-size:10px">leads</span>';
    if(pend)h+='<span class="sub" style="font-size:10px;color:var(--warn)">'+pend+' na fila</span>';
    if(enviadas)h+='<span class="sub" style="font-size:10px;color:var(--ok)">'+enviadas+' enviados</span>';
    h+='</div>';
    if(ab){
      h+='<div style="border-top:1px solid var(--line);padding:12px;background:rgba(255,255,255,.015)">';
      h+='<div style="display:flex;flex-wrap:wrap;gap:6px 18px;margin-bottom:12px">'+chip('Objetivo',c.objetivo)+chip('Período',(c.inicio||'—')+' – '+(c.fim||'—'))+chip('Segmento',p.segmento)+chip('Canais',(c.canais||[]).join(', '))+chip('Público',[p.cargo,p.localizacao].filter(Boolean).join(' · '))+chip('Cadência',(c.cadencia||'—')+' · '+(c.volume_dia||30)+'/dia')+'</div>';

      /* ========= BOTÕES DE AÇÃO ========= */
      h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;padding:10px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:8px">';
      /* Botão principal: Mover para Fila */
      h+='<button class="btn primary sm" data-camp-mover="'+esc(c.id)+'">▶ Mover campanha para Fila'+(pend?' (já tem '+pend+')':'')+'</button>';
      /* Ativar/Pausar — destaque */
      if(ativa)h+='<button class="btn warn sm" data-camp-pause="'+esc(c.id)+'">❚❚ Pausar</button>';
      else if(pausada)h+='<button class="btn success sm" data-camp-resume="'+esc(c.id)+'">▶ Ativar</button>';
      else h+='<button class="btn success sm" data-camp-resume="'+esc(c.id)+'">▶ Ativar</button>';
      /* Reagendar */
      h+='<button class="btn sm" data-camp-reschedule="'+esc(c.id)+'">📅 Reagendar</button>';
      /* Editar — secundário, muda para Gerenciar Disparos automaticamente */
      h+='<button class="btn ghost sm" data-camp-editar="'+esc(c.id)+'" style="margin-left:auto" title="Editar campanha">✎ Editar</button>';
      h+='</div>';

      h+='<div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Leads ('+leads.length+')</div>';
      if(!leads.length){h+='<div class="empty" style="padding:10px">Nenhum lead.</div>';}
      else{
        h+='<div style="display:flex;flex-direction:column;gap:2px;max-height:280px;overflow:auto">';
        leads.slice(0,100).forEach(function(l,i){
          var naFila=acoesDa(c.id).some(function(a){return String(a.opportunity_id)===String(l.id);});
          h+='<div data-disp-lead="'+esc(c.id)+'|'+i+'" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:12px">';
          h+='<div style="min-width:0"><div style="font-weight:600;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(l.empresa||l.contato||'—')+'</div><div class="sub" style="font-size:10.5px">'+esc(l.descricao||l.segmento||'')+'</div></div>';
          h+='<div style="display:flex;gap:6px;align-items:center">';
          if(naFila)h+='<span class="chip-s" style="font-size:9.5px;color:var(--ok);border-color:var(--ok-bd)">na fila</span>';
          h+='<span class="chip-s" style="font-size:10px">'+esc(l.grupo||'?')+'</span><span class="chip-s" style="font-size:10px">'+esc(l.score||0)+'</span>';
          h+='</div></div>';
        });
        h+='</div>';
      }
      h+='</div>';
    }
    h+='</div>';
    return h;
  }

  /* ========= SOBRESCREVER A VIEW DISPAROS ========= */
  function historicoHTML(){
    var env=(state.actions||[]).filter(function(a){return ['ENVIADO','RESPONDIDO','CONCLUÍDO','CANCELADO'].indexOf(a.status)>=0;});
    env.sort(function(a,b){return String(b.enviado_em||b.prazo||'').localeCompare(String(a.enviado_em||a.prazo||''));});
    if(!env.length)return '<div class="op-empty">Nenhum envio registrado ainda.</div>';
    var h='<div class="op-list">';
    env.slice(0,60).forEach(function(a){
      var o=(typeof oppOf==='function')?(oppOf(a.opportunity_id)||{}):{};
      var camp=a.campaign_id?((state.campaigns||[]).filter(function(c){return c.id===a.campaign_id;})[0]||null):null;
      h+='<div class="op-row"><div>'+bd(a.status,a.status==='RESPONDIDO'?'ok':a.status==='ENVIADO'?'info':'')+'</div>';
      h+='<div style="min-width:0"><div class="t">'+esc(o.empresa||a.contato||'—')+'<small>'+esc(a.canal||'')+' · '+esc(a.etapa||'')+'</small></div><div class="d">'+esc(camp?camp.id:'')+' · '+esc(String(a.enviado_em||a.prazo||'').slice(0,16).replace('T',' '))+'</div></div>';
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
    h+='<div class="op-head" style="margin-bottom:8px"><h2>Campanhas</h2><span class="sub">Clique para expandir · <b>Mover para Fila</b> gera as ações</span></div>';
    h+=cs.length?cs.map(cardDisparo).join(''):'<div class="op-empty">Nenhuma campanha criada.</div>';
    h+='<div class="op-head" style="margin-top:22px"><h2>Histórico de disparos</h2></div>'+historicoHTML();
    return h;
  }

  function aplicar(){
    if(typeof VIEWS==='undefined'){setTimeout(aplicar,200);return;}
    VIEWS.disparos=viewDisparos;
    if(typeof render==='function')setTimeout(render,60);
  }
  aplicar();

  /* ========= CLIQUES ========= */
  document.addEventListener('click',function(ev){
    var el;
    el=ev.target.closest('[data-camp-mover]');
    if(el){ev.preventDefault();ev.stopPropagation();
      var c=(state.campaigns||[]).filter(function(x){return x.id===el.dataset.campMover;})[0];
      if(!c)return;
      var n=moverParaFila(c);
      if(n){
        el.textContent='✓ '+n+' ações movidas';
        setTimeout(function(){if(typeof render==='function')render();},600);
      }
      return;
    }
    el=ev.target.closest('[data-camp-editar]');
    if(el){ev.preventDefault();ev.stopPropagation();
      if(typeof state!=='undefined')state.view='disparos';
      /* Abre o modal de edição da campanha */
      var c2=(state.campaigns||[]).filter(function(x){return x.id===el.dataset.campEditar;})[0];
      if(c2&&typeof modalCampanha==='function'&&typeof openModal==='function'){
        openModal(modalCampanha(false,c2));
        if(typeof afterCampModal==='function')afterCampModal();
      } else if(typeof render==='function')render();
      return;
    }
    el=ev.target.closest('[data-disp-expand]');
    if(el){ev.preventDefault();ev.stopPropagation();
      var id=el.dataset.dispExpand;
      state.campaignExpanded=state.campaignExpanded||{};
      state.campaignExpanded[id]=!state.campaignExpanded[id];
      if(typeof render==='function')render();return;
    }
    el=ev.target.closest('[data-disp-lead]');
    if(el){ev.preventDefault();ev.stopPropagation();
      var p=el.dataset.dispLead.split('|');
      var c3=(state.campaigns||[]).filter(function(x){return x.id===p[0];})[0];if(!c3)return;
      var leads=leadsDa(c3);
      var lead=leads[parseInt(p[1],10)];
      if(lead)modalLead(c3,lead,parseInt(p[1],10));
      return;
    }
  },true);
})();
