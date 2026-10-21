(function(){
  if(window.__envia1) return; window.__envia1=true;

  function log(m){ console.log('[envia1]', m); }

  function go(){
    if(typeof state==='undefined'||!state.opportunities||!state.listas){
      setTimeout(go,500); return;
    }

    var L = (state.listas||[]).find(function(l){ return /mix.*decisor/i.test(l.nome||''); });
    if(!L || !L.ids || !L.ids.length){ log('lista MIXDEC vazia'); return; }

    var porId = {};
    state.opportunities.forEach(function(o){ porId[o.id] = o; });

    /* acha o primeiro lead com telefone */
    var alvo = null, tel = '';
    for(var i=0;i<L.ids.length;i++){
      var l = porId[L.ids[i]];
      if(!l) continue;
      var t = (l.whatsapp || l.telefone || '').toString().replace(/\D/g,'');
      if(t.length >= 10){ alvo = l; tel = t; break; }
    }
    if(!alvo){ log('nenhum lead com telefone'); 
      if(window.__toastErro) window.__toastErro('Nenhum lead com telefone');
      return; }

    var nome = alvo.nome || alvo.empresa || 'contato';
    var primeiro = nome.split(' ')[0] || 'tudo bem';
    var empresa = alvo.empresa || nome;
    var msg = 'Oi ' + primeiro + ', tudo bem? Vi que você está à frente da ' + empresa + '. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';
    var chatId = tel + '@s.whatsapp.net';

    log('alvo: ' + nome + ' | ' + tel);
    if(window.__toastInfo) window.__toastInfo('Enviando · ' + nome.slice(0,28), tel);

    fetch('http://127.0.0.1:8420/api/whatsapp/send', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        chatId: chatId,
        message: msg,
        opportunity_id: alvo.id,
        contato: alvo.contato || nome,
        empresa: empresa,
        telefone: tel
      })
    })
    .then(function(r){ return r.json(); })
    .then(function(j){
      log('resposta: ' + JSON.stringify(j).slice(0,200));
      if(j.ok){
        if(window.__toastOK) window.__toastOK('Enviado · ' + nome.slice(0,28), tel + ' · bridge 200');
      } else {
        if(window.__toastErro) window.__toastErro('Falha · ' + nome.slice(0,28), JSON.stringify(j).slice(0,80));
      }
      /* baixa log local */
      try{
        var dump = {
          quando: new Date().toISOString(),
          alvo: {nome:nome, empresa:empresa, telefone:tel, opportunity_id:alvo.id},
          mensagem: msg,
          resposta: j
        };
        var a = document.createElement('a');
        a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dump,null,2));
        a.download = 'envio-1.json';
        document.body.appendChild(a); a.click(); a.remove();
      }catch(e){}
    })
    .catch(function(e){
      log('erro fetch: ' + e.message);
      if(window.__toastErro) window.__toastErro('Erro de rede', e.message);
    });
  }

  go();
})();
