(function(){
  function limpar(s){return String(s||'').replace(/\D/g,'');}
  var DDDS_VALIDOS=[11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99];
  function valida(tel){
    var d=limpar(tel);
    if(!d)return {ok:false,motivo:'vazio'};
    /* Tira DDI 55 do começo */
    if(d.length>=12&&d.slice(0,2)==='55')d=d.slice(2);
    if(d.length===13&&d[0]==='0')d=d.slice(1);
    if(d.length<10)return {ok:false,motivo:'curto demais ('+d.length+' dígitos)'};
    if(d.length>11)return {ok:false,motivo:'longo demais ('+d.length+' dígitos)'};
    var ddd=parseInt(d.slice(0,2),10);
    if(DDDS_VALIDOS.indexOf(ddd)<0)return {ok:false,motivo:'DDD inválido ('+ddd+')'};
    if(d.length===11&&d[2]!=='9')return {ok:false,motivo:'celular sem 9 inicial'};
    if(d.length===10&&d[2]==='9')return {ok:false,motivo:'celular sem dígito extra'};
    /* Variação do nono dígito: se 10 dígitos e começa com 6-9, pode ser celular sem 9 */
    if(d.length===10&&/^[6-9]/.test(d.slice(2)))return {ok:true,corrigido:d.slice(0,2)+'9'+d.slice(2),nota:'provavelmente celular antigo sem 9'};
    return {ok:true,corrigido:d};
  }
  function analisa(){
    if(typeof state==='undefined'||!state.opportunities){setTimeout(analisa,300);return;}
    var stats={total:0,sem:0,ok:0,corrigivel:0,inv:0};
    var invalidos=[],corrigiveis=[];
    state.opportunities.forEach(function(o){
      stats.total++;
      var tel=o.whatsapp||o.telefone||'';
      var r=valida(tel);
      if(!r.ok&&r.motivo==='vazio'){stats.sem++;return;}
      if(r.ok&&r.corrigido&&r.corrigido!==limpar(tel)){stats.corrigivel++;corrigiveis.push({id:o.id,empresa:o.empresa,tel:tel,novo:r.corrigido,nota:r.nota});return;}
      if(r.ok){stats.ok++;return;}
      stats.inv++;invalidos.push({id:o.id,empresa:o.empresa,contato:o.contato,tel:tel,motivo:r.motivo});
    });
    var txt='=== VALIDAÇÃO DE NÚMEROS ===\n\n';
    txt+='Total de leads: '+stats.total+'\n';
    txt+='Sem telefone: '+stats.sem+'\n';
    txt+='Válidos: '+stats.ok+'\n';
    txt+='Corrigíveis (9º dígito): '+stats.corrigivel+'\n';
    txt+='Inválidos: '+stats.inv+'\n\n';
    if(corrigiveis.length){
      txt+='--- CORRIGÍVEIS ---\n';
      corrigiveis.slice(0,80).forEach(function(x){txt+=x.id+' | '+x.empresa+' | '+x.tel+' → '+x.novo+' ('+x.nota+')\n';});
      if(corrigiveis.length>80)txt+='... + '+(corrigiveis.length-80)+'\n';
      txt+='\n';
    }
    if(invalidos.length){
      txt+='--- INVÁLIDOS ---\n';
      invalidos.slice(0,80).forEach(function(x){txt+=x.id+' | '+x.empresa+' | "'+x.tel+'" | '+x.motivo+'\n';});
      if(invalidos.length>80)txt+='... + '+(invalidos.length-80)+'\n';
    }
    window.__numReport={stats:stats,invalidos:invalidos,corrigiveis:corrigiveis};
    try{
      var a=document.createElement('a');
      a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);
      a.download='numeros-analise.txt';
      document.body.appendChild(a);a.click();a.remove();
    }catch(e){}
    var el=document.createElement('pre');
    el.style.cssText='position:fixed;inset:0;background:#000;color:#0f0;font:12px monospace;padding:24px;z-index:999999;overflow:auto;white-space:pre-wrap';
    el.textContent=txt+'\n\n(Arquivo numeros-analise.txt também foi baixado)\nClique para fechar.';
    el.onclick=function(){el.remove();};
    document.body.appendChild(el);
  }
  analisa();
})();
