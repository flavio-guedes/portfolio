(function(){
  var URL='http://127.0.0.1:8420/api/conversas';
  var estado={conv:[],erro:null,ultima:null,timer:null};

  function eh(v){return String(v==null?'':v).replace(/[<>&"']/g,function(c){return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c];});}
  function ago(ts){
    var t=new Date(ts||0).getTime();
    if(!t||isNaN(t)) return '—';
    var s=Math.max(0,Math.round((Date.now()-t)/1000));
    if(s<60) return s+'s';
    if(s<3600) return Math.floor(s/60)+'m';
    if(s<86400) return Math.floor(s/3600)+'h';
    return Math.floor(s/86400)+'d';
  }
  function preview(c){
    var p=c.preview||c.ultima||c.ultimo_texto||c.message||'';
    p=String(p).replace(/\n/g,' ').trim();
    if(p.length>60) p=p.slice(0,58)+'...';
    return p;
  }
  function nome(c){ return c.nome||c.pushName||c.contato||(c.jid?String(c.jid).split('@')[0]:'—'); }
  function ts(c){ return c.atualizado||c.ts||c.quando||c.timestamp||0; }

  function blocoHTML(){
    if(estado.erro){
      return '<div class="rail-section" data-wa-rail>'+
        '<div class="rail-title">WhatsApp <span class="dot err"></span></div>'+
        '<div class="rail-item"><span class="dot err"></span><div><b>Servidor offline</b><span class="mini">'+eh(estado.erro)+'</span></div></div>'+
      '</div>';
    }
    var lista=(Array.isArray(estado.conv)?estado.conv:[]).slice().sort(function(a,b){ return new Date(ts(b))-new Date(ts(a)); }).slice(0,10);
    if(!lista.length){
      return '<div class="rail-section" data-wa-rail>'+
        '<div class="rail-title">WhatsApp <span class="dot warm"></span></div>'+
        '<div class="rail-item"><div><span class="mini">Nenhuma conversa sincronizada ainda.</span></div></div>'+
      '</div>';
    }
    return '<div class="rail-section" data-wa-rail>'+
      '<div class="rail-title">WhatsApp <span class="dot ok"></span> <span style="color:var(--muted);font-weight:500;text-transform:none;letter-spacing:0;font-size:10px">'+lista.length+'</span></div>'+
      lista.map(function(c){
        var p=preview(c);
        return '<div class="rail-item">'+
          '<span class="dot ok" style="margin-top:6px"></span>'+
          '<div style="min-width:0;flex:1">'+
            '<b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+eh(nome(c))+'</b>'+
            (p?'<span class="mini" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">'+eh(p)+'</span>':'')+
          '</div>'+
          '<span class="mini" style="white-space:nowrap;font-variant-numeric:tabular-nums">'+eh(ago(ts(c)))+'</span>'+
        '</div>';
      }).join('')+
      (estado.ultima?'<div class="sub" style="padding-top:6px;font-size:10px;color:var(--muted2)">atualizado '+eh(estado.ultima)+'</div>':'')+
    '</div>';
  }

  function injetar(){
    var rail=document.getElementById('rightRail');
    if(!rail) return;
    var atual=rail.querySelector('[data-wa-rail]');
    var html=blocoHTML();
    if(atual){ atual.outerHTML=html; }
    else { rail.insertAdjacentHTML('afterbegin',html); }
  }

  function buscar(){
    fetch(URL,{cache:'no-store'}).then(function(r){ return r.json(); }).then(function(d){
      estado.erro=null;
      estado.conv=Array.isArray(d)?d:(d&&Array.isArray(d.conversas)?d.conversas:[]);
      estado.ultima=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      injetar();
    }).catch(function(e){
      estado.erro=String(e&&e.message||e);
      injetar();
    });
  }

  function vigiar(){
    var rail=document.getElementById('rightRail');
    if(!rail) return;
    if(!rail.querySelector('[data-wa-rail]')) injetar();
  }
  var obs=new MutationObserver(vigiar);
  function iniciarObserver(){
    var rail=document.getElementById('rightRail');
    if(rail){ obs.observe(rail,{childList:true}); }
    else setTimeout(iniciarObserver,300);
  }
  iniciarObserver();

  buscar();
  estado.timer=setInterval(buscar,20000);
})();
