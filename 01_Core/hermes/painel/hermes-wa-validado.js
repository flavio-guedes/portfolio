(function(){
  function limpar(s){return String(s||'').replace(/\D/g,'');}
  var DDD=[11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99];
  function valido(tel){
    var d=limpar(tel);
    if(!d)return false;
    if(d.length>=12 && d.slice(0,2)==='55'){
      var s=d.slice(2);
      if(s.length>=10 && DDD.indexOf(parseInt(s.slice(0,2),10))>=0) d=s;
    }
    if(d.length===13 && d[0]==='0') d=d.slice(1);
    if(d.length!==11) return false;
    var ddd=parseInt(d.slice(0,2),10);
    if(DDD.indexOf(ddd)<0) return false;
    if(d[2]!=='9') return false;
    return true;
  }
  var validos={};
  function calcular(){
    if(typeof state==='undefined'||!state.opportunities){setTimeout(calcular,300);return;}
    validos={};
    state.opportunities.forEach(function(o){
      var tel = o.whatsapp || o.telefone || '';
      if(valido(tel)) validos[o.id]=true;
    });
    injetar();
  }
  var BADGE='<span data-wa-badge="" title="WhatsApp validado" style="display:inline-flex;align-items:center;gap:3px;background:rgba(74,222,128,.10);border:1px solid rgba(74,222,128,.30);color:#4ade80;font-size:8.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:1px 6px;border-radius:999px;margin-left:6px;vertical-align:middle;white-space:nowrap;line-height:1.5;font-family:var(--font-body)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="width:7px;height:7px"><path d="M20 6L9 17l-5-5"/></svg>WA</span>';
  function injetar(){
    document.querySelectorAll('[data-open]').forEach(function(el){
      var id = el.getAttribute('data-open');
      if(!id||!validos[id]) return;
      if(el.querySelector('[data-wa-badge]')) return;
      var alvo = el.querySelector('.name, .t, h4, .kcard h4, .rc2-title, .cl-row .n, .min-row .title, .agenda-o');
      if(!alvo) return;
      alvo.insertAdjacentHTML('beforeend', BADGE);
    });
  }
  function vigiar(){
    var c=document.getElementById('content');
    if(!c){setTimeout(vigiar,300);return;}
    new MutationObserver(injetar).observe(c,{childList:true,subtree:true});
    injetar();
  }
  calcular();
  vigiar();
  setInterval(injetar,1500);
  setInterval(calcular,60000);
})();
