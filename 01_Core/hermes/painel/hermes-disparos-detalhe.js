(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function num(v){return (typeof fmtNum==='function')?fmtNum(v):String(v);}
  function badge(t,tone){return (typeof C!=='undefined'&&C.badge)?C.badge(t,tone):'<span class="badge '+(tone||'')+'">'+esc(t)+'</span>';}

  function msgPara(c,lead){
    var t=c.mensagem||('Olá {contato}, tudo bem? Aqui é {responsavel}. Sobre {oferta} — {objetivo}. Podemos conversar 10 min?');
    var p=(c.publico||{});
    var map={
      '{contato}':lead.contato||lead.empresa||'tudo bem',
      '{empresa}':lead.empresa||'sua empresa',
      '{responsavel}':c.responsavel||'Flávio',
      '{objetivo}':c.objetivo||'',
      '{oferta}':c.oferta||'nosso trabalho',
      '{segmento}':p.segmento||lead.segmento||'seu setor'
    };
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
  function leadsDa(c){
    if(typeof campTargets!=='function')return [];
    try{return campTargets(c)||[];}catch(e){return [];}
  }

  function modalLead(c,lead,i){
    var info=[
      ['—','—'],
      ['Campanha',c.id+' · '+c.nome],
      ['Objetivo',c.objetivo||'—'],
      ['Período',(c.inicio||'—')+' – '+(c.fim||'—')],
      ['Segmento da campanha',(c.publico&&c.publico.segmento)||'—'],
      ['Público',(function(){var p=c.publico||{};return [p.segmento,p.cargo,p.localizacao].filter(Boolean).join(' · ')||'—';})()],
      ['Canais',(c.canais||[]).join(', ')||'—'],
      ['Cadência',c.cadencia||'—'],
      ['Teto/dia',(c.volume_dia||30)+' envios'],
      ['—','—'],
      ['Empresa',lead.empresa||'—'],
      ['Contato',lead.contato||'—'],
      ['Cargo',lead.descricao||'—'],
      ['Segmento do lead',lead.segmento||'—'],
      ['Grupo',lead.grupo||'—'],
      ['Score',lead.score||0],
      ['Temperatura',lead.temperatura||'—'],
      ['Perfil',lead.perfil||'—'],
      ['Canal preferido',lead.canal_preferido||'—'],
      ['Telefone',lead.telefone||'—'],
      ['WhatsApp',lead.whatsapp||'—'],
      ['E-mail',lead.email||'—'],
      ['LinkedIn',lead.linkedin_url||'—']
    ];
    var msg=msgPara(c,lead);
    var data=dataProg(c,i);
    var h='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">'+
      '<div><div class="eyebrow">'+esc(c.id)+' · Lead '+(i+1)+'</div>'+
      '<h2>'+esc(lead.empresa||lead.contato||'—')+'</h2>'+
      '<div class="sub">'+esc(lead.descricao||lead.segmento||'')+'</div></div>'+
      '<button class="close" data-close>×</button></div>';
    h+='<div style="margin-top:16px">';
    info.forEach(function(p){
      if(p[0]==='—'){h+='<div style="height:1px;background:var(--line);margin:14px 0"></div>';return;}
      h+='<div class="kv"><span>'+esc(p[0])+'</span><b>'+esc(p[1])+'</b></div>';
    });
    h+='</div>';
    h+='<div style="margin-top:18px;padding:14px;background:linear-gradient(160deg,rgba(34,211,238,.06),rgba(255,255,255,.01));border:1px solid var(--recommend-bd);border-radius:10px">';
    h+='<div class="eyebrow" style="color:var(--recommend);margin-bottom:6px">Mensagem preparada</div>';
    h+='<div style="font-size:13px;line-height:1.65;white-space:pre-wrap">'+esc(msg)+'</div>';
    h+='</div>';
    h+='<div style="margin-top:14px;padding:12px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:10px">';
    h+='<div class="kv" style="border:0;padding:0"><span>Data programada</span><b>'+esc(data)+'</b></div>';
    h+='<div class="kv" style="border:0;padding:6px 0 0"><span>Canal do disparo</span><b>'+esc((c.canais||[])[0]||'—')+'</b></div>';
    h+='</div>';
    if(typeof openDrawer==='function')openDrawer(h);
  }

  function detalheHTML(c){
    var leads=leadsDa(c);
    var lim=50;
    var p=c.publico||{};
    var h='<div class="camp-body" style="padding:0 14px 14px;border-top:1px solid var(--line);margin-top:10px">';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:12px">';
    h+='<div class="kv" style="flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;background:rgba(255,255,255,.02);border-radius:8px"><span>Objetivo</span><b style="text-align:left;font-weight:600">'+esc(c.objetivo||'—')+'</b></div>';
    h+='<div class="kv" style="flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;background:rgba(255,255,255,.02);border-radius:8px"><span>Período</span><b style="text-align:left;font-weight:600">'+esc((c.inicio||'—')+' – '+(c.fim||'—'))+'</b></div>';
    h+='<div class="kv" style="flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;background:rgba(255,255,255,.02);border-radius:8px"><span>Segmento</span><b style="text-align:left;font-weight:600">'+esc(p.segmento||'—')+'</b></div>';
    h+='<div class="kv" style="flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;background:rgba(255,255,255,.02);border-radius:8px"><span>Canais</span><b style="text-align:left;font-weight:600">'+esc((c.canais||[]).join(', ')||'—')+'</b></div>';
    h+='<div class="kv" style="flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;background:rgba(255,255,255,.02);border-radius:8px"><span>Público</span><b style="text-align:left;font-weight:600">'+esc([p.cargo,p.localizacao].filter(Boolean).join(' · ')||'—')+'</b></div>';
    h+='<div class="kv" style="flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;background:rgba(255,255,255,.02);border-radius:8px"><span>Cadência</span><b style="text-align:left;font-weight:600">'+esc(c.cadencia||'—')+' • teto '+(c.volume_dia||30)+'/dia</b></div>';
    h+='</div>';
    h+='<div style="margin-top:14px;display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><div style="font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)">Leads nesta campanha</div><div class="sub">'+num(leads.length)+' candidato(s)</div></div>';
    if(!leads.length){h+='<div class="empty" style="padding:14px">Nenhum lead bate com o público desta campanha.</div>';}
    else{
      h+='<div class="op-list" style="margin-top:8px">';
      leads.slice(0,lim).forEach(function(l,i){
        var tom=(l.temperatura==='Quente'||l.temperatura==='Muito quente')?'t-ok':l.grupo==='A'?'t-info':'';
        h+='<div class="op-row is-click '+tom+'" data-disp-lead="'+esc(c.id)+'|'+i+'" style="grid-template-columns:minmax(0,1fr) auto">';
        h+='<div><div class="t">'+esc(l.empresa||l.contato||'—')+'<small>'+esc(l.descricao||l.segmento||'')+'</small></div>';
        h+='<div class="d">'+esc([l.grupo?'Grupo '+l.grupo:'',l.score?'score '+l.score:'',l.canal_preferido||''].filter(Boolean).join(' · '))+'</div></div>';
        h+='<div class="acts">'+badge('abrir','info')+'</div>';
        h+='</div>';
      });
      h+='</div>';
      if(leads.length>lim)h+='<div class="sub" style="margin-top:6px">+ '+(leads.length-lim)+' além destes</div>';
    }
    h+='</div>';
    return h;
  }

  function cardHTML(c){
    var aberta=!!(state.campaignExpanded&&state.campaignExpanded[c.id]);
    var leads=leadsDa(c);
    var t=c.status==='EM EXECUÇÃO'?'ok':c.status==='PAUSADA'?'warn':c.status==='ENCERRADA'?'':'info';
    var h='<div class="card camp-row'+(aberta?' expanded':'')+'" style="padding:0;margin-bottom:8px">';
    h+='<div class="camp-head" data-disp-expand="'+esc(c.id)+'" style="cursor:pointer;padding:14px">';
    h+='<span class="tl-chevron" style="transform:rotate('+(aberta?'90deg':'0deg')+');transition:.15s">▶</span>';
    h+='<div style="min-width:0;flex:1"><div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;flex-wrap:wrap">';
    h+='<span style="font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--accent)">'+esc(c.id)+'</span>';
    h+='<span style="font-size:14px;font-weight:600">'+esc(c.nome)+'</span>'+badge(c.status,t);
    h+='</div>';
    h+='<div class="sub" style="font-size:11px">'+esc(c.objetivo||'')+'</div></div>';
    h+='<div style="text-align:right;flex-shrink:0"><div style="font-family:var(--font-display);font-size:16px;font-weight:500">'+num(leads.length)+'</div><div class="sub" style="font-size:10px">candidato(s)</div></div>';
    h+='</div>';
    if(aberta)h+=detalheHTML(c);
    h+='</div>';
    return h;
  }

  function viewDisparos(){
    var cs=(state.campaigns||[]).filter(function(c){return !c.sugestao;});
    var totalLeads=0;
    cs.forEach(function(c){totalLeads+=leadsDa(c).length;});
    var ativas=cs.filter(function(c){return c.status==='EM EXECUÇÃO';}).length;
    var h='<div class="op-kpis">'+
      '<button class="op-kpi"><b>'+cs.length+'</b><span>Campanhas</span></button>'+
      '<button class="op-kpi is-ok"><b>'+ativas+'</b><span>Ativas</span></button>'+
      '<button class="op-kpi"><b>'+num(totalLeads)+'</b><span>Leads no público</span></button>'+
      '</div>';
    h+='<div class="op-bar">'+
      '<button class="btn primary sm" data-new-campaign>＋ Nova campanha</button>'+
      '<button class="btn sm" data-goto-view="fila">→ Ver Fila em andamento</button>'+
      '</div>';
    h+='<div class="op-head"><h2>Campanhas</h2><span class="sub">Clique numa campanha para ver público, canal, cadência, leads e mensagem</span></div>';
    h+=cs.length?cs.map(cardHTML).join(''):'<div class="op-empty">Nenhuma campanha criada.</div>';
    return h;
  }

  function aplicar(){
    if(typeof VIEWS==='undefined'){setTimeout(aplicar,200);return;}
    VIEWS.disparos=viewDisparos;
    if(typeof TITLES!=='undefined')TITLES.disparos=['Gerenciar Disparos','Crie, edite, e clique numa campanha para ver público, cadência e leads.'];
    if(typeof render==='function')setTimeout(render,50);
  }
  aplicar();

  document.addEventListener('click',function(ev){
    var el;
    el=ev.target.closest('[data-disp-expand]');
    if(el){ev.preventDefault();ev.stopPropagation();
      var id=el.dataset.dispExpand;
      state.campaignExpanded=state.campaignExpanded||{};
      state.campaignExpanded[id]=!state.campaignExpanded[id];
      if(typeof render==='function')render();
      return;
    }
    el=ev.target.closest('[data-disp-lead]');
    if(el){ev.preventDefault();ev.stopPropagation();
      var parts=el.dataset.dispLead.split('|');
      var camp=(state.campaigns||[]).filter(function(c){return c.id===parts[0];})[0];
      if(!camp)return;
      var leads=leadsDa(camp);
      var lead=leads[parseInt(parts[1],10)];
      if(lead)modalLead(camp,lead,parseInt(parts[1],10));
      return;
    }
  },true);
})();
