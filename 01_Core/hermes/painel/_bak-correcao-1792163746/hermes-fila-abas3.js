(function(){
  if(window.__filaAbas3) return; window.__filaAbas3=true;

  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  function sod(d){var x=new Date(d);x.setHours(0,0,0,0);return x;}
  function hoje(){return sod(new Date());}

  var GAP_NOVO = 10*60*1000;
  var GAP_BASE =  4*60*1000;

  if(!state.__filaMotor) state.__filaMotor = {ativo:false, proximoEm:0, enviados:0, erros:0, log:[]};
  var MOT = state.__filaMotor;

  function todos(){ return state.actions||[]; }
  function pendentesStatus(a){
    return /AGENDADO|PENDENTE|agendado|pendente|EM_ABERTO|PRONTO/i.test(String(a.status||''));
  }
  function concluida(a){
    return /CONCLUIDO|CONCLUÍDO|ENVIADO|CANCELADO|FALHA|ERRO/i.test(String(a.status||''));
  }
  function pausada(a){ return /PAUSAD/i.test(String(a.status||'')); }
  function deHojeEmDiante(){
    var h=hoje().getTime();
    return todos().filter(function(a){
      if(!pendentesStatus(a) && !pausada(a)) return false;
      var p=a.prazo?new Date(a.prazo):null;
      return p && sod(p).getTime() >= h;
    });
  }
  function historicoCompleto(){
    var h=hoje().getTime();
    return todos().filter(function(a){
      if(concluida(a)) return true;
      if(pendentesStatus(a) || pausada(a)){
        var p=a.prazo?new Date(a.prazo):null;
        if(p && sod(p).getTime() < h) return true;
      }
      return false;
    });
  }
  function agrupar(lista){
    var g={};
    lista.forEach(function(a){
      var d=a.prazo?sod(new Date(a.prazo)):hoje();
      (g[d.getTime()]=g[d.getTime()]||[]).push(a);
    });
    return Object.keys(g).sort(function(x,y){return x-y;}).map(function(k){
      return {dia:new Date(parseInt(k,10)), itens:g[k]};
    });
  }
  function lead(a){
    return (state.opportunities||[]).filter(function(o){return o.id===a.opportunity_id;})[0]||{};
  }
  function isNovo(a,l){
    if(a.etapa && !/^(D0|INICIAL|PRIMEIRO)/i.test(a.etapa)) return false;
    if(l){
      if(l.tentativas && l.tentativas>0) return false;
      if(l.ultimo_contato) return false;
    }
    if(a.historico && a.historico.length) return false;
    return true;
  }
  function resolverVars(txt,l){
    if(!txt) return '';
    var primeiro = (l.contato||l.nome||'').split(' ')[0] || 'tudo bem';
    return txt
      .replace(/\{contato\}/g, primeiro)
      .replace(/\{empresa\}/g, l.empresa||l.nome||'sua empresa')
      .replace(/\{segmento\}/g, l.segmento||'seu setor');
  }
  function persistir(){
    try{
      if(typeof loadUserStore==='function' && typeof saveUserStore==='function'){
        var s=loadUserStore(); s.acoes=state.actions; saveUserStore(s);
      }
    }catch(e){}
    try{
      var k='hermes-os.v7.user';
      var s=JSON.parse(localStorage.getItem(k)||'{}');
      s.acoes=state.actions;
      localStorage.setItem(k,JSON.stringify(s));
    }catch(e){}
  }

  async function enviar(a){
    var l = lead(a);
    var novo = isNovo(a,l);
    var tel = l.whatsapp||l.telefone||a.telefone||'';
    var body = {
      opportunity_id: a.opportunity_id,
      canal: a.canal||'whatsapp',
      mensagem: resolverVars(a.acao||a.mensagem||'', l),
      contato: a.contato||l.contato||'',
      empresa: a.empresa||l.empresa||'',
      telefone: tel,
      etapa: a.etapa||null,
      historico: a.historico||[],
      autonomo: !novo
    };
    var r = await fetch('http://127.0.0.1:8420/api/disparar',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer hk_dev_local_troque_depois'},
      body: JSON.stringify(body)
    });
    if(!r.ok) throw new Error('HTTP '+r.status);
    return await r.json().catch(function(){return{};});
  }
  async function loop(){
    if(!MOT.ativo) return;
    var agora=Date.now();
    if(agora < MOT.proximoEm){ setTimeout(loop, Math.min(4000, MOT.proximoEm-agora)); return; }
    var ps = deHojeEmDiante().filter(pendentesStatus);
    if(!ps.length){
      MOT.ativo=false;
      MOT.log.unshift({t:Date.now(), msg:'Fila vazia. Parando.'});
      if(typeof render==='function') render();
      return;
    }
    ps.sort(function(a,b){
      var pa=a.prioridade_fila||99, pb=b.prioridade_fila||99;
      if(pa!==pb) return pa-pb;
      return new Date(a.prazo||0) - new Date(b.prazo||0);
    });
    var a = ps[0];
    var l = lead(a);
    var novo = isNovo(a,l);
    try{
      var res = await enviar(a);
      MOT.enviados++;
      MOT.log.unshift({t:Date.now(), msg:'✓ '+((a.empresa||l.empresa||a.opportunity_id)+'').slice(0,40)+' ['+(novo?'novo':'base')+']'});
      a.status='CONCLUIDO';
      a.enviadoEm=new Date().toISOString();
      a.tentativas=(a.tentativas||0)+1;
      if(l){ l.tentativas=(l.tentativas||0)+1; l.ultimo_contato=a.enviadoEm; }
      if(res && res.resposta_autonoma) MOT.log.unshift({t:Date.now(),msg:'↩ IA: '+String(res.resposta_autonoma).slice(0,60)});
      persistir();
    }catch(e){
      MOT.erros++;
      MOT.log.unshift({t:Date.now(), msg:'✗ '+((a.empresa||a.opportunity_id)+'').slice(0,40)+' — '+e.message});
      MOT.proximoEm = Date.now()+30000;
      if(typeof render==='function') render();
      setTimeout(loop, 30000);
      return;
    }
    var gap = novo ? GAP_NOVO : GAP_BASE;
    MOT.proximoEm = Date.now()+gap;
    MOT.log = MOT.log.slice(0,12);
    if(typeof render==='function') render();
    setTimeout(loop, gap);
  }
  function ativar(){
    if(MOT.ativo) return;
    MOT.ativo=true; MOT.proximoEm=Date.now();
    MOT.log.unshift({t:Date.now(),msg:'▶ Iniciado · 10min 1º / 4min seguintes'});
    loop();
    if(typeof render==='function') render();
  }
  function pausarMotor(){
    MOT.ativo=false;
    MOT.log.unshift({t:Date.now(),msg:'⏸ Pausado'});
    if(typeof render==='function') render();
  }
  function restante(){
    if(!MOT.ativo) return '';
    var ms=MOT.proximoEm-Date.now();
    if(ms<=0) return 'enviando…';
    var s=Math.ceil(ms/1000), m=Math.floor(s/60); s%=60;
    return m+'m'+String(s).padStart(2,'0')+'s';
  }

  /* ---------- card ---------- */
  function cardAcao(a){
    var l=lead(a);
    var nome=a.empresa||l.empresa||'—';
    var contato=a.contato||l.contato||'';
    var canal=String(a.canal||'whatsapp').toLowerCase();
    var hora=a.prazo?new Date(a.prazo).toTimeString().slice(0,5):'';
    var badge=canal==='email'?'E-mail':canal==='linkedin'?'LinkedIn':'WhatsApp';
    var cor=canal==='email'?'var(--info)':canal==='linkedin'?'#60a5fa':'var(--ok)';
    var isHist=concluida(a);
    var isAtraso=!isHist && pendentesStatus(a) && a.prazo && sod(new Date(a.prazo)).getTime()<hoje().getTime();
    var isPaus=pausada(a);
    var corBorda = isAtraso ? 'var(--urgent)' : isPaus ? 'var(--muted)' : cor;
    var etiq = isAtraso?'ATRASADO':isPaus?'PAUSADO':badge;

    /* ---- etiqueta NOVO / BASE ---- */
    var novoLead = isNovo(a, l);
    var tagBadge = '';
    if(!isHist && !isPaus){
      tagBadge = novoLead
        ? '<span style="display:inline-flex;align-items:center;font:800 8.5px Manrope;'+
          'letter-spacing:.08em;text-transform:uppercase;color:#22c55e;'+
          'background:rgba(34,197,94,.13);border:1px solid rgba(34,197,94,.4);'+
          'border-radius:999px;padding:1px 7px;margin-left:6px;line-height:1.5;flex-shrink:0">novo</span>'
        : '<span style="display:inline-flex;align-items:center;font:800 8.5px Manrope;'+
          'letter-spacing:.08em;text-transform:uppercase;color:#f59e0b;'+
          'background:rgba(245,158,11,.13);border:1px solid rgba(245,158,11,.4);'+
          'border-radius:999px;padding:1px 7px;margin-left:6px;line-height:1.5;flex-shrink:0">base</span>';
    }

    var btnStyle='background:transparent;border:1px solid var(--line);color:var(--muted);'+
      'padding:2px 8px;border-radius:6px;font:600 10px Manrope;cursor:pointer;line-height:1.6';

    var botoes='';
    if(pendentesStatus(a)) botoes+='<button style="'+btnStyle+'" data-fl-act="pause|'+E(a.id)+'">⏸ Pausar</button>';
    if(isPaus) botoes+='<button style="'+btnStyle+'" data-fl-act="resume|'+E(a.id)+'">▶ Reativar</button>';
    botoes+='<button style="'+btnStyle+'" data-fl-act="del|'+E(a.id)+'" '+
            'onmouseover="this.style.color=\'var(--urgent)\';this.style.borderColor=\'var(--urgent)\'" '+
            'onmouseout="this.style.color=\'var(--muted)\';this.style.borderColor=\'var(--line)\'">✕ Excluir</button>';

    return '<div class="card" data-fl-card="'+E(a.id)+'" style="padding:10px 12px;margin-bottom:6px;'+
      'border-left:3px solid '+corBorda+';opacity:'+(isHist?'.72':'1')+';cursor:pointer">'+
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">'+
        '<div style="min-width:0;flex:1">'+
          '<div style="display:flex;align-items:center;min-width:0">'+
            '<span style="font:600 12.5px Manrope;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+E(nome)+'</span>'+
            tagBadge+
          '</div>'+
          (contato?'<div class="sub" style="font-size:10.5px;margin-top:1px">'+E(contato)+'</div>':'')+
        '</div>'+
        '<div style="text-align:right;flex-shrink:0">'+
          '<div style="font:700 10px Manrope;color:'+(isAtraso?'var(--urgent)':isPaus?'var(--muted)':cor)+';letter-spacing:.04em">'+etiq+'</div>'+
          (hora?'<div class="sub" style="font-size:10.5px">'+hora+'</div>':'')+
        '</div>'+
      '</div>'+
      (a.acao?'<div class="sub" style="font-size:10.5px;margin-top:6px;line-height:1.4">'+E(String(a.acao).slice(0,110))+'</div>':'')+
      '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap" onclick="event.stopPropagation()">'+botoes+'</div>'+
    '</div>';
  }

  function blocoCampanhasAtivas(){
    var cs=(state.campaigns||[]).filter(function(c){
      var s=String(c.status||'').toUpperCase();
      return s.indexOf('EXECU')>=0||s==='ATIVA'||s==='ATIVO';
    });
    if(!cs.length) return '<div class="op-empty">Nenhuma campanha ativa.</div>';
    var h='<div style="display:grid;gap:10px">';
    cs.forEach(function(c){
      var as=(state.actions||[]).filter(function(a){return a.campaign_id===c.id;});
      var env=as.filter(function(a){return /CONCLU|ENVIADO/i.test(String(a.status||''));}).length;
      var pend=as.filter(pendentesStatus).length;
      var err=as.filter(function(a){return /ERRO|FALHA/i.test(String(a.status||''));}).length;
      var tot=as.length, pct=tot?Math.round(env*100/tot):0;
      h+='<div class="card" style="padding:12px;border-left:3px solid var(--accent)">'+
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">'+
          '<div style="min-width:0"><div style="font:700 13px Manrope;color:var(--txt)">'+E(c.nome||c.id)+'</div>'+
          '<div class="sub" style="font-size:10.5px;margin-top:2px">'+E(c.canal||'whatsapp')+' · '+tot+' ações</div></div>'+
          '<div style="text-align:right"><div style="font:700 20px Manrope;color:var(--accent)">'+pct+'%</div>'+
          '<div class="sub" style="font-size:10px">'+env+'/'+tot+'</div></div>'+
        '</div>'+
        '<div class="progress" style="margin-top:8px"><i style="width:'+pct+'%"></i></div>'+
      '</div>';
    });
    return h+'</div>';
  }

  function abrirModal(a){
    var l=lead(a);
    var canal=String(a.canal||'whatsapp');
    var msg=resolverVars(a.acao||a.mensagem||'', l);
    var tel=l.whatsapp||l.telefone||'';
    var camp=(state.campaigns||[]).filter(function(c){return c.id===a.campaign_id;})[0]||{};

    var campos=[
      ['Lead',        l.nome||l.empresa||'—'],
      ['Contato',     a.contato||l.contato||'—'],
      ['Empresa',     a.empresa||l.empresa||'—'],
      ['Telefone',    tel||'—'],
      ['Email',       l.email||'—'],
      ['Segmento',    l.segmento||'—'],
      ['Cargo',       l.cargo||l.papel||'—'],
      ['Canal',       canal],
      ['Etapa',       a.etapa||'—'],
      ['Campanha',    camp.nome||a.campaign_id||'—'],
      ['Prazo',       a.prazo?new Date(a.prazo).toLocaleString('pt-BR'):'—'],
      ['Status',      a.status||'—'],
      ['Prioridade',  a.prioridade||'—'],
      ['Tentativas',  String(a.tentativas||0)],
      ['Enviado em',  a.enviadoEm?new Date(a.enviadoEm).toLocaleString('pt-BR'):'—']
    ];

    var filtrosAtivos={};
    try{ filtrosAtivos = state.filters||{}; }catch(e){}

    var html='';
    html+='<div class="lm-head"><div><h3 class="lm-title">'+E(l.nome||l.empresa||'Detalhes')+'</h3>';
    html+='<div class="lm-sub">'+E(canal)+' · '+E(a.etapa||'—')+' · prazo '+E(a.prazo?new Date(a.prazo).toLocaleString('pt-BR'):'—')+'</div></div>';
    html+='<button class="lm-x" data-lm-close="1">✕</button></div>';
    html+='<div class="lm-body">';

    html+='<div style="margin-bottom:16px">';
    html+='<div style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Mensagem</div>';
    html+='<div style="background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:10px;padding:12px;font-size:12.5px;line-height:1.55;white-space:pre-wrap">'+E(msg)+'</div>';
    html+='</div>';

    html+='<div style="margin-bottom:16px">';
    html+='<div style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Filtros aplicados</div>';
    var temFiltro=false, fh='<div style="display:flex;gap:6px;flex-wrap:wrap">';
    Object.keys(filtrosAtivos).forEach(function(k){
      var v=filtrosAtivos[k];
      if(!v || v==='all') return;
      temFiltro=true;
      fh+='<span style="padding:2px 10px;border:1px solid var(--line);border-radius:999px;font:600 10.5px Manrope;color:var(--muted)">'+E(k)+': '+E(v)+'</span>';
    });
    fh+='</div>';
    html+=temFiltro?fh:'<div class="sub" style="font-size:11px">Nenhum filtro ativo.</div>';
    html+='</div>';

    html+='<div style="margin-bottom:16px">';
    html+='<div style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Dados</div>';
    html+='<div style="display:grid;grid-template-columns:120px 1fr;gap:4px 12px;font-size:12px">';
    campos.forEach(function(c){
      html+='<div class="sub">'+E(c[0])+'</div><div>'+E(c[1])+'</div>';
    });
    html+='</div></div>';

    html+='<div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--line)">';
    if(pendentesStatus(a)) html+='<button class="lm-act" data-lm-act="pause|'+E(a.id)+'">⏸ Pausar</button>';
    if(pausada(a)) html+='<button class="lm-act" data-lm-act="resume|'+E(a.id)+'">▶ Reativar</button>';
    html+='<button class="lm-act danger" data-lm-act="del|'+E(a.id)+'">✕ Excluir</button>';
    html+='</div>';
    html+='</div>';

    if(!document.getElementById('lm-css')){
      var s='.lm-back{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(3px)}'+
        '.lm-box{background:#12171e;color:#f2f4f6;width:min(760px,100%);max-height:88vh;border-radius:14px;border:1px solid #2a3441;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.55);font-family:Manrope,sans-serif}'+
        '.lm-head{padding:16px 20px;border-bottom:1px solid #2a3441;display:flex;gap:12px;align-items:flex-start}'+
        '.lm-title{font:700 16px Manrope;margin:0}'+
        '.lm-sub{font-size:11.5px;color:#8b93a1;margin-top:3px}'+
        '.lm-x{margin-left:auto;background:transparent;border:1px solid #2a3441;color:#8b93a1;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:15px;line-height:1}'+
        '.lm-body{flex:1;overflow:auto;padding:16px 20px}'+
        '.lm-act{padding:6px 14px;border:1px solid #2a3441;background:transparent;color:#f2f4f6;border-radius:8px;font:600 11.5px Manrope;cursor:pointer}'+
        '.lm-act:hover{background:rgba(255,255,255,.05)}'+
        '.lm-act.danger{color:#ef4444;border-color:#ef4444}'+
        '.lm-act.danger:hover{background:rgba(239,68,68,.1)}';
      var st=document.createElement('style'); st.id='lm-css'; st.textContent=s;
      document.head.appendChild(st);
    }

    var back=document.createElement('div');
    back.className='lm-back';
    back.innerHTML='<div class="lm-box">'+html+'</div>';
    document.body.appendChild(back);

    back.addEventListener('click', function(ev){
      if(ev.target===back || ev.target.closest('[data-lm-close]')){ ev.preventDefault(); back.remove(); return; }
      var b=ev.target.closest('[data-lm-act]');
      if(b){
        ev.preventDefault();
        var p=b.getAttribute('data-lm-act').split('|');
        executarAcao(p[0], p[1]);
        back.remove();
      }
    });
  }

  function executarAcao(acao, id){
    var a=(state.actions||[]).filter(function(x){return x.id===id;})[0];
    if(!a) return;
    if(acao==='pause'){
      a.status='PAUSADO';
      MOT.log.unshift({t:Date.now(),msg:'⏸ '+((a.empresa||a.opportunity_id)+'').slice(0,40)+' pausado'});
    } else if(acao==='resume'){
      a.status='AGENDADO';
      MOT.log.unshift({t:Date.now(),msg:'▶ '+((a.empresa||a.opportunity_id)+'').slice(0,40)+' reativado'});
    } else if(acao==='del'){
      state.actions = state.actions.filter(function(x){return x.id!==id;});
      MOT.log.unshift({t:Date.now(),msg:'✕ removido da fila'});
    }
    persistir();
    if(typeof render==='function') render();
  }

  function viewFila(){
    var aba=state.__filaAba||'hoje';
    var h='<div style="display:flex;gap:4px;align-items:center;border-bottom:1px solid var(--line);margin-bottom:14px">';
    [['hoje','Hoje em diante'],['campanhas','Campanhas ativas'],['historico','Histórico']].forEach(function(t){
      var on=aba===t[0];
      h+='<button data-fila3-aba="'+t[0]+'" style="padding:8px 14px;background:transparent;border:none;'+
         'border-bottom:2px solid '+(on?'var(--accent)':'transparent')+';'+
         'color:'+(on?'var(--txt)':'var(--muted)')+';font:700 11.5px Manrope;letter-spacing:.03em;cursor:pointer">'+
         t[1]+'</button>';
    });
    var cor = MOT.ativo ? '#f59e0b' : '#22c55e';
    h+='<div style="margin-left:auto;display:flex;align-items:center;gap:10px;padding-bottom:6px">';
    h+='<button data-fila-motor="'+(MOT.ativo?'pausar':'ativar')+'" style="'+
       'padding:6px 14px;border-radius:999px;border:1px solid '+cor+';'+
       'background:color-mix(in srgb,'+cor+' 14%,transparent);color:'+cor+';'+
       'font:700 11.5px Manrope,sans-serif;cursor:pointer;letter-spacing:.03em">'+
       (MOT.ativo?'⏸ Pausar fila':'▶ Ativar fila')+'</button>';
    if(MOT.ativo) h+='<span style="font:600 11px Manrope;color:var(--muted)">próximo em '+restante()+'</span>';
    h+='<span style="font:600 11px Manrope;color:var(--muted)">✓ '+MOT.enviados+' · ✗ '+MOT.erros+'</span>';
    h+='</div>';
    h+='</div>';

    if(MOT.log.length){
      h+='<div style="margin-bottom:12px;padding:8px 12px;background:rgba(255,255,255,.02);'+
         'border:1px solid var(--line);border-radius:8px;font:11px ui-monospace,Menlo,monospace;'+
         'color:var(--muted);line-height:1.55;max-height:90px;overflow:auto">';
      MOT.log.slice(0,5).forEach(function(l){
        var hh=new Date(l.t).toTimeString().slice(0,5);
        h+='<div>'+hh+' · '+E(l.msg)+'</div>';
      });
      h+='</div>';
    }

    if(aba==='hoje'){
      var lista=deHojeEmDiante();
      if(!lista.length){ h+='<div class="op-empty">Nada agendado de hoje em diante.</div>'; return h; }
      agrupar(lista).forEach(function(g){
        var label=g.dia.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
        var isHoje=sod(g.dia).getTime()===hoje().getTime();
        h+='<div style="margin-bottom:16px">'+
             '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
               '<span style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:'+
               (isHoje?'var(--accent)':'var(--muted)')+'">'+(isHoje?'Hoje':label)+'</span>'+
               '<span class="sub" style="font-size:10.5px">'+g.itens.length+'</span>'+
             '</div>';
        g.itens.slice(0,50).forEach(function(a){ h+=cardAcao(a); });
        if(g.itens.length>50) h+='<div class="sub" style="font-size:10.5px;padding:4px 0">+ '+(g.itens.length-50)+' mais</div>';
        h+='</div>';
      });
    } else if(aba==='campanhas'){
      h+=blocoCampanhasAtivas();
    } else if(aba==='historico'){
      var hist=historicoCompleto();
      if(!hist.length){ h+='<div class="op-empty">Nada no histórico ainda.</div>'; return h; }
      var porDia={};
      hist.forEach(function(a){
        var d=a.prazo?sod(new Date(a.prazo)):(a.enviadoEm?sod(new Date(a.enviadoEm)):hoje());
        (porDia[d.getTime()]=porDia[d.getTime()]||[]).push(a);
      });
      Object.keys(porDia).sort(function(x,y){return y-x;}).forEach(function(k){
        var dia=new Date(parseInt(k,10));
        var label=dia.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
        var itens=porDia[k];
        h+='<div style="margin-bottom:16px">'+
             '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
               '<span style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)">'+label+'</span>'+
               '<span class="sub" style="font-size:10.5px">'+itens.length+'</span>'+
             '</div>';
        itens.slice(0,50).forEach(function(a){ h+=cardAcao(a); });
        if(itens.length>50) h+='<div class="sub" style="font-size:10.5px;padding:4px 0">+ '+(itens.length-50)+' mais</div>';
        h+='</div>';
      });
    }
    return h;
  }

  function aplicar(){
    if(typeof VIEWS==='undefined'){setTimeout(aplicar,200);return;}
    VIEWS.fila=viewFila;
    if(typeof TITLES!=='undefined') TITLES.fila=['Fila','Hoje em diante, campanhas ativas e histórico.'];
    if(typeof render==='function') setTimeout(render,60);
  }
  aplicar();

  document.addEventListener('click', function(ev){
    var el=ev.target.closest('[data-fila3-aba]');
    if(el){ ev.preventDefault(); ev.stopPropagation(); state.__filaAba=el.getAttribute('data-fila3-aba'); if(typeof render==='function') render(); return; }

    el=ev.target.closest('[data-fila-motor]');
    if(el){ ev.preventDefault(); ev.stopPropagation();
      if(el.getAttribute('data-fila-motor')==='ativar') ativar(); else pausarMotor();
      return;
    }

    el=ev.target.closest('[data-fl-act]');
    if(el){ ev.preventDefault(); ev.stopPropagation();
      var p=el.getAttribute('data-fl-act').split('|');
      executarAcao(p[0], p[1]); return;
    }

    el=ev.target.closest('[data-fl-card]');
    if(el){
      ev.preventDefault(); ev.stopPropagation();
      var a=(state.actions||[]).filter(function(x){return x.id===el.getAttribute('data-fl-card');})[0];
      if(a) abrirModal(a);
      return;
    }
  }, true);

  setInterval(function(){ if(MOT.ativo && typeof render==='function') render(); }, 1000);
})();
