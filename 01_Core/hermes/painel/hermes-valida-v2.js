(function(){
  function limpar(s){return String(s||'').replace(/\D/g,'');}
  var DDD=[11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99];
  function valida(tel){
    var raw=limpar(tel);
    if(!raw)return {classe:'sem'};
    var d=raw;
    /* Remove DDI 55 se existir e sobrar DDD válido */
    if(d.length>=12 && d.slice(0,2)==='55'){
      var semDdi=d.slice(2);
      if(semDdi.length>=10 && DDD.indexOf(parseInt(semDdi.slice(0,2),10))>=0) d=semDdi;
    }
    if(d.length===13 && d[0]==='0') d=d.slice(1);
    if(d.length<10) return {classe:'inv',motivo:'curto ('+d.length+')'};
    if(d.length>11) return {classe:'inv',motivo:'longo ('+d.length+')'};
    var ddd=parseInt(d.slice(0,2),10);
    if(DDD.indexOf(ddd)<0) return {classe:'inv',motivo:'DDD '+ddd};
    if(d.length===11){
      if(d[2]!=='9') return {classe:'inv',motivo:'11d sem 9'};
      return {classe:'ok'};
    }
    /* 10 dígitos */
    if(d[2]==='9') return {classe:'inv',motivo:'10d com 9'};
    /* Se o primeiro do número (posição 2) é 6-9, provavelmente celular antigo */
    var primeiro=parseInt(d[2],10);
    if(primeiro>=6){
      var novo=d.slice(0,2)+'9'+d.slice(2);
      return {classe:'fix',novo:novo};
    }
    /* Fixo - número começando com 2-5 é fixo válido */
    return {classe:'ok'};
  }
  function analisa(){
    if(typeof state==='undefined'||!state.opportunities){setTimeout(analisa,300);return;}
    var c={sem:0,ok:0,fix:0,inv:0,total:0};
    var fixes=[],invs=[];
    state.opportunities.forEach(function(o){
      c.total++;
      var tel=o.whatsapp||o.telefone||'';
      var r=valida(tel);
      if(r.classe==='sem'){c.sem++;return;}
      if(r.classe==='ok'){c.ok++;return;}
      if(r.classe==='fix'){c.fix++;fixes.push({id:o.id,empresa:o.empresa,tel:tel,novo:r.novo});return;}
      c.inv++;invs.push({id:o.id,empresa:o.empresa,tel:tel,motivo:r.motivo});
    });
    var txt='=== VALIDAÇÃO (v2) ===\n\n';
    txt+='Total: '+c.total+'\n';
    txt+='Sem telefone: '+c.sem+'\n';
    txt+='Válidos: '+c.ok+'\n';
    txt+='Corrigíveis: '+c.fix+'\n';
    txt+='Inválidos: '+c.inv+'\n\n';
    if(fixes.length){
      txt+='--- CORRIGÍVEIS ---\n';
      fixes.forEach(function(x){txt+=x.id+' | '+x.empresa+' | '+x.tel+' → '+x.novo+'\n';});
      txt+='\n';
    }
    if(invs.length){
      txt+='--- INVÁLIDOS ---\n';
      invs.forEach(function(x){txt+=x.id+' | '+x.empresa+' | "'+x.tel+'" | '+x.motivo+'\n';});
    }
    window.__numReport2={contagem:c,fixes:fixes,invs:invs};
    try{
      var a=document.createElement('a');
      a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);
      a.download='numeros-v2.txt';
      document.body.appendChild(a);a.click();a.remove();
    }catch(e){}
    var el=document.createElement('pre');
    el.style.cssText='position:fixed;inset:0;background:#000;color:#0f0;font:12px monospace;padding:24px;z-index:999999;overflow:auto;white-space:pre-wrap';
    el.textContent=txt;
    el.onclick=function(){el.remove();};
    document.body.appendChild(el);
  }
  analisa();
})();
