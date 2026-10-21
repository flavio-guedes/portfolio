(function(){
  function dump(){
    if(typeof state==='undefined'){setTimeout(dump,200);return;}
    var out={};
    // 1) state em memória
    out.state_campaigns=(state.campaigns||[]).map(function(c){return {id:c.id,nome:c.nome,status:c.status,origem:'state'};});
    // 2) localStorage — todas as chaves hermes
    out.localStorage={};
    try{
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        if(/hermes/i.test(k)){
          var v=localStorage.getItem(k);
          out.localStorage[k]={tamanho:v?v.length:0,amostra:v?v.slice(0,400):''};
        }
      }
    }catch(e){out.localStorage_erro=String(e);}
    // 3) user store
    try{
      var raw=localStorage.getItem('hermes-os.v7.user');
      if(raw){
        var p=JSON.parse(raw);
        out.userStore={campanhas:(p.campanhas||[]).map(function(c){return {id:c.id,nome:c.nome,status:c.status,origem:'userStore'};}),listas:(p.listas||[]).map(function(l){return {id:l.id,nome:l.nome,n:l.ids?l.ids.length:0};})};
      }
    }catch(e){out.userStore_erro=String(e);}
    // 4) fetch do servidor 8420 pra ver se tem campanhas lá
    var chamadas=[];
    ['/api/campanhas','/api/campanha','/api/leads','/api/status'].forEach(function(u){
      chamadas.push(fetch('http://127.0.0.1:8420'+u,{cache:'no-store'}).then(function(r){return r.text();}).then(function(t){out['server'+u]={ok:true,status:200,corpo:t.slice(0,800)};})['catch'](function(e){out['server'+u]={ok:false,erro:String(e.message)};}));
    });
    Promise.all(chamadas).then(function(){
      var txt=JSON.stringify(out,null,2);
      try{
        var a=document.createElement('a');
        a.href='data:application/json;charset=utf-8,'+encodeURIComponent(txt);
        a.download='raiox.json';
        document.body.appendChild(a);a.click();a.remove();
      }catch(e){}
      var el=document.createElement('pre');
      el.style.cssText='position:fixed;inset:0;background:#000;color:#0f0;font:11px monospace;padding:20px;z-index:999999;overflow:auto;white-space:pre-wrap';
      el.textContent=txt+'\n\n(1) Baixei um raiox.json também. (2) Clique nesta área pra fechar.';
      el.onclick=function(){el.remove();};
      document.body.appendChild(el);
    });
  }
  dump();
})();
