(function(){
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[?!.,;:]+/g,' ').replace(/\s+/g,' ').trim();}
  function eh(v){return String(v==null?'':v).replace(/[<>&"']/g,function(c){return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c];});}
  var cmdWords=['resumo','atencao','urgente','quente','quentes','frio','frios','fila','campanhas','campanha','conversas','conversa','ajuda','help','lista','listas','oi','ola'];
  var verbos=['quantos','quantas','criar','cria','disparar','dispara','pausar','retomar','excluir','abrir','buscar','busca','procure','arquivo','procurar','adicionar','mande','manda','autorizar','ler','liste'];
  function ehCmd(raw){
    var t=norm(raw);
    if(t.indexOf(' ')!==-1) return false;
    if(raw.length<3) return false;
    for(var i=0;i<cmdWords.length;i++) if(t===cmdWords[i]) return true;
    for(var j=0;j<verbos.length;j++) if(t===verbos[j]) return true;
    return false;
  }
  function contemPalavra(hay,w){
    var re=new RegExp('(^|\\s)'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\\s|$)');
    return re.test(hay);
  }
  function buscar(raw,body){
    var qn=norm(raw);
    var palavras=qn.split(' ').filter(function(w){return w.length>=3;});
    if(!palavras.length) return false;
    var arr=state.opportunities||[];
    var hits=[];
    for(var i=0;i<arr.length;i++){
      var o=arr[i];
      var emp=norm(o.empresa||'');
      var cont=norm(o.contato||'');
      var alvo=emp+' | '+cont;
      var casou=0;
      palavras.forEach(function(w){ if(contemPalavra(alvo,w)) casou++; });
      if(casou<palavras.length) continue;
      var posEmp=emp.indexOf(palavras[0]);
      var posCont=cont.indexOf(palavras[0]);
      var pos=(posEmp>=0?posEmp:(posCont>=0?200+posCont:999));
      var score=(palavras.length*1000)+(posEmp===0?500:0)-(pos*2);
      hits.push({o:o,p:score});
    }
    hits.sort(function(a,b){return b.p-a.p;});
    var top=hits.slice(0,8).map(function(h){return h.o;});
    var html='<strong>'+hits.length+' resultado(s) para "'+eh(raw)+'"</strong>';
    if(!top.length){ html='<strong>Nada encontrado para "'+eh(raw)+'"</strong>'; }
    else {
      html+='<div class="sub" style="margin:4px 0 8px">Busca por palavra inteira em empresa ou contato</div>';
      html+=top.map(function(o){
        var cor=(o.temperatura==='Quente'||o.temperatura==='Muito quente')?'var(--urgent)':o.temperatura==='Morno'?'var(--warn)':'var(--muted)';
        return '<div class="kv" style="padding:8px 0;cursor:pointer" data-open="'+eh(o.id)+'">'+
          '<span style="text-align:left;color:var(--txt);font-weight:600;min-width:0">'+eh(o.empresa||o.contato||'—')+
          '<br><span class="sub">'+eh(o.descricao||o.segmento||'')+'</span></span>'+
          '<b style="white-space:nowrap"><span class="chip-s">'+eh(o.grupo||'?')+'</span> <span class="chip-s" style="color:'+cor+'">'+(o.score||0)+'</span></b></div>';
      }).join('');
    }
    body.insertAdjacentHTML('beforeend','<div class="msg hermes"><strong>Hermes</strong><br>'+html+'</div>');
    body.scrollTop=body.scrollHeight;
    return true;
  }
  function esperar(){
    if(window.__rankPatched4) return;
    window.__rankPatched4=true;
    function intercepta(ev){
      var i=document.getElementById('chatInput');
      if(!i) return;
      var raw=String(i.value||'').trim();
      if(!raw) return;
      if(ehCmd(raw)) return;
      if(/\b(quantos|quantas|criar|cria|disparar|dispara|pausar|retomar|excluir|abrir|buscar|busca|procure|arquivo|procurar|adicionar|mande|manda|autorizar|ler|liste|em|de|para|com|na|no)\b/.test(norm(raw))) return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      var body=document.getElementById('chatBody');
      if(body){
        body.insertAdjacentHTML('beforeend','<div class="msg me">'+eh(raw)+'</div>');
        body.scrollTop=body.scrollHeight;
      }
      i.value='';
      buscar(raw,body);
    }
    document.addEventListener('keydown',function(ev){
      if(ev.key!=='Enter') return;
      if(ev.target.id!=='chatInput') return;
      intercepta(ev);
    },true);
    document.addEventListener('click',function(ev){
      if(!ev.target.closest('#chatSend')) return;
      intercepta(ev);
    },true);
  }
  esperar();
})();
