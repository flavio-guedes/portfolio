(function(){
  function show(){
    if(typeof state==='undefined'){setTimeout(show,200);return;}
    var cs=state.campaigns||[];
    var mem=cs.map(function(c){
      return c.id+' | '+c.nome+' | status='+c.status+' | sugestao='+!!c.sugestao+' | visivel='+(c.visible!==false);
    }).join('\n')||'(vazio)';
    var us='';
    try{
      var raw=localStorage.getItem('hermes-os.v7.user');
      var st=raw?JSON.parse(raw):{};
      us=(st.campanhas||[]).map(function(c){return c.id+' | '+c.nome+' | status='+c.status+' | sugestao='+!!c.sugestao;}).join('\n')||'(vazio)';
    }catch(e){us='erro: '+e.message;}
    var view=state.view||'(?)';
    var emMemoria=cs.filter(function(c){return String(c.id).indexOf('WHA')===0;}).length;
    var txt=
      '=== ESTADO ===\n'+
      'view atual: '+view+'\n'+
      'campanhas em memoria: '+cs.length+'\n'+
      'campanhas WHA em memoria: '+emMemoria+'\n\n'+
      '=== CAMPANHAS EM MEMORIA ===\n'+mem+'\n\n'+
      '=== CAMPANHAS NO USERSTORE ===\n'+us+'\n';
    try{
      var a=document.createElement('a');
      a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);
      a.download='diag-wha.txt';
      document.body.appendChild(a);a.click();a.remove();
    }catch(e){}
    var el=document.createElement('pre');
    el.style.cssText='position:fixed;inset:0;background:#000;color:#0f0;font:12px monospace;padding:24px;z-index:999999;overflow:auto;white-space:pre-wrap';
    el.textContent=txt+'\n\nClique para fechar.';
    el.onclick=function(){el.remove();};
    document.body.appendChild(el);
  }
  show();
})();
