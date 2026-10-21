(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function num(v){return (typeof fmtNum==='function')?fmtNum(v):String(v);}
  function bd(t,tone){return '<span class="badge '+(tone||'')+'">'+esc(t)+'</span>';}
  function hj(){return new Date().toISOString().slice(0,10);}

  if(!state.filaAba) state.filaAba = 'fila';
  if(!state.diasExp) state.diasExp = {};

  function rotulo(iso){
    if(!iso) return '(sem data)';
    var d = new Date(iso+'T12:00:00'); if(isNaN(d.getTime())) return iso;
    var hh = new Date(); hh.setHours(12,0,0,0);
    var diff = Math.round((d-hh)/86400000);
    var ds = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
    if(diff===0) return 'Hoje · '+ds[d.getDay()];
    if(diff===1) return 'Amanhã · '+ds[d.getDay()];
    if(diff>1 && diff<7) return ds[d.getDay()].charAt(0).toUpperCase()+ds[d.getDay()].slice(1);
    return String(iso).slice(8,10)+'/'+String(iso).slice(5,7)+' · '+ds[d.getDay()];
  }

  function hist(){
    var env = (state.actions||[]).filter(function(a){return ['ENVIADO','RESPONDIDO','CONCLUÍDO','CANCELADO'].indexOf(a.status)>=0;});
    env.sort(function(a,b){ return String(b.enviado_em||b.prazo||'').localeCompare(String(a.enviado_em||a.prazo||'')); });
    if(!env.length) return '<div class="op-empty">Nenhum envio registrado.</div>';
    var h = '<div class="op-list">';
    env.slice(0,40).forEach(function(a){
      var o = (typeof oppOf==='function') ? (oppOf(a.opportunity_id)||{}) : {};
      var camp = a.campaign_id ? ((state.campaigns||[]).filter(function(c){return c.id===a.campaign_id;})[0]||null) : null;
      var tone = a.status==='RESPONDIDO'?'ok':a.status==='ENVIADO'?'info':'';
      h += '<div class="op-row"><div><span class="badge '+tone+'">'+esc(a.status)+'</span></div><div style="min-width:0"><div class="t">'+esc(o.empresa||a.contato||'—')+'<small>'+esc(a.canal||'')+' · '+esc(a.etapa||'')+'</small></div><div class="d">'+esc(camp?camp.id:'')+' · '+esc(String(a.enviado_em||a.prazo||'').slice(0,16).replace('T',' '))+'</div></div><div class="acts"><span class="sub" style="font-size:10.5px">'+esc(a.enviado_para||'—')+'</span></div></div>';
    });
    h += '</div>';
    return h;
  }

  /* ============ ABA 1 · FILA (por dia, com dropdown por campanha) ============ */
  function viewFilaDias(){
    var acts = (state.actions||[]).filter(function(a){ return ['PRONTO','AGENDADO','EXECUTANDO','ERRO','BLOQUEADO'].indexOf(a.status)>=0; });
    var f = state.filtersFila || {};
    if(f.status && f.status !== 'all') acts = acts.filter(function(a){ return a.status === f.status; });
    if(f.canal && f.canal !== 'all') acts = acts.filter(function(a){ return a.canal === f.canal; });
    if(f.etapa && f.etapa !== 'all') acts = acts.filter(function(a){ return a.etapa === f.etapa; });
    if(f.campanha && f.campanha !== 'all') acts = acts.filter(function(a){ return String(a.campaign_id) === String(f.campanha); });

    var hoje = hj();
    var am = new Date(); am.setDate(am.getDate()+1); var aman = am.toISOString().slice(0,10);
    var fim = new Date(); fim.setDate(fim.getDate()+7); var fims = fim.toISOString().slice(0,10);
    if(f.quando === 'hoje') acts = acts.filter(function(a){ return String(a.prazo||'').slice(0,10) === hoje; });
    if(f.quando === 'amanha') acts = acts.filter(function(a){ return String(a.prazo||'').slice(0,10) === aman; });
    if(f.quando === 'atrasadas') acts = acts.filter(function(a){ return String(a.prazo||'').slice(0,10) < hoje; });
    if(f.quando === 'semana') acts = acts.filter(function(a){ var d = String(a.prazo||'').slice(0,10); return d >= hoje && d <= fims; });

    /* Agrupa por dia, depois por campanha */
    var porDia = {}, ordem = [];
    acts.forEach(function(a){
      var d = String(a.prazo||'').slice(0,10) || 'sem_data';
      if(!porDia[d]){ porDia[d] = {}; ordem.push(d); }
      var cid = a.campaign_id || 'sem_campanha';
      if(!porDia[d][cid]) porDia[d][cid] = [];
      porDia[d][cid].push(a);
    });
    ordem.sort();

    if(!ordem.length){
      return '<div class="op-list"><div class="op-empty">Fila vazia com esses filtros.</div></div>' + histBlock();
    }

    var h = '';
    ordem.forEach(function(dia){
      var campanhas = porDia[dia];
      var cids = Object.keys(campanhas).sort();
      var totalDia = cids.reduce(function(n,k){ return n + campanhas[k].length; }, 0);
      var cor = dia < hoje ? 'var(--urgent)' : dia === hoje ? 'var(--accent)' : 'var(--info)';
      var aberto = !!state.diasExp[dia];

      h += '<div class="fdia">';
      /* Cabeçalho do dia (clicável) */
      h += '<div class="fdia-head" data-fdia-toggle="'+esc(dia)+'">';
      h += '<span class="fdia-chev">'+(aberto?'▾':'▸')+'</span>';
      h += '<span class="dot" style="background:'+cor+'"></span>';
      h += '<span class="fdia-titulo">'+esc(rotulo(dia))+'</span>';
      h += '<span class="fdia-sub">'+cids.length+' campanha(s) · '+totalDia+' ação(ões)</span>';
      h += '<span class="fdia-sp"></span>';
      h += '<span class="fdia-count" style="color:'+cor+'">'+totalDia+'</span>';
      h += '</div>';

      /* Corpo expandido: cards por campanha */
      if(aberto){
        h += '<div class="fdia-body">';
        cids.forEach(function(cid){
          var lista = campanhas[cid];
          var camp = cid === 'sem_campanha' ? null : ((state.campaigns||[]).filter(function(c){return c.id===cid;})[0]||null);
          var titulo = camp ? (cid + ' · ' + camp.nome) : '(sem campanha)';
          var tone = camp && camp.status === 'EM EXECUÇÃO' ? 'ok' : camp && camp.status === 'PAUSADA' ? 'warn' : 'info';
          h += '<div class="fdia-camp">';
          h += '<div class="fdia-camp-head">';
          h += '<span style="font-family:var(--font-display);font-size:12px;font-weight:700;color:var(--accent)">'+esc(titulo)+'</span>';
          if(camp) h += bd(camp.status, tone);
          h += '<span class="sub" style="font-size:10.5px;margin-left:auto">'+lista.length+' ação(ões)</span>';
          h += '</div>';
          h += '<div class="op-list" style="margin-top:6px">';
          lista.slice(0,30).forEach(function(a){
            var o = (typeof oppOf==='function') ? (oppOf(a.opportunity_id)||{}) : {};
            var pode = a.canal === 'WhatsApp' && ['PRONTO','AGENDADO','ERRO','BLOQUEADO'].indexOf(a.status) >= 0;
            var tr = a.status==='ERRO'?'t-urgent':a.status==='BLOQUEADO'?'t-warn':'';
            var stTone = a.status==='ERRO'?'hot':a.status==='BLOQUEADO'?'warm':a.status==='EXECUTANDO'?'info':'';
            h += '<div class="op-row '+tr+'" style="padding:7px 10px"><div><span class="badge '+stTone+'">'+esc(a.status)+'</span></div>';
            h += '<div style="min-width:0"><div class="t" style="font-size:12px">'+esc(o.empresa||a.contato||'—')+'<small>'+esc(a.canal||'')+'</small></div>';
            h += '<div class="d" style="font-size:10.5px">'+esc(String(a.prazo||'').slice(11,16)||'—')+' · '+esc(a.acao||'').slice(0,60)+'</div></div>';
            h += '<div class="acts">';
            if(pode) h += '<button class="btn sm primary" data-act-send="'+esc(a.id)+'">Enviar</button>';
            h += '<button class="btn sm ghost" data-edit-action="'+esc(a.id)+'">✎</button>';
            h += '</div></div>';
          });
          if(lista.length > 30) h += '<div class="op-empty" style="padding:6px">+ '+(lista.length-30)+' além destes</div>';
          h += '</div></div>';
        });
        h += '</div>';
      }
      h += '</div>';
    });

    return h + histBlock();
  }
  function histBlock(){
    return '<div class="op-head" style="margin-top:22px"><h2>Histórico</h2><span class="sub">Disparos já feitos</span></div>' + hist();
  }

  /* ============ ABA 2 · CAMPANHAS (Gantt) ============ */
  function viewFilaGantt(){
    var cs = (state.campaigns||[]).filter(function(c){ return !c.sugestao; });
    if(!cs.length) return '<div class="op-empty">Nenhuma campanha criada.</div>';

    /* Descobre janela: min(inicio) → max(fim), ou próximos 30 dias */
    var hoje = new Date(); hoje.setHours(0,0,0,0);
    var min = hoje.getTime();
    var max = hoje.getTime() + 29*86400000;
    cs.forEach(function(c){
      if(c.inicio){ var t = new Date(c.inicio).getTime(); if(!isNaN(t) && t < min) min = t; }
      if(c.fim){ var t2 = new Date(c.fim).getTime(); if(!isNaN(t2) && t2 > max) max = t2; }
    });
    /* Garante pelo menos 21 dias visíveis */
    if(max - min < 20*86400000) max = min + 20*86400000;

    var dias = [];
    for(var t = min; t <= max; t += 86400000) dias.push(new Date(t));
    var nDias = dias.length;

    /* Rótulos dos meses */
    var meses = {};
    dias.forEach(function(d){ var k = d.getMonth()+'-'+d.getFullYear(); meses[k] = (meses[k]||0)+1; });

    var h = '<div class="gantt-wrap">';
    /* Cabeçalho com meses */
    h += '<div class="gantt-head">';
    h += '<div class="gantt-corner"></div>';
    var mesAtual = '';
    dias.forEach(function(d){
      var nome = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][d.getMonth()];
      var k = d.getMonth()+'-'+d.getFullYear();
      if(nome !== mesAtual){
        mesAtual = nome;
        h += '<div class="gantt-mes" style="grid-column:span '+meses[k]+'">'+nome+'</div>';
      }
    });
    h += '</div>';
    /* Cabeçalho com dias */
    h += '<div class="gantt-head-dias">';
    h += '<div class="gantt-corner"></div>';
    dias.forEach(function(d){
      var iso = d.toISOString().slice(0,10);
      var eh = iso === hj();
      var fds = d.getDay() === 0 || d.getDay() === 6;
      h += '<div class="gantt-dia'+(eh?' hoje':'')+(fds?' fds':'')+'">'+String(d.getDate()).padStart(2,'0')+'</div>';
    });
    h += '</div>';

    /* Linhas por campanha */
    cs.forEach(function(c){
      var inicio = c.inicio ? new Date(c.inicio).getTime() : (c.criadaEm ? new Date(c.criadaEm).getTime() : min);
      var fim = c.fim ? new Date(c.fim).getTime() : inicio + 6*86400000;
      if(fim < inicio) fim = inicio + 86400000;
      var cor = c.cor || (c.status === 'EM EXECUÇÃO' ? '#4ade80' : '#60a5fa');

      h += '<div class="gantt-row">';
      h += '<div class="gantt-nome" title="'+esc(c.nome)+'">';
      h += '<span style="font-family:var(--font-display);font-size:11px;font-weight:700;color:var(--accent)">'+esc(c.id)+'</span>';
      h += '<span class="gantt-nome-txt">'+esc(c.nome)+'</span>';
      h += '</div>';
      dias.forEach(function(d){
        var t = d.getTime();
        var dentro = t >= inicio && t <= fim;
        var primeiro = t === inicio || (dias.indexOf(d) === 0 && inicio < min);
        var ultimo = t === fim || (dias.indexOf(d) === nDias-1 && fim > max);
        var cls = 'gantt-cell';
        if(dentro) cls += ' on';
        if(primeiro) cls += ' first';
        if(ultimo) cls += ' last';
        h += '<div class="'+cls+'" style="'+(dentro?'--c:'+cor:'')+'"></div>';
      });
      h += '</div>';
    });
    h += '</div>';

    /* Legenda */
    h += '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:14px;font-size:11px;color:var(--muted)">';
    h += '<span><span style="display:inline-block;width:10px;height:10px;background:var(--ok);border-radius:2px;vertical-align:middle;margin-right:5px"></span>Em execução</span>';
    h += '<span><span style="display:inline-block;width:10px;height:10px;background:var(--info);border-radius:2px;vertical-align:middle;margin-right:5px"></span>Planejada</span>';
    h += '<span style="margin-left:auto">'+nDias+' dias · '+cs.length+' campanha(s)</span>';
    h += '</div>';

    return h;
  }

  /* ============ ENVELOPE COM ABAS ============ */
  function viewFila(){
    var aba = state.filaAba || 'fila';
    var h = '';
    /* Abas */
    h += '<div class="fila-tabs">';
    h += '<button class="fila-tab'+(aba==='fila'?' active':'')+'" data-fila-aba="fila">📋 Fila por dia</button>';
    h += '<button class="fila-tab'+(aba==='campanhas'?' active':'')+'" data-fila-aba="campanhas">📊 Campanhas · Gantt</button>';
    h += '<span class="fila-sp"></span>';
    h += '<button class="btn sm ghost" data-goto-view="disparos">→ Gerenciar Disparos</button>';
    h += '</div>';

    if(aba === 'fila') h += viewFilaDias();
    else if(aba === 'campanhas') h += viewFilaGantt();
    return h;
  }

  /* ============ CSS ============ */
  function cssInj(){
    if(document.getElementById('fila-tabs-css')) return;
    var s = ''+
    /* Abas */
    '.fila-tabs{display:flex;gap:4px;align-items:center;margin-bottom:14px;padding:4px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:10px;flex-wrap:wrap}'+
    '.fila-tab{padding:7px 14px;font-family:inherit;font-size:12px;font-weight:600;color:var(--muted);background:transparent;border:0;border-radius:7px;cursor:pointer;transition:.15s}'+
    '.fila-tab:hover{color:var(--txt);background:rgba(255,255,255,.04)}'+
    '.fila-tab.active{color:var(--accent);background:var(--accent-bg)}'+
    '.fila-sp{flex:1}'+
    /* Bloco do dia */
    '.fdia{border:1px solid var(--line);border-radius:10px;margin-bottom:8px;overflow:hidden;background:rgba(255,255,255,.01)}'+
    '.fdia-head{display:flex;align-items:center;gap:9px;padding:11px 14px;cursor:pointer;user-select:none;transition:.15s;flex-wrap:wrap}'+
    '.fdia-head:hover{background:rgba(255,255,255,.025)}'+
    '.fdia-chev{font-size:9px;color:var(--muted2);width:10px;flex-shrink:0}'+
    '.fdia-titulo{font-size:13px;font-weight:700;color:var(--txt)}'+
    '.fdia-sub{font-size:11px;color:var(--muted)}'+
    '.fdia-sp{flex:1}'+
    '.fdia-count{font-family:var(--font-display);font-size:16px;font-weight:600}'+
    '.fdia-body{border-top:1px solid var(--line);padding:10px 14px 14px;background:rgba(0,0,0,.10)}'+
    '.fdia-camp{margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:9px}'+
    '.fdia-camp:last-child{margin-bottom:0}'+
    '.fdia-camp-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}'+
    /* Gantt */
    '.gantt-wrap{border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.01);padding:14px;overflow-x:auto}'+
    '.gantt-head,.gantt-head-dias,.gantt-row{display:grid;grid-template-columns:200px repeat(var(--nd,21),minmax(22px,1fr));gap:1px;min-width:max-content}'+
    '.gantt-head{margin-bottom:2px}'+
    '.gantt-head-dias{margin-bottom:6px;border-bottom:1px solid var(--line);padding-bottom:6px}'+
    '.gantt-mes{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);padding:3px 4px;text-align:center;border-left:1px solid var(--line)}'+
    '.gantt-dia{font-size:9.5px;text-align:center;color:var(--muted2);padding:2px 0;font-variant-numeric:tabular-nums}'+
    '.gantt-dia.hoje{color:var(--accent);font-weight:700}'+
    '.gantt-dia.fds{opacity:.5}'+
    '.gantt-corner{}'+
    '.gantt-row{align-items:center;margin-bottom:2px}'+
    '.gantt-nome{display:flex;align-items:center;gap:6px;padding-right:10px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:11.5px}'+
    '.gantt-nome-txt{color:var(--muted);overflow:hidden;text-overflow:ellipsis;min-width:0}'+
    '.gantt-cell{height:22px;background:rgba(255,255,255,.03);border-radius:2px;position:relative;transition:.15s}'+
    '.gantt-cell.on{background:var(--c);opacity:.85}'+
    '.gantt-cell.on.first{border-radius:6px 2px 2px 6px}'+
    '.gantt-cell.on.last{border-radius:2px 6px 6px 2px}'+
    '.gantt-cell.on.first.last{border-radius:6px}'+
    '.gantt-cell.on:hover{opacity:1}'+
    /* Ajuste opcional do overlay quando --right-collapsed some */
    '';
    var st = document.createElement('style'); st.id = 'fila-tabs-css'; st.textContent = s;
    document.head.appendChild(st);
  }

  /* ============ Aplicar ============ */
  function aplicar(){
    if(typeof VIEWS === 'undefined'){ setTimeout(aplicar, 200); return; }
    VIEWS.fila = viewFila;
    if(typeof render === 'function') setTimeout(render, 60);
  }
  cssInj();
  aplicar();

  /* ============ Cliques ============ */
  document.addEventListener('click', function(ev){
    var el;
    el = ev.target.closest('[data-fila-aba]');
    if(el){
      ev.preventDefault(); ev.stopPropagation();
      state.filaAba = el.getAttribute('data-fila-aba');
      if(typeof render === 'function') render();
      return;
    }
    el = ev.target.closest('[data-fdia-toggle]');
    if(el){
      ev.preventDefault(); ev.stopPropagation();
      var d = el.getAttribute('data-fdia-toggle');
      state.diasExp[d] = !state.diasExp[d];
      if(typeof render === 'function') render();
      return;
    }
  }, true);
})();
