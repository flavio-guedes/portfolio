(function(){
  setTimeout(function(){
    if(typeof state==='undefined'){console.log('SEM STATE');return;}
    var L=(state.listas||[]).find(function(l){return /mix.*decisor/i.test(l.nome||'');});
    if(!L||!L.ids||!L.ids.length){console.log('SEM LISTA');return;}
    var porId={}; (state.opportunities||[]).forEach(function(o){porId[o.id]=o;});
    // pega o primeiro com telefone
    var alvo=null;
    for(var i=0;i<L.ids.length;i++){
      var l=porId[L.ids[i]];
      if(l && (l.whatsapp||l.telefone)){ alvo=l; break; }
    }
    if(!alvo){console.log('NENHUM COM TELEFONE');return;}
    var tel=(alvo.whatsapp||alvo.telefone||'').toString().replace(/\D/g,'');
    if(tel.length<10){console.log('TELEFONE CURTO:',tel);return;}
    var chatId=tel+'@s.whatsapp.net';
    var msg='Oi '+(alvo.contato||alvo.nome||'').split(' ')[0]+', tudo bem? Vi que você está à frente da '+(alvo.empresa||'sua empresa')+'. Faz sentido eu te mostrar em 15 min como resolver gargalo de processo sem comprar ferramenta nova?';
    console.log('DISPARANDO para', chatId, '|', alvo.nome||alvo.empresa);
    fetch('http://127.0.0.1:8420/api/whatsapp/send',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chatId:chatId, message:msg, opportunity_id:alvo.id, contato:alvo.contato||alvo.nome, empresa:alvo.empresa})
    }).then(function(r){return r.json();}).then(function(j){
      console.log('RESPOSTA:', JSON.stringify(j));
      document.title = j.ok ? ('✓ ENVIADO · '+(alvo.empresa||alvo.nome)) : ('✗ FALHOU · '+JSON.stringify(j).slice(0,80));
    }).catch(function(e){
      console.log('ERRO:', e.message);
      document.title = '✗ ERRO · '+e.message;
    });
  }, 3000);
})();
