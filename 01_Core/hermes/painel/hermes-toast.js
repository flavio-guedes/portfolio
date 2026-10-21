(function(){
  if(window.__hermesToast) return; window.__hermesToast=true;
  var CSS=''+
    '#ht-wrap{position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;font-family:Manrope,sans-serif}'+
    '.ht{pointer-events:auto;background:#12171e;color:#f2f4f6;border:1px solid #2a3441;border-radius:10px;'+
      'padding:10px 14px;box-shadow:0 8px 32px rgba(0,0,0,.55);font:12px Manrope;min-width:220px;max-width:340px;'+
      'display:flex;gap:8px;align-items:flex-start;animation:htIn .22s ease-out}'+
    '.ht b{font-weight:700}'+
    '.ht .ht-x{margin-left:auto;opacity:.55;cursor:pointer;font-size:14px;line-height:1;padding:0 4px}'+
    '.ht .ht-x:hover{opacity:1}'+
    '.ht-ok{border-left:3px solid #22c55e}'+
    '.ht-ok .ht-ico{color:#22c55e}'+
    '.ht-erro{border-left:3px solid #ef4444}'+
    '.ht-erro .ht-ico{color:#ef4444}'+
    '.ht-info{border-left:3px solid #60a5fa}'+
    '.ht-info .ht-ico{color:#60a5fa}'+
    '.ht-ico{font-size:14px;font-weight:800;line-height:1;margin-top:1px}'+
    '.ht-body{flex:1;min-width:0;line-height:1.5}'+
    '.ht-sub{font-size:10.5px;color:#8b93a1;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
    '@keyframes htIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
  function css(){ if(document.getElementById('ht-css')) return;
    var s=document.createElement('style'); s.id='ht-css'; s.textContent=CSS; document.head.appendChild(s); }
  function wrap(){ var w=document.getElementById('ht-wrap');
    if(!w){ w=document.createElement('div'); w.id='ht-wrap'; document.body.appendChild(w); } return w; }
  function fechar(el){ try{ el.remove(); }catch(e){} }
  function toast(msg, tipo, sub, ttl){
    css(); var w=wrap();
    var t=tipo||'info';
    var ico = t==='ok'?'✓':t==='erro'?'✗':'ℹ';
    var el=document.createElement('div');
    el.className='ht ht-'+t;
    el.innerHTML='<span class="ht-ico">'+ico+'</span>'+
      '<div class="ht-body"><div><b>'+String(msg||'')+'</b></div>'+
      (sub?'<div class="ht-sub">'+String(sub)+'</div>':'')+'</div>'+
      '<span class="ht-x" title="fechar">✕</span>';
    el.querySelector('.ht-x').onclick=function(){fechar(el)};
    w.appendChild(el);
    while(w.children.length>3){ fechar(w.firstChild); }
    var ms=ttl||4000;
    setTimeout(function(){ if(el.parentNode){ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(function(){fechar(el)},300);} }, ms);
    return el;
  }
  window.__toast = toast;
  window.__toastOK    = function(m,s){ return toast(m,'ok',s); };
  window.__toastErro  = function(m,s){ return toast(m,'erro',s); };
  window.__toastInfo  = function(m,s){ return toast(m,'info',s); };
})();
