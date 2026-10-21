(function(){
  const API="http://127.0.0.1:8420", TOKEN="hk_dev_local_troque_depois";
  const MICRO={
    D0:["Validar nome/empresa no LinkedIn","Confirmar número (DDD+9)","Gerar pitch via LLM com contexto","Aprovar texto no painel","Enviar WhatsApp"],
    D3:["Checar resposta nas últimas 72h","Atualizar etapa no CRM","Gerar follow-up D3 (rotina 5 etapas)","Enviar WhatsApp 10h-14h"],
    D7:["Checar resposta","Checar se virou reunião","Gerar mensagem final D7","Enviar WhatsApp","Marcar concluído se sem resposta"]
  };
  async function render(){
    let j; try{ j=await (await fetch(API+"/api/fila/status",{headers:{Authorization:"Bearer "+TOKEN}})).json(); }catch(e){ return; }
    const pend=(j.itens||[]).filter(i=>i.status==="pendente");
    const grupos={}; pend.forEach(i=>{ const e=i.ultima_etapa||"D0"; (grupos[e]=grupos[e]||[]).push(i); });
    const el=document.getElementById("__checklist_fila");
    let html='<div style="position:fixed;top:10px;right:10px;width:340px;max-height:80vh;overflow:auto;background:#12171e;border:1px solid #2a3441;border-radius:10px;padding:12px;font:12px Manrope,sans-serif;color:#f2f4f6;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,.6)">';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="color:#e0b878">⚕ Checklist da Fila</b><span style="cursor:pointer;opacity:.6" onclick="this.closest(\'div\').parentElement.remove()">✕</span></div>';
    html+='<div style="opacity:.6;margin-bottom:10px">Pendentes: <b>'+pend.length+'</b> · Atividade: '+j.atividade+'</div>';
    Object.keys(grupos).sort().forEach(e=>{
      html+='<div style="margin-bottom:12px;padding:8px;background:#181f28;border-radius:6px"><div style="color:#e0b878;font-weight:700;margin-bottom:6px">ETAPA '+e+' <span style="opacity:.6;font-weight:400">('+grupos[e].length+')</span></div>';
      (MICRO[e]||["Revisar manualmente"]).forEach((t,n)=>{ html+='<label style="display:block;padding:3px 0;cursor:pointer"><input type="checkbox" style="margin-right:6px">'+t+'</label>'; });
      html+='<div style="border-top:1px solid #2a3441;margin-top:6px;padding-top:6px;font-size:11px;opacity:.7">';
      grupos[e].forEach(i=>{ const prox=({D0:"D3",D3:"D7"})[e]; const ok=i.emails&&i.emails[prox]; html+='· '+(i.nome||i.id).slice(0,28)+' <span style="color:'+(ok?"#7ec87e":"#e08080")+'">'+(ok?"✓":"⚠")+'</span><br>'; });
      html+='</div></div>';
    });
    html+='<button onclick="location.reload()" style="width:100%;padding:6px;background:#e0b878;border:0;border-radius:6px;color:#090b0f;font-weight:700;cursor:pointer">Recarregar</button>';
    html+='</div>';
    if(!el){ const d=document.createElement("div"); d.id="__checklist_fila"; d.innerHTML=html; document.body.appendChild(d); } else { el.innerHTML=html; }
  }
  render(); setInterval(render, 30000);
})();
