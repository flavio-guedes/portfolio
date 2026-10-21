(function(){
  try{
    var origFetch=window.fetch;
    window.fetch=function(url,opts){
      if(typeof url==='string' && url.indexOf('127.0.0.1:8500/api/arquivos')>=0 && !window.__ragLog){
        return origFetch.apply(this,arguments).then(function(r){
          return r.clone().json().then(function(d){ window.__ragLog=d; return r; });
        });
      }
      return origFetch.apply(this,arguments);
    };
  }catch(e){}

  document.addEventListener('click',function(ev){
    var b=ev.target.closest('[data-chat-example]');
    if(!b||!b.closest('#chatBody')) return;
    var q=b.dataset.chatExample||'';
    if(q!=='ler arquivo' && q!=='listar arquivos') return;
    ev.preventDefault(); ev.stopPropagation();
    var body=document.getElementById('chatBody');
    if(!body) return;
    if(!window.__ragLog){
      body.insertAdjacentHTML('beforeend','<div class="msg hermes"><strong>Hermes</strong><br>Servidor RAG não respondeu ainda.</div>');
      body.scrollTop=body.scrollHeight;
      return;
    }
    var arqs=window.__ragLog.arquivos||[];
    var html='<strong>'+arqs.length+' arquivos em <em>'+String(window.__ragLog.pasta||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</em></strong>';
    html+=arqs.map(function(a){return '<div class="kv"><span style="text-align:left;color:var(--txt)">'+String(a.nome).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'<br><span class="sub">'+String(a.conteudo||'').length+' caracteres</span></span></div>';}).join('');
    body.insertAdjacentHTML('beforeend','<div class="msg hermes"><strong>Hermes</strong><br>'+html+'</div>');
    body.scrollTop=body.scrollHeight;
  },true);
})();
