(function(){
  function log(){
    if(typeof state==='undefined'||!state.campaigns){setTimeout(log,200);return;}
    var txt='=== CAMPANHAS NA BASE ===\n\n';
    state.campaigns.forEach(function(c,i){
      txt+=(i+1)+') id='+c.id+'  nome="'+c.nome+'"  status='+(c.status||'?')+'\n';
    });
    try{
      localStorage.setItem('__dump_camps', txt);
      var a=document.createElement('a');
      a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);
      a.download='campanhas.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }catch(e){}
    var el=document.createElement('pre');
    el.style.cssText='position:fixed;bottom:8px;left:8px;background:#000;color:#0f0;font:11px monospace;padding:10px;z-index:999999;max-height:30vh;overflow:auto;border:1px solid #0f0';
    el.textContent='Download iniciado. Arquivo: campanhas.txt\n\n'+txt;
    document.body.appendChild(el);
  }
  log();
})();
