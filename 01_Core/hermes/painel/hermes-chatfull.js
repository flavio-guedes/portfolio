(function(){
  var css=''+
  '#chatPanel.chat-full{position:fixed;left:20px;right:20px;top:20px;bottom:20px;width:auto;height:auto;max-width:none;max-height:none;z-index:9998}'+
  '#chatPanel.chat-full .chat-body{padding:24px 32px;font-size:13.5px;gap:14px}'+
  '#chatPanel.chat-full .msg{max-width:75%;padding:14px 18px;font-size:13.5px}'+
  '#chatPanel.chat-full .chat-head{padding:16px 24px}'+
  '#chatPanel.chat-full .chat-head strong{font-size:18px}'+
  '#chatPanel.chat-full .chat-foot{padding:14px 24px}'+
  '#chatPanel.chat-full .chat-foot input{padding:12px 16px;font-size:13.5px}'+
  '.chat-btn{background:transparent;border:0;color:var(--muted);font-size:16px;padding:4px 8px;cursor:pointer;line-height:1;border-radius:6px;transition:.15s}'+
  '.chat-btn:hover{color:var(--txt);background:rgba(255,255,255,.06)}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  function ensureBtn(){
    var head=document.querySelector('#chatPanel .chat-head');
    if(!head) return;
    if(head.querySelector('[data-chat-full]')) return;
    var close=head.querySelector('.close');
    var btn=document.createElement('button');
    btn.className='chat-btn';
    btn.setAttribute('data-chat-full','');
    btn.title='Expandir (Cmd+Shift+F)';
    btn.textContent='⤢';
    if(close) head.insertBefore(btn,close);
    else head.appendChild(btn);
  }
  function toggle(){
    var p=document.getElementById('chatPanel');
    if(!p) return;
    p.classList.toggle('chat-full');
    var b=document.querySelector('[data-chat-full]');
    if(b) b.textContent=p.classList.contains('chat-full')?'⤡':'⤢';
  }
  document.addEventListener('click',function(ev){
    if(ev.target.closest('[data-chat-full]')){ ev.preventDefault(); ev.stopPropagation(); toggle(); }
  },true);
  document.addEventListener('keydown',function(ev){
    if((ev.metaKey||ev.ctrlKey)&&ev.shiftKey&&(ev.key==='f'||ev.key==='F')){ ev.preventDefault(); toggle(); }
    if(ev.key==='Escape'){
      var p=document.getElementById('chatPanel');
      if(p&&p.classList.contains('chat-full')){ ev.preventDefault(); p.classList.remove('chat-full'); var b=document.querySelector('[data-chat-full]'); if(b) b.textContent='⤢'; }
    }
  },true);

  var _origOpen=null;
  function hookOpen(){
    var fab=document.getElementById('chatFab');
    if(!fab) return;
    if(fab.__fullHooked) return;
    fab.__fullHooked=true;
    fab.addEventListener('click',function(){ setTimeout(ensureBtn,20); });
  }
  hookOpen();
  ensureBtn();
  setInterval(ensureBtn,800);
})();
