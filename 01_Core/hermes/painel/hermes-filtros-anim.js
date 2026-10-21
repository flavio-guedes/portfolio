(function(){
  if(!state.__filtroAnimCat) state.__filtroAnimCat = null;

  function css(){
    if(document.getElementById('hf5-css')) return;
    var s = ''+
    /* Bloco vira um grid de 2 colunas: rótulo | valores. Fechado: coluna 2 = 0fr. */
    '.hf3-row{align-items:center}'+
    '.hf3-b{display:inline-grid;grid-template-columns:auto 0fr;align-items:center;gap:0;'+
      'transition:grid-template-columns .34s cubic-bezier(.22,1,.36,1), gap .34s cubic-bezier(.22,1,.36,1), padding .25s ease;'+
      'padding:1px 6px;border:1px solid transparent;border-radius:999px}'+
    '.hf3-b.hf5-open{grid-template-columns:auto 1fr;gap:6px;padding:1px 8px;'+
      'border-color:var(--line);background:rgba(255,255,255,.025)}'+
    /* Rótulo clicável, com chevron CSS */'
    '.hf3-b .hf3-l{cursor:pointer;user-select:none;transition:color .18s;'+
      'display:inline-flex;align-items:center;gap:2px}'+
    '.hf3-b .hf3-l::after{content:"";width:4px;height:4px;'+
      'border-right:1.4px solid currentColor;border-bottom:1.4px solid currentColor;'+
      'transform:rotate(45deg) translateY(-1px);transition:transform .25s ease;'+
      'opacity:.55;margin-left:3px;flex-shrink:0;display:inline-block}'+
    '.hf3-b.hf5-open .hf3-l{color:var(--txt)}'+
    '.hf3-b.hf5-open .hf3-l::after{transform:rotate(-135deg) translateY(-1px);opacity:.9}'+
    /* Container dos valores: cresce da esquerda pra direita com clip suave */
    '.hf5-vals{display:inline-flex;gap:4px;overflow:hidden;min-width:0;align-items:center;'+
      'opacity:0;transition:opacity .28s ease .05s}'+
    '.hf3-b.hf5-open .hf5-vals{opacity:1}'+
    '.hf3-b .hf3-p{flex-shrink:0;opacity:0;transform:translateX(-6px);'+
      'transition:opacity .3s ease, transform .3s cubic-bezier(.22,1,.36,1)}'+
    '.hf3-b.hf5-open .hf3-p{opacity:1;transform:none}'+
    '.hf3-b.hf5-open .hf3-p:nth-child(1){transition-delay:.04s}'+
    '.hf3-b.hf5-open .hf3-p:nth-child(2){transition-delay:.08s}'+
    '.hf3-b.hf5-open .hf3-p:nth-child(3){transition-delay:.12s}'+
    '.hf3-b.hf5-open .hf3-p:nth-child(4){transition-delay:.16s}'+
    '.hf3-b.hf5-open .hf3-p:nth-child(5){transition-delay:.20s}'+
    '.hf3-b.hf5-open .hf3-p:nth-child(6){transition-delay:.24s}'+
    '.hf3-b.hf5-open .hf3-p:nth-child(7){transition-delay:.28s}'+
    '.hf3-b.hf5-open .hf3-p:nth-child(8){transition-delay:.32s}';
    var st = document.createElement('style'); st.id = 'hf5-css'; st.textContent = s;
    document.head.appendChild(st);
  }

  function decorate(){
    document.querySelectorAll('.hf3-b').forEach(function(blk){
      var first = blk.querySelector('[data-hf4]');
      if(!first) return;
      var cat = first.getAttribute('data-hf4').split('|')[0];
      if(!cat) return;

      /* Envolve os botões de valor num wrapper (só uma vez por bloco novo) */
      if(!blk.dataset.hf5Ready){
        var vals = document.createElement('div');
        vals.className = 'hf5-vals';
        Array.from(blk.querySelectorAll('.hf3-p')).forEach(function(b){ vals.appendChild(b); });
        blk.appendChild(vals);
        blk.dataset.hf5Ready = '1';
        blk.dataset.hf5Cat = cat;
      }
      /* Aplica estado aberto/fechado */
      if(state.__filtroAnimCat === cat) blk.classList.add('hf5-open');
      else blk.classList.remove('hf5-open');
    });
  }

  function toggle(cat){
    state.__filtroAnimCat = (state.__filtroAnimCat === cat) ? null : cat;
    document.querySelectorAll('.hf3-b[data-hf5-cat]').forEach(function(b){
      if(state.__filtroAnimCat === b.dataset.hf5Cat) b.classList.add('hf5-open');
      else b.classList.remove('hf5-open');
    });
  }

  /* Delegação — sobrevive a cada rerender da barra */
  document.addEventListener('click', function(ev){
    var lbl = ev.target.closest('.hf3-b > .hf3-l');
    if(!lbl) return;
    ev.preventDefault(); ev.stopPropagation();
    var blk = lbl.closest('.hf3-b');
    var cat = blk && blk.dataset.hf5Cat;
    if(cat) toggle(cat);
  }, true);

  function iniciar(){
    css();
    var top = document.getElementById('topbar');
    if(!top){ setTimeout(iniciar, 250); return; }
    var pending = false;
    var obs = new MutationObserver(function(){
      if(pending) return;
      pending = true;
      requestAnimationFrame(function(){ pending = false; decorate(); });
    });
    obs.observe(top, {childList: true, subtree: true});
    decorate();
    /* Rede de segurança: a barra é reescrita periodicamente pelo script de filtros */
    setInterval(decorate, 500);
  }
  iniciar();
})();
