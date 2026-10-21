(function(){
  if(window.__filaCore) return; window.__filaCore=true;

  var API_BASE = 'http://127.0.0.1:8420';
  var LOCK_KEY = 'hermes_fila_lock_v2';
  var LOCK_TTL = 15000;
  var ABA_ID   = 'aba-'+Math.random().toString(36).slice(2,10)+'-'+Date.now();

  var LISTA_RE    = /mix.*decisor|decisor.*mix/i;
  var LISTA_ID    = 'LST-MIXDEC';
  var CAMPANHA_ID = 'WAL-01';

  var GAP_NOVO = 10*60*1000;
  var GAP_BASE =  4*60*1000;
  try{
    var _g = JSON.parse(localStorage.getItem('hermes_gaps')||'{}');
    if(_g.novo && _g.novo>=60000 && _g.novo<=7200000) GAP_NOVO = _g.novo;
    if(_g.base && _g.base>=60000 && _g.base<=7200000) GAP_BASE = _g.base;
  }catch(e){}

  if(!state.__motor) state.__motor = {ativo:false, proximoEm:0, enviados:0, erros:0, log:[]};
  var MOT = state.__motor;

  var E = function(v){ return String(v==null?'':v).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };

  function sod(d){ var x=new Date(d); x.setHours(0,0,0,0); return x; }
  function hoje(){ return sod(new Date()); }
  function redraw(){ try{ if(typeof window.render==='function') window.render(); }catch(e){} }

  /* ---------- LOCK ENTRE ABAS ---------- */
  function pegarLock(){
    try{
      var cur = JSON.parse(localStorage.getItem(LOCK_KEY)||'{}');
      var agora = Date.now();
      if(!cur.aba || (agora-(cur.ts||0)) > LOCK_TTL || cur.aba === ABA_ID){
        localStorage.setItem(LOCK_KEY, JSON.stringify({aba:ABA_ID, ts:agora}));
        return true;
      }
      return false;
    } catch(e){ return true; }
  }
  function souDono(){
    try{
      var cur = JSON.parse(localStorage.getItem(LOCK_KEY)||'{}');
      if(!cur.aba) return true;
      if(cur.aba === ABA_ID) return true;
      if((Date.now()-(cur.ts||0)) > LOCK_TTL) return true;
      return false;
    } catch(e){ return true; }
  }
  setInterval(function(){
    if(!MOT.ativo) return;
    if(souDono()){ try{ localStorage.setItem(LOCK_KEY, JSON.stringify({aba:ABA_ID, ts:Date.now()})); }catch(e){} }
  }, 5000);

  /* ---------- HELPERS ---------- */
  function pendentesStatus(a){ return /AGENDADO|PENDENTE|PRONTO/i.test(String(a.status||'')); }
  function concluida(a){ return /CONCLUIDO|ENVIADO|CANCELADO|FALHA|ERRO|SEM_TELEFONE/i.test(String(a.status||'')); }
  function pausada(a){ return /PAUSAD/i.test(String(a.status||'')); }

  function lead(a){
    if(!a) return {};
    var opps = state.opportunities||[];
    for(var i=0;i<opps.length;i++) if(opps[i].id === a.opportunity_id) return opps[i];
    return {};
  }
  function isNovo(a, l){
    if(!a) return true;
    if(a.etapa && !/^(D0|INICIAL|PRIMEIRO)/i.test(a.etapa)) return false;
    if(l){
      if(l.tentativas>0) return false;
      if(l.ultimo_contato) return false;
    }
    if(a.historico && a.historico.length) return false;
    if(a.tentativas && a.tentativas>0) return false;
    return true;
  }
  function resolverVars(txt, l){
    if(!txt) return '';
    l = l||{};
    var primeiro = ((l.contato||l.nome||'').split(' ')[0]) || 'tudo bem';
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
      var s2=JSON.parse(localStorage.getItem(k)||'{}');
      s2.acoes=state.actions;
      localStorage.setItem(k, JSON.stringify(s2));
    }catch(e){}
  }

  /* ---------- FILA ---------- */
  function deHojeEmDiante(){
    var h = hoje().getTime();
    return (state.actions||[]).filter(function(a){
      if(!pendentesStatus(a) && !pausada(a)) return false;
      var p = a.prazo ? new Date(a.prazo) : null;
      return p && sod(p).getTime() >= h;
    });
  }
  function historicoCompleto(){
    var h = hoje().getTime();
    return (state.actions||[]).filter(function(a){
      if(concluida(a)) return true;
      if(pendentesStatus(a) || pausada(a)){
        var p = a.prazo ? new Date(a.prazo) : null;
        if(p && sod(p).getTime() < h) return true;
      }
      return false;
    });
  }
  function agruparPorDia(lista){
    var g = {};
    lista.forEach(function(a){
      var d = a.prazo ? sod(new Date(a.prazo)) : hoje();
      (g[d.getTime()] = g[d.getTime()]||[]).push(a);
    });
    return Object.keys(g).sort(function(x,y){return x-y;}).map(function(k){
      return {dia:new Date(parseInt(k,10)), itens:g[k]};
    });
  }

  /* ---------- ENVIO ---------- */
  function enviar(a){
    var l = lead(a);
    var tel = (l.whatsapp||l.telefone||a.telefone||'').toString().trim();
    if(!tel) return Promise.reject({message:'sem telefone'});
    var chatId = tel.indexOf('@')<0 ? (tel+'@s.whatsapp.net') : tel;
    var msg = resolverVars(a.acao||a.mensagem||'', l);
    var novo = isNovo(a, l);
    var body = {
      chatId: chatId,
      message: msg,
      opportunity_id: a.opportunity_id,
      contato: a.contato || l.contato || '',
      empresa: a.empresa || l.empresa || '',
      telefone: tel,
      etapa: a.etapa || '',
      autonomo: !novo
    };
    return fetch(API_BASE+'/api/whatsapp/send', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    }).then(function(r){
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.json();
    });
  }

  /* ---------- MOTOR ---------- */
  function escolherProxima(){
    var ps = deHojeEmDiante().filter(pendentesStatus);
    if(!ps.length) return null;
    ps.sort(function(a,b){
      var pa=a.prioridade_fila||99, pb=b.prioridade_fila||99;
      if(pa!==pb) return pa-pb;
      return new Date(a.prazo||0) - new Date(b.prazo||0);
    });
    return ps[0];
  }

  async function loop(){
    if(!MOT.ativo) return;
    if(!souDono()){
      MOT.ativo = false;
      MOT.log.unshift({t:Date.now(), msg:'Lock perdido — outra aba assumiu.'});
      redraw(); return;
    }
    var agora = Date.now();
    if(agora < MOT.proximoEm){
      setTimeout(loop, Math.min(4000, MOT.proximoEm - agora));
      return;
    }
    var a = escolherProxima();
    if(!a){
      MOT.ativo = false;
      MOT.log.unshift({t:Date.now(), msg:'Fila de hoje concluída.'});
      if(window.__toastOK) window.__toastOK('Fila concluída');
      redraw(); return;
    }
    var l = lead(a);
    var tel = (l.whatsapp||l.telefone||a.telefone||'').toString().trim();
    if(!tel){
      a.status = 'SEM_TELEFONE';
      a.motivo = 'lead sem telefone/WhatsApp';
      MOT.log.unshift({t:Date.now(), msg:'⊘ '+((l.empresa||l.nome||a.opportunity_id)+'').slice(0,40)+' — sem telefone'});
      persistir();
      MOT.proximoEm = Date.now() + 300;
      redraw();
      setTimeout(loop, 300);
      return;
    }
    var novo = isNovo(a, l);
    try{
      await enviar(a);
      MOT.enviados++;
      var emp = (a.empresa||l.empresa||a.opportunity_id)+'';
      MOT.log.unshift({t:Date.now(), msg:'✓ '+emp.slice(0,40)+' ['+(novo?'1º':'re')+']'});
      if(window.__toastOK) window.__toastOK('Enviado · '+emp.slice(0,32), new Date().toTimeString().slice(0,8)+(novo?' · 1º contato':' · base'));
      a.status = 'CONCLUIDO';
      a.enviadoEm = new Date().toISOString();
      a.tentativas = (a.tentativas||0) + 1;
      if(l){ l.tentativas = (l.tentativas||0)+1; l.ultimo_contato = a.enviadoEm; }
      persistir();
    }catch(e){
      var m = (e && e.message) || 'erro';
      MOT.erros++;
      var emp2 = (a.empresa||l.empresa||a.opportunity_id)+'';
      MOT.log.unshift({t:Date.now(), msg:'✗ '+emp2.slice(0,40)+' — '+m});
      if(window.__toastErro) window.__toastErro('Falha · '+emp2.slice(0,32), m);
      a.tentativas = (a.tentativas||0)+1;
      if(a.tentativas >= 3) a.status = 'ERRO';
      persistir();
      MOT.proximoEm = Date.now() + 30000;
      redraw();
      setTimeout(loop, 30000);
      return;
    }
    var gap = novo ? GAP_NOVO : GAP_BASE;
    MOT.proximoEm = Date.now() + gap;
    MOT.log = MOT.log.slice(0, 12);
    redraw();
    setTimeout(loop, gap);
  }

  function modalCadencia(){
    if(!document.getElementById('fcd-css')){
      var st = document.createElement('style'); st.id='fcd-css';
      st.textContent = '.fcd-back{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(3px)}'+
        '.fcd-box{background:#12171e;color:#f2f4f6;width:min(480px,100%);border-radius:14px;border:1px solid #2a3441;padding:22px 24px;box-shadow:0 30px 80px rgba(0,0,0,.55);font-family:Manrope,sans-serif}'+
        '.fcd-t{font:700 16px Manrope;margin:0 0 4px}'+
        '.fcd-s{font:11.5px Manrope;color:#8b93a1;margin-bottom:18px}'+
        '.fcd-lb{font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:#8b93a1;margin:14px 0 6px}'+
        '.fcd-in{width:100%;padding:8px 10px;background:rgba(255,255,255,.03);border:1px solid #2a3441;border-radius:8px;color:#f2f4f6;font:12.5px Manrope;outline:none}'+
        '.fcd-in:focus{border-color:#22c55e}'+
        '.fcd-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}'+
        '.fcd-pills{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}'+
        '.fcd-p{padding:4px 12px;border:1px solid #2a3441;background:transparent;color:#8b93a1;border-radius:999px;font:600 11px Manrope;cursor:pointer}'+
        '.fcd-p:hover{color:#f2f4f6;border-color:#8b93a1}'+
        '.fcd-p.on{background:rgba(34,197,94,.15);border-color:rgba(34,197,94,.5);color:#22c55e}'+
        '.fcd-acts{display:flex;gap:8px;margin-top:22px;justify-content:flex-end}'+
        '.fcd-btn{padding:8px 18px;border-radius:8px;font:700 12px Manrope;cursor:pointer;border:1px solid}'+
        '.fcd-cancel{background:transparent;border-color:#2a3441;color:#8b93a1}'+
        '.fcd-ok{background:rgba(34,197,94,.15);border-color:rgba(34,197,94,.5);color:#22c55e}'+
        '.fcd-ok:hover{background:rgba(34,197,94,.25)}';
      document.head.appendChild(st);
    }
    var back = document.createElement('div');
    back.className = 'fcd-back';
    back.innerHTML =
      '<div class="fcd-box">'+
        '<h3 class="fcd-t">Ativar fila</h3>'+
        '<div class="fcd-s">Escolha a cadência antes de iniciar os disparos.</div>'+
        '<div class="fcd-lb">1º contato (lead novo)</div>'+
        '<div class="fcd-row">'+
          '<input class="fcd-in" id="fcd-novo-min" type="number" min="1" max="120" value="'+(Math.round(GAP_NOVO/60000))+'"><span style="align-self:center;color:#8b93a1;font:11.5px Manrope">minutos entre cada</span>'+
        '</div>'+
        '<div class="fcd-lb">2º contato em diante (base)</div>'+
        '<div class="fcd-row">'+
          '<input class="fcd-in" id="fcd-base-min" type="number" min="1" max="120" value="'+(Math.round(GAP_BASE/60000))+'"><span style="align-self:center;color:#8b93a1;font:11.5px Manrope">minutos entre cada</span>'+
        '</div>'+
        '<div class="fcd-lb">Presets rápidos</div>'+
        '<div class="fcd-pills">'+
          '<button class="fcd-p" data-preset="10|4">10 / 4 (padrão)</button>'+
          '<button class="fcd-p" data-preset="15|6">15 / 6</button>'+
          '<button class="fcd-p" data-preset="20|8">20 / 8</button>'+
          '<button class="fcd-p" data-preset="5|3">5 / 3 (rápido)</button>'+
        '</div>'+
        '<div class="fcd-acts">'+
          '<button class="fcd-btn fcd-cancel" id="fcd-cancel">Cancelar</button>'+
          '<button class="fcd-btn fcd-ok" id="fcd-go">▶ Iniciar</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(back);

    back.addEventListener('click', function(ev){
      if(ev.target===back){ back.remove(); return; }
      var p = ev.target.closest('[data-preset]');
      if(p){
        var v = p.getAttribute('data-preset').split('|');
        document.getElementById('fcd-novo-min').value = v[0];
        document.getElementById('fcd-base-min').value = v[1];
        back.querySelectorAll('[data-preset]').forEach(function(b){ b.classList.remove('on'); });
        p.classList.add('on');
        return;
      }
      if(ev.target.id==='fcd-cancel'){ back.remove(); return; }
      if(ev.target.id==='fcd-go'){
        var n = parseInt(document.getElementById('fcd-novo-min').value, 10);
        var b = parseInt(document.getElementById('fcd-base-min').value, 10);
        if(!n||n<1||!b||b<1){ alert('Valores inválidos'); return; }
        GAP_NOVO = n*60*1000;
        GAP_BASE = b*60*1000;
        try{ localStorage.setItem('hermes_gaps', JSON.stringify({novo:GAP_NOVO, base:GAP_BASE})); }catch(e){}
        back.remove();
        iniciarMotor();
      }
    });
  }

  function iniciarMotor(){
    if(MOT.ativo) return;
    if(!pegarLock()){
      MOT.log.unshift({t:Date.now(), msg:'Outra aba está com a fila ativa.'});
      if(window.__toastInfo) window.__toastInfo('Fila ativa em outra aba');
      redraw(); return;
    }
    var p = deHojeEmDiante().filter(pendentesStatus);
    if(!p.length){
      MOT.log.unshift({t:Date.now(), msg:'Nenhuma ação. Clique em Preparar fila.'});
      redraw(); return;
    }
    MOT.ativo = true;
    MOT.proximoEm = Date.now();
    MOT.log.unshift({t:Date.now(), msg:'▶ Iniciado · 10min 1º / 4min base'});
    if(window.__toastInfo) window.__toastInfo('Fila ativa','10min 1º / 4min base');
    loop();
    redraw();
  }
  function pausar(){
    MOT.ativo = false;
    MOT.log.unshift({t:Date.now(), msg:'⏸ Pausado'});
    if(window.__toastInfo) window.__toastInfo('Fila pausada');
    redraw();
  }

  /* ---------- PREPARAR FILA ---------- */
  function acharLista(){
    var L = null;
    try{ L = (state.listas||[]).find(function(l){return l.id===LISTA_ID || LISTA_RE.test(l.nome||'');}); }catch(e){}
    if(L) return L;
    try{
      var s = JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}');
      L = (s.listas||[]).find(function(l){return l.id===LISTA_ID || LISTA_RE.test(l.nome||'');});
    }catch(e){}
    return L;
  }
  function prepararFila(){
    var L = acharLista();
    if(!L || !L.ids || !L.ids.length){
      if(window.__toastErro) window.__toastErro('Lista não encontrada','Wha - Quentes - Mix - Decisor');
      return;
    }
    var hojeIni = hoje().getTime();
    var jaTem = {};
    (state.actions||[]).forEach(function(a){
      if(!pendentesStatus(a)) return;
      var p = a.prazo ? new Date(a.prazo) : null;
      if(p && sod(p).getTime() >= hojeIni) jaTem[a.opportunity_id] = true;
    });
    var porLead = {};
    (state.opportunities||[]).forEach(function(o){ porLead[o.id] = o; });

    var msg = 'Oi {contato}, tudo bem? Vi que você está à frente da {empresa}. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';
    try{
      var c = (state.campaigns||[]).find(function(x){return x.id===CAMPANHA_ID;}) || (state.campaigns||[])[0];
      if(c && c.mensagens && c.mensagens.D0 && c.mensagens.D0.corpo) msg = c.mensagens.D0.corpo;
    }catch(e){}

    var cursor = new Date(); cursor.setMinutes(cursor.getMinutes()+1, 0, 0);
    var criadas = 0, ok = 0;
    var semTelLista = [];
    L.ids.forEach(function(oppId, i){
      var l = porLead[oppId];
      if(!l) return;
      if(jaTem[oppId]){ ok++; return; }
      var tel = (l.whatsapp||l.telefone||'').toString().replace(/\D/g,'');
      if(tel.length < 10){
        semTelLista.push(l.empresa||l.nome||oppId);
        return;
      }
      var novo = isNovo({etapa:'D0'}, l);
      state.actions.push({
        id:'ACT-'+Date.now()+'-'+i, opportunity_id:oppId,
        contato:l.contato||l.nome||'', empresa:l.empresa||l.nome||'',
        telefone:tel, canal:'whatsapp',
        campanha_id:CAMPANHA_ID, campaign_id:CAMPANHA_ID, etapa:'D0',
        acao:msg, mensagem:msg, prazo:cursor.toISOString(),
        prioridade:'Alta', prioridade_fila:1, status:'AGENDADO',
        criadaEm:new Date().toISOString()
      });
      criadas++;
      cursor = new Date(cursor.getTime() + (novo ? GAP_NOVO : GAP_BASE));
    });
    persistir();
    redraw();
    MOT.log.unshift({t:Date.now(), msg:'Fila preparada: '+criadas+' criadas, '+ok+' existentes, '+semTelLista.length+' sem telefone'});
    if(window.__toastOK) window.__toastOK('Fila preparada', criadas+' criadas · '+semTelLista.length+' sem telefone (ignorados)');
  }

  /* ---------- AÇÕES POR CARD ---------- */
  async function enviarAgora(id){
    var a = (state.actions||[]).find(function(x){return x.id===id;});
    if(!a) return;
    var l = lead(a);
    var tel = (l.whatsapp||l.telefone||a.telefone||'').toString().trim();
    var emp = (a.empresa||l.empresa||a.opportunity_id)+'';
    if(!tel){
      a.status = 'SEM_TELEFONE'; a.motivo = 'sem telefone';
      MOT.log.unshift({t:Date.now(), msg:'⊘ '+emp.slice(0,40)+' — sem telefone'});
      persistir(); redraw(); return;
    }
    if(window.__toastInfo) window.__toastInfo('Enviando · '+emp.slice(0,32));
    try{
      await enviar(a);
      MOT.enviados++;
      a.status = 'CONCLUIDO';
      a.enviadoEm = new Date().toISOString();
      a.tentativas = (a.tentativas||0)+1;
      if(l){ l.tentativas=(l.tentativas||0)+1; l.ultimo_contato=a.enviadoEm; }
      if(window.__toastOK) window.__toastOK('Enviado agora · '+emp.slice(0,28), new Date().toTimeString().slice(0,8)+' · manual');
      MOT.log.unshift({t:Date.now(), msg:'✓ '+emp.slice(0,40)+' [manual]'});
    }catch(e){
      MOT.erros++;
      var m = (e && e.message) || 'erro';
      if(window.__toastErro) window.__toastErro('Falha · '+emp.slice(0,28), m);
      MOT.log.unshift({t:Date.now(), msg:'✗ '+emp.slice(0,40)+' — '+m});
    }
    persistir(); redraw();
  }

  function executarAcao(acao, id){
    var a = (state.actions||[]).find(function(x){return x.id===id;});
    if(!a) return;
    if(acao === 'sendnow'){ enviarAgora(id); return; }
    if(acao === 'pause'){ a.status = 'PAUSADO'; MOT.log.unshift({t:Date.now(),msg:'⏸ '+((a.empresa||a.opportunity_id)+'').slice(0,40)+' pausado'}); }
    else if(acao === 'resume'){ a.status = 'AGENDADO'; MOT.log.unshift({t:Date.now(),msg:'▶ '+((a.empresa||a.opportunity_id)+'').slice(0,40)+' reativado'}); }
    else if(acao === 'del'){ state.actions = (state.actions||[]).filter(function(x){return x.id!==id;}); MOT.log.unshift({t:Date.now(),msg:'✕ ação removida'}); }
    persistir(); redraw();
  }

  /* ---------- MODAL ---------- */
  function abrirModal(a){
    var l = lead(a);
    var msg = resolverVars(a.acao||a.mensagem||'', l);
    var canal = String(a.canal||'whatsapp');
    var tel = l.whatsapp||l.telefone||a.telefone||'—';

    if(!document.getElementById('fcm-css')){
      var st = document.createElement('style'); st.id='fcm-css';
      st.textContent = '.fcm-back{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(3px)}'+
        '.fcm-box{background:#12171e;color:#f2f4f6;width:min(720px,100%);max-height:88vh;border-radius:14px;border:1px solid #2a3441;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.55);font-family:Manrope,sans-serif}'+
        '.fcm-h{padding:16px 20px;border-bottom:1px solid #2a3441;display:flex;gap:12px;align-items:flex-start}'+
        '.fcm-t{font:700 16px Manrope;margin:0}'+
        '.fcm-s{font-size:11.5px;color:#8b93a1;margin-top:3px}'+
        '.fcm-x{margin-left:auto;background:transparent;border:1px solid #2a3441;color:#8b93a1;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:15px;line-height:1}'+
        '.fcm-b{flex:1;overflow:auto;padding:16px 20px}'+
        '.fcm-lb{font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:#8b93a1;margin:0 0 6px}'+
        '.fcm-msg{background:rgba(255,255,255,.02);border:1px solid #2a3441;border-radius:10px;padding:12px;font-size:12.5px;line-height:1.55;white-space:pre-wrap;margin-bottom:16px}'+
        '.fcm-grid{display:grid;grid-template-columns:120px 1fr;gap:4px 12px;font-size:12px;margin-bottom:16px}'+
        '.fcm-grid .k{color:#8b93a1}'+
        '.fcm-acts{display:flex;gap:8px;flex-wrap:wrap;padding-top:8px;border-top:1px solid #2a3441}'+
        '.fcm-act{padding:6px 14px;border:1px solid #2a3441;background:transparent;color:#f2f4f6;border-radius:8px;font:600 11.5px Manrope;cursor:pointer}'+
        '.fcm-act:hover{background:rgba(255,255,255,.05)}'+
        '.fcm-danger{color:#ef4444;border-color:#ef4444}'+
        '.fcm-ok{color:#22c55e;border-color:rgba(34,197,94,.5)}';
      document.head.appendChild(st);
    }

    var campos = [
      ['Lead', l.nome||l.empresa||'—'],
      ['Contato', a.contato||l.contato||'—'],
      ['Empresa', a.empresa||l.empresa||'—'],
      ['Telefone', tel],
      ['Email', l.email||'—'],
      ['Canal', canal],
      ['Etapa', a.etapa||'—'],
      ['Status', a.status||'—'],
      ['Prazo', a.prazo?new Date(a.prazo).toLocaleString('pt-BR'):'—'],
      ['Tentativas', String(a.tentativas||0)],
      ['Enviado em', a.enviadoEm?new Date(a.enviadoEm).toLocaleString('pt-BR'):'—']
    ];

    var filtros = {};
    try{ filtros = state.filters||{}; }catch(e){}
    var temFiltro = false, fh = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">';
    Object.keys(filtros).forEach(function(k){
      var v = filtros[k];
      if(!v || v==='all') return;
      temFiltro = true;
      fh += '<span style="padding:2px 10px;border:1px solid #2a3441;border-radius:999px;font:600 10.5px Manrope;color:#8b93a1">'+E(k)+': '+E(v)+'</span>';
    });
    fh += '</div>';

    var h = '<div class="fcm-h"><div><h3 class="fcm-t">'+E(l.nome||l.empresa||'Detalhes')+'</h3>'+
         '<div class="fcm-s">'+E(canal)+' · '+E(a.etapa||'—')+' · '+E(a.prazo?new Date(a.prazo).toLocaleString('pt-BR'):'—')+'</div></div>'+
         '<button class="fcm-x" data-fcm-close="1">✕</button></div>';
    h += '<div class="fcm-b">';
    h += '<div class="fcm-lb">Mensagem que será enviada</div>';
    h += '<div class="fcm-msg">'+E(msg)+'</div>';
    h += '<div class="fcm-lb">Filtros aplicados</div>';
    h += temFiltro ? fh : '<div style="color:#8b93a1;font-size:11px;margin-bottom:16px">Nenhum filtro ativo.</div>';
    h += '<div class="fcm-lb">Dados</div>';
    h += '<div class="fcm-grid">';
    campos.forEach(function(c){ h += '<div class="k">'+E(c[0])+'</div><div>'+E(c[1])+'</div>'; });
    h += '</div>';
    h += '<div class="fcm-acts">';
    if(pendentesStatus(a)) h += '<button class="fcm-act fcm-ok" data-fcm-act="sendnow|'+E(a.id)+'">⚡ Enviar agora</button>';
    if(pendentesStatus(a)) h += '<button class="fcm-act" data-fcm-act="pause|'+E(a.id)+'">⏸ Pausar</button>';
    if(pausada(a)) h += '<button class="fcm-act" data-fcm-act="resume|'+E(a.id)+'">▶ Reativar</button>';
    h += '<button class="fcm-act fcm-danger" data-fcm-act="del|'+E(a.id)+'">✕ Excluir</button>';
    h += '</div></div>';

    var back = document.createElement('div');
    back.className = 'fcm-back';
    back.innerHTML = '<div class="fcm-box">'+h+'</div>';
    document.body.appendChild(back);

    back.addEventListener('click', function(ev){
      if(ev.target===back || ev.target.closest('[data-fcm-close]')){ ev.preventDefault(); back.remove(); return; }
      var b = ev.target.closest('[data-fcm-act]');
      if(b){
        ev.preventDefault();
        var p = b.getAttribute('data-fcm-act').split('|');
        executarAcao(p[0], p[1]);
        back.remove();
      }
    });
  }

  /* ---------- UI ---------- */
  function cardHTML(a){
    var l = lead(a);
    var nome = a.empresa || l.empresa || '—';
    var contato = a.contato || l.contato || '';
    var canal = String(a.canal||'whatsapp').toLowerCase();
    var hora = a.prazo ? new Date(a.prazo).toTimeString().slice(0,5) : '';
    var badge = canal==='email'?'E-mail':canal==='linkedin'?'LinkedIn':'WhatsApp';
    var cor = canal==='email'?'var(--info)':canal==='linkedin'?'#60a5fa':'var(--ok)';
    var isHist = concluida(a);
    var isAtraso = !isHist && pendentesStatus(a) && a.prazo && sod(new Date(a.prazo)).getTime() < hoje().getTime();
    var isPaus = pausada(a);
    var corBorda = isAtraso ? 'var(--urgent)' : isPaus ? 'var(--muted)' : cor;
    var etiq = isAtraso?'ATRASADO':isPaus?'PAUSADO':badge;
    var novoLead = isNovo(a, l);
    var tagBadge = '';
    if(!isHist && !isPaus){
      tagBadge = novoLead
        ? '<span style="display:inline-flex;align-items:center;font:800 8.5px Manrope;letter-spacing:.08em;text-transform:uppercase;color:#22c55e;background:rgba(34,197,94,.13);border:1px solid rgba(34,197,94,.4);border-radius:999px;padding:1px 7px;margin-left:6px;line-height:1.5;flex-shrink:0">novo</span>'
        : '<span style="display:inline-flex;align-items:center;font:800 8.5px Manrope;letter-spacing:.08em;text-transform:uppercase;color:#f59e0b;background:rgba(245,158,11,.13);border:1px solid rgba(245,158,11,.4);border-radius:999px;padding:1px 7px;margin-left:6px;line-height:1.5;flex-shrink:0">base</span>';
    }
    var btn = 'background:transparent;border:1px solid var(--line);color:var(--muted);padding:2px 8px;border-radius:6px;font:600 10px Manrope;cursor:pointer;line-height:1.6';
    var btns = '';
    if(pendentesStatus(a)) btns += '<button style="'+btn+';color:#22c55e;border-color:rgba(34,197,94,.5)" data-fl-act="sendnow|'+E(a.id)+'">⚡ Enviar agora</button>';
    if(pendentesStatus(a)) btns += '<button style="'+btn+'" data-fl-act="pause|'+E(a.id)+'">⏸ Pausar</button>';
    if(pausada(a)) btns += '<button style="'+btn+'" data-fl-act="resume|'+E(a.id)+'">▶ Reativar</button>';
    btns += '<button style="'+btn+'" data-fl-act="del|'+E(a.id)+'">✕ Excluir</button>';
    return '<div class="card" data-fl-card="'+E(a.id)+'" style="padding:10px 12px;margin-bottom:6px;border-left:3px solid '+corBorda+';opacity:'+(isHist?'.72':'1')+';cursor:pointer">'+
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">'+
        '<div style="min-width:0;flex:1">'+
          '<div style="display:flex;align-items:center;min-width:0">'+
            '<span style="font:600 12.5px Manrope;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+E(nome)+'</span>'+tagBadge+
          '</div>'+
          (contato?'<div class="sub" style="font-size:10.5px;margin-top:1px">'+E(contato)+'</div>':'')+
        '</div>'+
        '<div style="text-align:right;flex-shrink:0">'+
          '<div style="font:700 10px Manrope;color:'+(isAtraso?'var(--urgent)':isPaus?'var(--muted)':cor)+';letter-spacing:.04em">'+etiq+'</div>'+
          (hora?'<div class="sub" style="font-size:10.5px">'+hora+'</div>':'')+
        '</div>'+
      '</div>'+
      (a.acao?'<div class="sub" style="font-size:10.5px;margin-top:6px;line-height:1.4">'+E(String(a.acao).slice(0,110))+'</div>':'')+
      '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap" onclick="event.stopPropagation()">'+btns+'</div>'+
    '</div>';
  }

  var _histCache = {total:0, ultimos:[], ts:0, carregando:false};

  function carregarHistorico(){
    if(_histCache.carregando) return;
    if(Date.now() - _histCache.ts < 4000) return;
    _histCache.carregando = true;
    fetch(API_BASE + '/api/disparos', {cache:'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(j){
        _histCache.total = j.total || 0;
        _histCache.ultimos = (j.ultimos || []).slice().reverse();
        _histCache.ts = Date.now();
        _histCache.carregando = false;
        redraw();
      })
      .catch(function(){ _histCache.carregando = false; });
  }

  function linhaHistorico(x){
    var emp = x.empresa || '(sem nome)';
    var tel = (x.telefone || '').toString();
    var quando = x.quando || '';
    var partes = quando.split(' ');
    var data = partes[0] ? partes[0].slice(5) : '';
    var hora = partes[1] ? partes[1].slice(0,5) : '';
    var ok = /^OK$/i.test(String(x.status||''));
    var cor = ok ? '#22c55e' : '#ef4444';
    var ico = ok ? '✓' : '✗';
    return '<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-bottom:1px solid var(--line);font:11.5px Manrope">'+
      '<span style="color:'+cor+';font-weight:800;flex-shrink:0">'+ico+'</span>'+
      '<span style="font:600 11px ui-monospace,Menlo,monospace;color:var(--muted);flex-shrink:0">'+E(data)+' '+E(hora)+'</span>'+
      '<span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+E(String(emp).slice(0,42))+'</span>'+
      (tel?'<span style="font:500 10.5px ui-monospace,Menlo,monospace;color:var(--muted);flex-shrink:0">'+E(tel.slice(0,15))+'</span>':'')+
    '</div>';
  }

  function blocoHistoricoEnvios(){
    carregarHistorico();
    var env = _histCache.ultimos || [];
    if(!_histCache.ts){
      return '<div style="margin-top:18px;border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:rgba(255,255,255,.015)">'+
        '<div style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Histórico de envios</div>'+
        '<div style="font:11.5px Manrope;color:var(--muted2)">Carregando…</div>'+
      '</div>';
    }
    if(!env.length){
      return '<div style="margin-top:18px;border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:rgba(255,255,255,.015)">'+
        '<div style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Histórico de envios</div>'+
        '<div style="font:11.5px Manrope;color:var(--muted2)">Nenhum envio registrado ainda.</div>'+
      '</div>';
    }
    var ultimos = env.slice(0, 50);
    var h = '<div style="margin-top:18px;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:rgba(255,255,255,.015)">'+
      '<div style="padding:11px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--line)">'+
        '<span style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)">Histórico de envios</span>'+
        '<span style="font:600 10.5px Manrope;color:var(--muted2)">'+_histCache.total+' total</span>'+
        '<span style="margin-left:auto;font:600 10.5px Manrope;color:var(--muted2)">últimos '+ultimos.length+'</span>'+
      '</div>'+
      '<div style="max-height:340px;overflow:auto">';
    ultimos.forEach(function(x){ h += linhaHistorico(x); });
    h += '</div></div>';
    return h;
  }

  function blocoCampanhasAtivas(){
    var cs = (state.campaigns||[]).filter(function(c){
      var s = String(c.status||'').toUpperCase();
      return s.indexOf('EXECU')>=0 || s==='ATIVA' || s==='ATIVO';
    });
    if(!cs.length) return '<div class="op-empty">Nenhuma campanha ativa.</div>';
    var h = '<div style="display:grid;gap:10px">';
    cs.forEach(function(c){
      var as = (state.actions||[]).filter(function(a){return a.campaign_id===c.id;});
      var env = as.filter(function(a){return /CONCLU|ENVIADO/i.test(String(a.status||''));}).length;
      var pend = as.filter(pendentesStatus).length;
      var err = as.filter(function(a){return /ERRO|FALHA/i.test(String(a.status||''));}).length;
      var tot = as.length, pct = tot ? Math.round(env*100/tot) : 0;
      h += '<div class="card" style="padding:12px;border-left:3px solid var(--accent)">'+
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">'+
          '<div style="min-width:0"><div style="font:700 13px Manrope;color:var(--txt)">'+E(c.nome||c.id)+'</div>'+
          '<div class="sub" style="font-size:10.5px;margin-top:2px">'+E(c.canal||'whatsapp')+' · '+tot+' ações</div></div>'+
          '<div style="text-align:right"><div style="font:700 20px Manrope;color:var(--accent)">'+pct+'%</div>'+
          '<div class="sub" style="font-size:10px">'+env+'/'+tot+'</div></div>'+
        '</div>'+
        '<div class="progress" style="margin-top:8px"><i style="width:'+pct+'%"></i></div>'+
        '<div style="display:flex;gap:12px;margin-top:8px;font:600 10.5px Manrope;color:var(--muted)">'+
          '<span>✓ '+env+'</span><span>⏳ '+pend+'</span><span style="color:'+(err?'var(--urgent)':'var(--muted)')+'">✗ '+err+'</span>'+
        '</div>'+
      '</div>';
    });
    return h+'</div>' + blocoHistoricoEnvios();
  }

  function restante(){
    if(!MOT.ativo) return '';
    var ms = MOT.proximoEm - Date.now();
    if(ms<=0) return 'enviando…';
    var s = Math.ceil(ms/1000), m = Math.floor(s/60); s%=60;
    return m+'m'+String(s).padStart(2,'0')+'s';
  }

  function viewFila(){
    var aba = state.__filaAba || 'hoje';
    var h = '<div style="display:flex;gap:4px;align-items:center;border-bottom:1px solid var(--line);margin-bottom:14px">';
    [['hoje','Hoje em diante'],['campanhas','Campanhas ativas'],['historico','Histórico']].forEach(function(t){
      var on = aba===t[0];
      h += '<button data-fl-tab="'+t[0]+'" style="padding:8px 14px;background:transparent;border:none;border-bottom:2px solid '+(on?'var(--accent)':'transparent')+';color:'+(on?'var(--txt)':'var(--muted)')+';font:700 11.5px Manrope;letter-spacing:.03em;cursor:pointer">'+t[1]+'</button>';
    });
    var cor = MOT.ativo ? '#f59e0b' : '#22c55e';
    h += '<div style="margin-left:auto;display:flex;align-items:center;gap:10px;padding-bottom:6px">';
    h += '<button data-fl-prep="1" style="padding:6px 14px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--muted);font:700 11.5px Manrope,sans-serif;cursor:pointer">📋 Preparar fila</button>';
    h += '<button data-fl-motor="'+(MOT.ativo?'pausar':'ativar')+'" style="padding:6px 14px;border-radius:999px;border:1px solid '+cor+';background:color-mix(in srgb,'+cor+' 14%,transparent);color:'+cor+';font:700 11.5px Manrope,sans-serif;cursor:pointer;letter-spacing:.03em">'+(MOT.ativo?'⏸ Pausar fila':'▶ Ativar fila')+'</button>';
    if(MOT.ativo) h += '<span style="font:600 11px Manrope;color:var(--muted)">próximo em '+restante()+'</span>';
    h += '<span style="font:600 11px Manrope;color:var(--muted)">✓ '+MOT.enviados+' · ✗ '+MOT.erros+'</span>';
    h += '</div></div>';
    if(MOT.log.length){
      h += '<div style="margin-bottom:12px;padding:8px 12px;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:8px;font:11px ui-monospace,Menlo,monospace;color:var(--muted);line-height:1.55;max-height:90px;overflow:auto">';
      MOT.log.slice(0,5).forEach(function(l){
        var hh = new Date(l.t).toTimeString().slice(0,5);
        h += '<div>'+hh+' · '+E(l.msg)+'</div>';
      });
      h += '</div>';
    }
    if(aba === 'hoje'){
      var lista = deHojeEmDiante();
      if(!lista.length) return h+'<div class="op-empty">Nada agendado. Clique em "📋 Preparar fila" para criar as ações de hoje.</div>';
      agruparPorDia(lista).forEach(function(g){
        var label = g.dia.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
        var isHoje = sod(g.dia).getTime() === hoje().getTime();
        h += '<div style="margin-bottom:16px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
          '<span style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:'+(isHoje?'var(--accent)':'var(--muted)')+'">'+(isHoje?'Hoje':label)+'</span>'+
          '<span class="sub" style="font-size:10.5px">'+g.itens.length+'</span></div>';
        g.itens.slice(0,80).forEach(function(a){ h += cardHTML(a); });
        if(g.itens.length>80) h += '<div class="sub" style="font-size:10.5px;padding:4px 0">+ '+(g.itens.length-80)+' mais</div>';
        h += '</div>';
      });
    } else if(aba === 'campanhas'){
      h += blocoCampanhasAtivas();
    } else if(aba === 'historico'){
      var hist = historicoCompleto();
      if(!hist.length) return h+'<div class="op-empty">Nada no histórico.</div>';
      var porDia = {};
      hist.forEach(function(a){
        var d = a.prazo ? sod(new Date(a.prazo)) : (a.enviadoEm ? sod(new Date(a.enviadoEm)) : hoje());
        (porDia[d.getTime()] = porDia[d.getTime()]||[]).push(a);
      });
      Object.keys(porDia).sort(function(x,y){return y-x;}).forEach(function(k){
        var dia = new Date(parseInt(k,10));
        var label = dia.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
        var itens = porDia[k];
        h += '<div style="margin-bottom:16px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
          '<span style="font:800 10px Manrope;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)">'+label+'</span>'+
          '<span class="sub" style="font-size:10.5px">'+itens.length+'</span></div>';
        itens.slice(0,80).forEach(function(a){ h += cardHTML(a); });
        h += '</div>';
      });
    }
    return h;
  }

  function instalar(){
    if(typeof VIEWS==='undefined'){ setTimeout(instalar, 200); return; }
    VIEWS.fila = viewFila;
    if(typeof TITLES!=='undefined') TITLES.fila = ['Fila','Hoje em diante, campanhas ativas e histórico.'];
    redraw();
  }
  instalar();

  document.addEventListener('click', function(ev){
    var el;
    el = ev.target.closest('[data-fl-tab]');
    if(el){ ev.preventDefault(); ev.stopPropagation(); state.__filaAba = el.getAttribute('data-fl-tab'); redraw(); return; }
    el = ev.target.closest('[data-fl-prep]');
    if(el){ ev.preventDefault(); ev.stopPropagation(); prepararFila(); return; }
    el = ev.target.closest('[data-fl-motor]');
    if(el){ ev.preventDefault(); ev.stopPropagation();
      if(el.getAttribute('data-fl-motor')==='ativar') modalCadencia(); else pausar();
      return;
    }
    el = ev.target.closest('[data-fl-act]');
    if(el){ ev.preventDefault(); ev.stopPropagation(); var p = el.getAttribute('data-fl-act').split('|'); executarAcao(p[0], p[1]); return; }
    el = ev.target.closest('[data-fl-card]');
    if(el){
      ev.preventDefault(); ev.stopPropagation();
      var a = (state.actions||[]).find(function(x){return x.id===el.getAttribute('data-fl-card');});
      if(a) abrirModal(a);
      return;
    }
  }, true);

  setInterval(function(){ if(MOT.ativo && typeof window.render==='function') window.render(); }, 1000);
})();
