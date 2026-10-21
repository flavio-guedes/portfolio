(function(){
  if(window.__semVerde) return; window.__semVerde=true;

  /* Detecta overlays de diagnóstico (preto com texto verde) */
  function ehVerde(el){
    if(!el || el.tagName!=='PRE') return false;
    try{
      var cs = getComputedStyle(el);
      var bg = cs.backgroundColor||'';
      var fg = cs.color||'';
      /* preto escuro + verde/lima */
      var preto = /rgba?\(\s*0\s*,\s*0\s*,\s*0/.test(bg) || bg==='rgb(0, 0, 0)' || bg==='#000';
      var verde = /rgb\(\s*0\s*,\s*255\s*,\s*0/.test(fg) ||
                  /rgb\(\s*0\s*,\s*15[0-9]\s*,\s*0/.test(fg) ||
                  /#0f0|#00ff00|#0fa|#0f8/i.test(fg) ||
                  /rgb\(\s*34\s*,\s*197\s*,\s*94/.test(fg);
      var cobre = cs.position==='fixed' && (cs.inset||cs.top) ;
      return (preto && verde) || (preto && cobre);
    }catch(e){ return false; }
  }

  function mata(el){
    if(!ehVerde(el)) return;
    el.remove();
    console.log('[sem-verde] overlay removido');
  }

  /* 1) Intercepta appendChild e insertBefore pra bloquear antes de aparecer */
  var _ac = Node.prototype.appendChild;
  Node.prototype.appendChild = function(node){
    if(node && node.nodeType===1 && node.tagName==='PRE'){
      /* checa inline estilo (mais confiável antes de estar no DOM) */
      var st = node.getAttribute('style')||'';
      if(/background\s*:\s*#000/i.test(st) && /color\s*:\s*#0f0/i.test(st)){
        console.log('[sem-verde] append bloqueado');
        return node;
      }
    }
    return _ac.apply(this, arguments);
  };

  var _ib = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(n, ref){
    if(n && n.nodeType===1 && n.tagName==='PRE'){
      var st = n.getAttribute('style')||'';
      if(/background\s*:\s*#000/i.test(st) && /color\s*:\s*#0f0/i.test(st)){
        console.log('[sem-verde] insert bloqueado');
        return n;
      }
    }
    return _ib.apply(this, arguments);
  };

  /* 2) Rede de segurança: varre o DOM de tempos em tempos */
  function varre(){
    document.querySelectorAll('pre').forEach(mata);
  }
  var obs = new MutationObserver(function(muts){
    muts.forEach(function(m){
      m.addedNodes && m.addedNodes.forEach(function(n){
        if(n && n.nodeType===1){
          if(n.tagName==='PRE') mata(n);
          else n.querySelectorAll && n.querySelectorAll('pre').forEach(mata);
        }
      });
    });
  });
  function start(){
    obs.observe(document.documentElement, {childList:true, subtree:true});
    varre();
    setInterval(varre, 800);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
