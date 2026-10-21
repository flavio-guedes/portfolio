(function(){
  function log(){
    if(typeof state==='undefined'||!state.campaigns){setTimeout(log,200);return;}
    var txt='=== CAMPANHAS NA BASE ===\n\n';
    state.campaigns.forEach(function(c,i){
      txt+=(i+1)+') id='+c.id+'  nome="'+c.nome+'"  status='+(c.status||'?')+'  lista='+(c.lista||'-')+'\n';
    });
    var el=document.createElement('pre');
    el.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:#000;color:#0f0;font:12px monospace;padding:20px;z-index:999999;overflow:auto;white-space:pre-wrap';
    el.textContent=txt+'\\n\\nCopie este conteúdo e cole no chat.';
    el.onclick=function(){el.remove();};
    document.body.appendChild(el);
  }
  log();
})();
