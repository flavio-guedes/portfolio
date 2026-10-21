(function(){
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* Estado persistido em memória por sessão */
  if(!state.__filtroRecolhido) state.__filtroRecolhido = {};   /* por categoria */
  if(!state.__filtroBarRecolhida) state.__filtroBarRecolhida = false;

  function cssInj(){
    if(document.getElementById('hf5-css')) return;
    var s = ''+
    /* Barra toda recolhida */
    '.hf3.hf5-total-collapsed .hf3-row{display:none}'+
    '.hf3.hf5-total-collapsed{padding:4px 0 4px;justify-content:flex-end;min-height:0}'+
    '.hf3.hf5-total-collapsed .hf5-expand-hint{display:inline-flex}'+
    /* Bloco individual recolhido: só a etiqueta e um número de ativos */
    '.hf3-b.hf5-mini{padding:1px 6px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.02);gap:4px}'+
    '.hf3-b.hf5-mini .hf3-l{color:var(--muted);font-size:9px;letter-spacing:.08em}'+
    '.hf3-b.hf5-mini .hf5-count{color:var(--c);font-size:9.5px;font-weight:700}'+
    '.hf3-b .hf5-chev{opacity:.5;font-size:8px;cursor:pointer;padding:0 2px;user-select:none;transition:.15s;line-height:1}'+
    '.hf3-b .hf5-chev:hover{opacity:1}'+
    '.hf3-b.hf5-mini .hf5-chev{color:var(--muted)}'+
    /* Indicador (mostra quais categorias têm filtro ativo, mesmo recolhidas) */
    '.hf3-b .hf5-dot{width:5px;height:5px;border-radius:50%;background:var(--accent);display:none;flex-shrink:0}'+
    '.hf3-b.hf5-mini.has-active .hf5-dot{display:inline-block}'+
    '.hf5-expand-hint{display:none;align-items:center;gap:4px;font-size:9.5px;font-weight:700;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;padding:2px 8px;border:1px dashed var(--line);border-radius:999px;cursor:pointer;user-select:none;background:transparent;font-family:inherit}'+
    '.hf5-expand-hint:hover{color:var(--txt);border-color:var(--line2)}'+
    '.hf5-expand-hint .hf5-active-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}';
    var st = document.createElement('style'); st.id = 'hf5-css'; st.textContent = s;
    document.head.appendChild(st);
  }

  /* Transforma o HTML dos filtros adicionando chevron em cada bloco */
  function decorate(root){
    if(!root) return;
    root.querySelectorAll('.hf3-b').forEach(function(blk){
      var lbl = blk.querySelector('.hf3-l');
      if(!lbl) return;
      var cat = null;
      /* Pega o nome da categoria a partir do primeiro botão (data-hf4=cat|val) */
      var primeiro = blk.querySelector('[data-hf4]');
      if(primeiro) cat = primeiro.getAttribute('data-hf4').split('|')[0];
      if(!cat) return;
      /* Chevron */
      if(!blk.querySelector('.hf5-chev')){
        var ch = document.createElement('span');
        ch.className = 'hf5-chev';
        ch.textContent = '▾';
        ch.title = 'Recolher esta categoria';
        ch.setAttribute('data-hf5-toggle', cat);
        lbl.parentNode.insertBefore(ch, lbl.nextSibling);
      }
      /* Contador de ativos no modo mini */
      var ativos = 0;
      blk.querySelectorAll('[data-hf4]').forEach(function(b){
        var v = b.getAttribute('data-hf4').split('|')[1];
        if(v && v !== 'all' && b.classList.contains('on')) ativos++;
      });
      var cnt = blk.querySelector('.hf5-count');
      if(!cnt){
        cnt = document.createElement('span');
        cnt.className = 'hf5-count';
        lbl.parentNode.insertBefore(cnt, lbl.nextSibling);
      }
      cnt.textContent = ativos ? '· '+ativos : '';
      if(ativos) blk.classList.add('has-active'); else blk.classList.remove('has-active');

      /* Aplica modo mini se a categoria estiver recolhida */
      if(state.__filtroRecolhido[cat]){
        blk.classList.add('hf5-mini');
        /* Esconde os botões de valor (mas mantém no DOM para não quebrar eventos) */
        blk.querySelectorAll('.hf3-p').forEach(function(b){ b.style.display = 'none'; });
        /* Esconde o primeiro botão (·) também */
        var ch2 = blk.querySelector('.hf5-chev');
        if(ch2) ch2.textContent = '▸';
      } else {
        blk.classList.remove('hf5-mini');
        blk.querySelectorAll('.hf3-p').forEach(function(b){ b.style.display = ''; });
        var ch3 = blk.querySelector('.hf5-chev');
        if(ch3) ch3.textContent = '▾';
      }
    });
  }

  /* Botão de recolher tudo / expandir tudo — aparece na barra */
  function addGlobalToggle(root){
    if(!root) return;
    if(root.querySelector('[data-hf5-global]')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hf5-expand-hint';
    btn.setAttribute('data-hf5-global', '1');
    btn.innerHTML = '<span class="hf5-active-dot"></span> Filtros';
    /* Posiciona antes da linha dos blocos */
    var row = root.querySelector('.hf3-row');
    if(row && row.parentNode) row.parentNode.insertBefore(btn, row.nextSibling);
    else root.appendChild(btn);
  }

  function aplicarGlobal(root){
    if(!root) return;
    var btn = root.querySelector('[data-hf5-global]');
    if(!btn) return;
    if(state.__filtroBarRecolhida){
      root.classList.add('hf5-total-collapsed');
    } else {
      root.classList.remove('hf5-total-collapsed');
    }
  }

  /* Clicou no chevron de uma categoria */
  document.addEventListener('click', function(ev){
    var ch = ev.target.closest('[data-hf5-toggle]');
    if(ch){
      ev.preventDefault(); ev.stopPropagation();
      var cat = ch.getAttribute('data-hf5-toggle');
      state.__filtroRecolhido[cat] = !state.__filtroRecolhido[cat];
      /* Reaplica */
      var root = ch.closest('.hf3');
      if(root) decorate(root);
      return;
    }
    var gl = ev.target.closest('[data-hf5-global]');
    if(gl){
      ev.preventDefault(); ev.stopPropagation();
      state.__filtroBarRecolhida = !state.__filtroBarRecolhida;
      var root2 = gl.closest('.hf3');
      if(root2) aplicarGlobal(root2);
      return;
    }
  }, true);

  function vigiar(){
    cssInj();
    var top = document.getElementById('topbar');
    if(!top){ setTimeout(vigiar, 300); return; }
    var barra = top.querySelector('[data-hf4-bar]');
    if(barra){
      addGlobalToggle(barra);
      decorate(barra);
      aplicarGlobal(barra);
    }
    setTimeout(vigiar, 800);
  }
  vigiar();
})();
