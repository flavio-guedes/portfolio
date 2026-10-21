(function(){
  if(window.__listaModal) return; window.__listaModal=true;

  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};

  /* ---------- mensagens prontas ---------- */
  var MSGS = {
    D0: "Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Estou mapeando operações que cresceram e ficaram com gargalo de processo. Faz sentido eu te mostrar em 15 min o que a gente resolve sem comprar ferramenta nova?",
    D3: "{contato}, uma coisa que quase ninguém faz antes de automatizar: mapear o processo atual. É por isso que 70% das automações em pequena empresa morrem em 3 meses. Quer que eu mapeie os 3 principais da {empresa}?",
    D7: "{contato}, última mensagem da minha parte. Se em algum momento fizer sentido falar sobre processo e atendimento, é só responder aqui. Deixo o convite em aberto."
  };

  function msgResolvida(txt, lead){
    return txt
      .replace(/\{contato\}/g, (lead.contato||lead.nome||'tudo bem').split(' ')[0])
      .replace(/\{empresa\}/g, lead.empresa||lead.nome||'sua empresa')
      .replace(/\{segmento\}/g, lead.segmento||'seu setor');
  }

  /* ---------- CSS ---------- */
  function css(){
    if(document.getElementById('lm-css')) return;
    var s = [
      '.lm-back{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;',
        'display:flex;align-items:center;justify-content:center;padding:24px;',
        'backdrop-filter:blur(3px)}',
      '.lm-box{background:var(--bg,#12171e);color:var(--txt,#f2f4f6);',
        'width:min(920px,100%);max-height:88vh;border-radius:14px;',
        'border:1px solid var(--line,#2a3441);display:flex;flex-direction:column;',
        'overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);font-family:Manrope,sans-serif}',
      '.lm-head{padding:16px 20px;border-bottom:1px solid var(--line,#2a3441);',
        'display:flex;align-items:flex-start;gap:14px}',
      '.lm-title{font:700 16px Manrope;margin:0}',
      '.lm-sub{font-size:11.5px;color:var(--muted,#8b93a1);margin-top:3px}',
      '.lm-x{margin-left:auto;background:transparent;border:1px solid var(--line,#2a3441);',
        'color:var(--muted,#8b93a1);width:28px;height:28px;border-radius:8px;cursor:pointer;',
        'font-size:15px;line-height:1}',
      '.lm-x:hover{color:var(--txt);border-color:var(--muted)}',
      '.lm-tabs{display:flex;gap:2px;padding:10px 20px 0;border-bottom:1px solid var(--line,#2a3441)}',
      '.lm-tab{padding:8px 14px;background:transparent;border:none;border-bottom:2px solid transparent;',
        'color:var(--muted,#8b93a1);font:700 11.5px Manrope;letter-spacing:.03em;cursor:pointer}',
      '.lm-tab.on{color:var(--txt);border-bottom-color:var(--accent,#e0b878)}',
      '.lm-body{flex:1;overflow:auto;padding:16px 20px}',
      '.lm-lead{padding:10px 12px;border:1px solid var(--line,#2a3441);border-radius:10px;',
        'margin-bottom:8px;display:flex;gap:10px;align-items:flex-start}',
      '.lm-lead h4{margin:0;font:600 13px Manrope}',
      '.lm-lead .sub{font-size:11px;color:var(--muted,#8b93a1);margin-top:2px}',
      '.lm-badge{font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;',
        'padding:2px 7px;border-radius:999px;border:1px solid;align-self:flex-start}',
      '.lm-msg{border:1px solid var(--line,#2a3441);border-radius:10px;padding:12px 14px;',
        'margin-bottom:10px;background:rgba(255,255,255,.02)}',
      '.lm-msg .lb{font-size:9.5px;font-weight:800;letter-spacing:.12em;',
        'text-transform:uppercase;color:var(--muted,#8b93a1);margin-bottom:6px;display:flex;gap:8px;align-items:center}',
      '.lm-msg .tx{font-size:12.5px;line-height:1.55;white-space:pre-wrap}',
      '.lm-copy{margin-left:auto;background:transparent;border:1px solid var(--line,#2a3441);',
        'color:var(--muted,#8b93a1);padding:2px 8px;border-radius:6px;font-size:10px;cursor:pointer}',
      '.lm-copy:hover{color:var(--txt);border-color:var(--muted)}',
      '.lm-empty{padding:40px 20px;text-align:center;color:var(--muted,#8b93a1);font-size:12px}'
    ].join('');
    var st=document.createElement('style'); st.id='lm-css'; st.textContent=s;
    document.head.appendChild(st);
  }

  /* ---------- helpers ---------- */
  function acharLista(id, nome){
    var L=null;
    try{ L=(state.listas||[]).find(function(l){return l.id===id||l.nome===nome;}); }catch(e){}
    if(L) return L;
    try{
      var s=JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}');
      L=(s.listas||[]).find(function(l){return l.id===id||l.nome===nome;});
    }catch(e){}
    return L;
  }

  function leadsDaLista(L){
    if(!L||!L.ids) return [];
    var porId={};
    (state.opportunities||[]).forEach(function(o){ porId[o.id]=o; });
    return L.ids.map(function(id){return porId[id]||{id:id,nome:'(não encontrado)'};});
  }

  /* ---------- modal ---------- */
  function abrir(L){
    css();
    var leads = leadsDaLista(L);
    var aba = 'leads';

    var back = document.createElement('div');
    back.className = 'lm-back';
    back.setAttribute('data-lm','1');

    function render(){
      var comWA = leads.filter(function(o){return String(o.whatsapp||o.telefone||'').length>=10;}).length;
      var h = '';
      h += '<div class="lm-head">';
      h +=   '<div>';
      h +=     '<h3 class="lm-title">'+E(L.nome||'Lista')+'</h3>';
      h +=     '<div class="lm-sub">'+leads.length+' lead(s) · '+comWA+' com WhatsApp · criada '+E((L.criadaEm||'').slice(0,10))+'</div>';
      h +=   '</div>';
      h +=   '<button class="lm-x" data-lm-close="1">✕</button>';
      h += '</div>';
      h += '<div class="lm-tabs">';
      h +=   '<button class="lm-tab'+(aba==='leads'?' on':'')+'" data-lm-tab="leads">Leads</button>';
      h +=   '<button class="lm-tab'+(aba==='msgs'?' on':'')+'" data-lm-tab="msgs">Mensagens prontas</button>';
      h += '</div>';
      h += '<div class="lm-body">';

      if(aba==='leads'){
        if(!leads.length){
          h += '<div class="lm-empty">Esta lista não tem leads.</div>';
        } else {
          leads.forEach(function(o,i){
            var temWA = String(o.whatsapp||o.telefone||'').length>=10;
            var cor = temWA?'#22c55e':'#94a3b8';
            h += '<div class="lm-lead">';
            h +=   '<div style="flex:1;min-width:0">';
            h +=     '<h4>'+E(o.nome||o.empresa||o.contato||'—')+'</h4>';
            h +=     '<div class="sub">';
            h +=       E(o.cargo||o.papel||o.segmento||'');
            if(o.whatsapp||o.telefone) h += ' · '+E(o.whatsapp||o.telefone);
            if(o.email) h += ' · '+E(o.email);
            h +=     '</div>';
            h +=   '</div>';
            h +=   '<span class="lm-badge" style="color:'+cor+';border-color:'+cor+'55;background:'+cor+'15">'+(temWA?'WA':'—')+'</span>';
            h += '</div>';
          });
        }
      } else {
        var amostra = leads[0] || {contato:'tudo bem',empresa:'sua empresa'};
        h += '<div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">';
        h +=   'Prévia com o primeiro lead da lista: <b style="color:var(--txt)">'+E(amostra.nome||amostra.empresa||amostra.contato||'—')+'</b>';
        h += '</div>';
        ['D0','D3','D7'].forEach(function(et){
          var txt = msgResolvida(MSGS[et], amostra);
          h += '<div class="lm-msg">';
          h +=   '<div class="lb">'+et+' <span style="font-weight:600;letter-spacing:0;text-transform:none;opacity:.75">'+
                   (et==='D0'?'primeiro contato':et==='D3'?'follow-up 3 dias':'follow-up 7 dias')+'</span>'+
                 '<button class="lm-copy" data-lm-copy="'+et+'">copiar</button></div>';
          h +=   '<div class="tx">'+E(txt)+'</div>';
          h += '</div>';
        });
        h += '<div style="font-size:11px;color:var(--muted);margin-top:8px">';
        h +=   'As variáveis <code>{contato}</code>, <code>{empresa}</code> e <code>{segmento}</code> são resolvidas automaticamente por lead no momento do disparo.';
        h += '</div>';
      }
      h += '</div>';

      back.innerHTML = '<div class="lm-box">'+h+'</div>';
    }

    render();
    document.body.appendChild(back);

    back.addEventListener('click', function(ev){
      if(ev.target===back || ev.target.closest('[data-lm-close]')){
        ev.preventDefault(); back.remove(); return;
      }
      var t=ev.target.closest('[data-lm-tab]');
      if(t){ ev.preventDefault(); aba=t.getAttribute('data-lm-tab'); render(); return; }
      var c=ev.target.closest('[data-lm-copy]');
      if(c){
        ev.preventDefault();
        var et=c.getAttribute('data-lm-copy');
        var txt=msgResolvida(MSGS[et], leads[0]||{});
        try{ navigator.clipboard.writeText(txt); }catch(e){}
        c.textContent='copiado'; setTimeout(function(){c.textContent='copiar';},1400);
        return;
      }
    });
  }

  /* ---------- intercepta cliques em listas ---------- */
  function acharListaDoCard(el){
    /* tenta por data-attribute, id, ou por nome dentro do card */
    var id = el.getAttribute('data-lista') || el.getAttribute('data-lista-id') ||
             el.getAttribute('data-list') || el.getAttribute('data-id') ||
             el.getAttribute('data-open-lista');
    var nome = null;
    var nx = el.querySelector('[data-lista-nome], .name, .title, h4, h3');
    if(nx) nome = nx.textContent.trim();
    if(!nome) {
      var t = el.textContent||'';
      var m = t.match(/[^\n]{4,80}/);
      nome = m?m[0].trim():null;
    }
    var L = null;
    if(id) L = acharLista(id,null);
    if(!L && nome) L = acharLista(null,nome);
    if(!L && nome){
      /* match parcial por nome */
      try{ L=(state.listas||[]).find(function(l){return (l.nome||'').indexOf(nome.slice(0,20))>=0;}); }catch(e){}
    }
    return L;
  }

  document.addEventListener('click', function(ev){
    /* só na aba Leads */
    if(typeof state==='undefined' || state.view!=='leads') return;
    var alvo = ev.target.closest('[data-lista],[data-lista-id],[data-list],[data-open-lista],.lista-card,.list-card');
    if(!alvo) return;
    /* evita conflito com botões internos (Criar campanha, ×) */
    if(ev.target.closest('[data-leads-lista-camp],[data-leads-del-lista],button,a')) return;
    var L = acharListaDoCard(alvo);
    if(!L) return;
    ev.preventDefault(); ev.stopPropagation();
    abrir(L);
  }, true);
})();
