(function(){
  if(window.__recon) return; window.__recon=true;
  function go(){
    if(typeof state==='undefined'){setTimeout(go,300);return;}
    var leads = state.opportunities||[];
    var rep = { total: leads.length, campos: {}, tentativas: [] };

    leads.slice(0,5).forEach(function(o){
      Object.keys(o).forEach(function(k){
        if(!rep.campos[k]) rep.campos[k]=[];
        var v=o[k], s=typeof v==='object'?JSON.stringify(v).slice(0,60):String(v).slice(0,60);
        if(rep.campos[k].indexOf(s)<0) rep.campos[k].push(s);
      });
    });

    var TK=['temperatura','temp','temperature','classe','classificacao','nivel','rank','status_temp','lead_temp','score_temp'];
    var CK=['cargo','papel','role','funcao','categoria','tipo_cargo','nivel_cargo'];
    var TV=['quent','hot','alta','alto','A','1','warm'];
    var CV=['decisor','decision','decis'];
    TK.forEach(function(tk){CK.forEach(function(ck){TV.forEach(function(tv){CV.forEach(function(cv){
      var m=leads.filter(function(o){
        var t=String(o[tk]||'').toLowerCase(), c=String(o[ck]||'').toLowerCase();
        return t.indexOf(tv.toLowerCase())>=0 && c.indexOf(cv)>=0;
      });
      if(m.length>0 && m.length<500) rep.tentativas.push({f:tk+'~'+tv+' & '+ck+'~'+cv, n:m.length, ids:m.map(function(x){return x.id})});
    })})})})});

    var exato = rep.tentativas.filter(function(t){return t.n===83});
    var quase = rep.tentativas.filter(function(t){return t.n>=78&&t.n<=88});

    var txt='Diagnóstico dos Leads\n\nTotal: '+rep.total+'\n\nCampos detectados:\n';
    Object.keys(rep.campos).sort().forEach(function(k){
      txt+='  '+k+' : '+rep.campos[k].slice(0,3).join(' | ')+'\n';
    });
    txt+='\nCombos que produzem EXATAMENTE 83:\n';
    txt += exato.length ? exato.map(function(t){return '  ✓ '+t.f+' → '+t.n}).join('\n') : '  (nenhum)\n';
    txt+='\nCombos próximos (78–88):\n';
    txt += quase.length ? quase.map(function(t){return '  · '+t.f+' → '+t.n}).join('\n') : '  (nenhum)\n';

    var el=document.createElement('div');
    el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999999;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Manrope,sans-serif';
    el.innerHTML='<div style="background:#fff;color:#111;max-width:900px;max-height:85vh;overflow:auto;border-radius:14px;padding:22px;font:12px ui-monospace,Menlo,monospace;white-space:pre-wrap;box-shadow:0 20px 60px rgba(0,0,0,.4)">'+
      txt.replace(/[<>&]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c]})+
      '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;font-family:Manrope,sans-serif">'+
      (quase.length?'<button id="__recUse" style="padding:6px 14px;border:1px solid #111;background:#111;color:#fff;border-radius:8px;cursor:pointer;font:600 12px Manrope">criar lista com "'+quase[0].f+'" ('+quase[0].n+' ids)</button>':'')+
      '<button id="__recDl" style="padding:6px 14px;border:1px solid #ccc;background:#fff;color:#111;border-radius:8px;cursor:pointer;font:600 12px Manrope">baixar hermes-recon.txt</button>'+
      '<button onclick="this.closest(\'div\').parentElement.remove()" style="padding:6px 14px;border:1px solid #ccc;background:#fff;color:#111;border-radius:8px;cursor:pointer;font:600 12px Manrope">fechar</button>'+
      '</div></div>';
    document.body.appendChild(el);

    document.getElementById('__recDl').onclick=function(){
      var a=document.createElement('a');
      a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);
      a.download='hermes-recon.txt'; document.body.appendChild(a); a.click(); a.remove();
    };
    var b=document.getElementById('__recUse');
    if(b) b.onclick=function(){
      var t=quase[0];
      var L={id:'LST-'+Date.now(), nome:'Wha - Quentes - Mix - Decisor',
             ids:t.ids, descricao:t.n+' lead(s) · criada na aba Leads',
             criadaEm:new Date().toISOString()};
      state.listas=state.listas||[];
      state.listas=state.listas.filter(function(l){return !/mix.*decisor|decisor.*mix/i.test(l.nome||'')});
      state.listas.push(L);
      try{
        var s=JSON.parse(localStorage.getItem('hermes-os.v7.user')||'{}');
        s.listas=(s.listas||[]).filter(function(l){return !/mix.*decisor|decisor.*mix/i.test(l.nome||'')});
        s.listas.push(L);
        localStorage.setItem('hermes-os.v7.user',JSON.stringify(s));
      }catch(e){}
      if(typeof render==='function')render();
      alert('Lista criada com '+t.n+' leads. Veja em Leads → Públicos salvos.');
      el.remove();
    };
  }
  go();
})();
