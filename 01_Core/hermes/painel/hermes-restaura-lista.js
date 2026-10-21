(function(){
  if(window.__restauraLista) return; window.__restauraLista=true;

  var ALVO = /mix.*decisor|decisor.*mix/i;
  var CHAVE = 'hermes-os.v7.user';

  function log(msg){ try{ console.log('[restaura-lista]', msg); }catch(e){} }

  function puxarListas(){
    var out = { state:[], store:[], backups:[] };

    /* 1) state.listas em memória */
    try{ out.state = (state && state.listas) || []; }catch(e){}

    /* 2) localStorage atual */
    var store = {};
    try{
      var raw = localStorage.getItem(CHAVE);
      store = raw ? JSON.parse(raw) : {};
      out.store = store.listas || [];
    }catch(e){ log('erro lendo store: '+e.message); }

    /* 3) outros backups no localStorage (procura por chaves antigas) */
    try{
      for(var i=0;i<localStorage.length;i++){
        var k = localStorage.key(i);
        if(k===CHAVE) continue;
        if(!/hermes/i.test(k)) continue;
        try{
          var v = JSON.parse(localStorage.getItem(k));
          if(v && Array.isArray(v.listas)) out.backups.push({chave:k, listas:v.listas});
        }catch(e){}
      }
    }catch(e){}

    return out;
  }

  function achar(dados){
    /* procura a lista "Wha - Quentes - Mix - Decisor" em qualquer fonte */
    var achadas = [];
    (dados.state||[]).forEach(function(l){ if(ALVO.test(String(l.nome||''))) achadas.push({origem:'state', l:l}); });
    (dados.store||[]).forEach(function(l){ if(ALVO.test(String(l.nome||''))) achadas.push({origem:'store', l:l}); });
    (dados.backups||[]).forEach(function(b){
      (b.listas||[]).forEach(function(l){
        if(ALVO.test(String(l.nome||''))) achadas.push({origem:'backup:'+b.chave, l:l});
      });
    });
    return achadas;
  }

  function merge(dados, achadas){
    if(!achadas.length) return {ok:false};

    /* pega a versão com mais ids */
    var melhor = achadas.slice().sort(function(a,b){
      return ((b.l&&b.l.ids&&b.l.ids.length)||0) - ((a.l&&a.l.ids&&a.l.ids.length)||0);
    })[0].l;

    /* garante formato consistente */
    var lista = {
      id: melhor.id || ('LST-'+Date.now()),
      nome: melhor.nome || 'Wha - Quentes - Mix - Decisor',
      ids: Array.isArray(melhor.ids) ? melhor.ids.slice() : [],
      descricao: melhor.descricao || (melhor.ids?melhor.ids.length+' lead(s)':'criada na aba Leads'),
      criadaEm: melhor.criadaEm || new Date().toISOString()
    };

    /* Aplica em state */
    try{
      if(state){
        state.listas = state.listas || [];
        var ix = state.listas.findIndex(function(l){return l.id===lista.id;});
        if(ix>=0) state.listas[ix] = lista;
        else state.listas.push(lista);
      }
    }catch(e){ log('erro state: '+e.message); }

    /* Aplica no store */
    try{
      var raw = localStorage.getItem(CHAVE);
      var s = raw ? JSON.parse(raw) : {};
      s.listas = s.listas || [];
      var iy = s.listas.findIndex(function(l){return l.id===lista.id;});
      if(iy>=0) s.listas[iy] = lista;
      else s.listas.push(lista);
      localStorage.setItem(CHAVE, JSON.stringify(s));
    }catch(e){ log('erro store: '+e.message); }

    if(typeof render==='function') render();

    return {ok:true, lista:lista};
  }

  function agir(){
    if(typeof state==='undefined'){ setTimeout(agir, 250); return; }

    var dados = puxarListas();
    var achadas = achar(dados);
    var res = merge(dados, achadas);

    /* overlay de retorno */
    var el = document.createElement('pre');
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);color:#0f0;'+
      'font:12px ui-monospace,Menlo,monospace;padding:24px;z-index:999999;'+
      'overflow:auto;white-space:pre-wrap;cursor:pointer';
    var txt = '=== RESTAURA "Wha - Quentes - Mix - Decisor" ===\n\n';
    txt += 'state.listas:      '+dados.state.length+'\n';
    txt += 'store.listas:      '+dados.store.length+'\n';
    txt += 'backups no LS:     '+dados.backups.length+'\n';
    txt += 'achadas em qualquer fonte: '+achadas.length+'\n\n';
    if(res.ok){
      txt += '✓ RESTAURADA\n';
      txt += '  id:    '+res.lista.id+'\n';
      txt += '  nome:  '+res.lista.nome+'\n';
      txt += '  leads: '+res.lista.ids.length+'\n\n';
      txt += 'Fontes que casaram:\n';
      achadas.forEach(function(a){
        txt += '  - '+a.origem+' · '+(a.l.ids?a.l.ids.length:0)+' ids\n';
      });
    } else {
      txt += '✗ Não achei a lista em lugar nenhum.\n\n';
      txt += 'Se ela ainda está visível na aba Leads (mundo real), copia aqui no\n'+
             'console do Chrome o retorno de:\n\n'+
             '  JSON.stringify(state.listas, null, 2)\n\n'+
             'e me manda — aí eu reconstruo a partir disso.\n';
    }
    el.textContent = txt + '\n(clique para fechar)';
    el.onclick = function(){ el.remove(); };
    document.body.appendChild(el);
  }
  agir();
})();
