/* HERMES_CHAT v4 · consultas + ações + busca + listas + RAG */
(function(){
  function eh(v){
    if(typeof esc==='function') return esc(v==null?'':String(v));
    return String(v==null?'':v).replace(/[<>&"']/g,function(c){return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c];});
  }
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[?!.,;:]+/g,' ').replace(/\s+/g,' ').trim();}
  function has(t,arr){for(var i=0;i<arr.length;i++) if(t.indexOf(arr[i])>=0) return true; return false;}
  function num(v){return (typeof fmtNum==='function')?fmtNum(v):String(v);}
  function byId(id){return document.getElementById(id);}

  function cardLead(o){
    var cor=(o.temperatura==='Quente'||o.temperatura==='Muito quente')?'var(--urgent)':o.temperatura==='Morno'?'var(--warn)':'var(--muted)';
    return '<div class="kv" style="padding:8px 0;cursor:pointer" data-open="'+eh(o.id)+'">'+
      '<span style="text-align:left;color:var(--txt);font-weight:600;min-width:0">'+eh(o.empresa||o.contato||'—')+
      '<br><span class="sub">'+eh(o.descricao||o.segmento||'')+'</span></span>'+
      '<b style="white-space:nowrap"><span class="chip-s">'+eh(o.grupo||'?')+'</span> <span class="chip-s" style="color:'+cor+'">'+(o.score||0)+'</span></b></div>';
  }
  function cardAction(a){
    var o=(typeof oppOf==='function')?(oppOf(a.opportunity_id)||{}):{};
    var tone=a.status==='ERRO'?'var(--urgent)':a.status==='BLOQUEADO'?'var(--warn)':'var(--muted)';
    return '<div class="kv" style="padding:6px 0;cursor:pointer" data-open="'+eh(a.opportunity_id||'')+'">'+
      '<span style="text-align:left;color:var(--txt);min-width:0">'+eh(a.acao)+
      '<br><span class="sub">'+eh(o.empresa||a.contato||'')+' · '+eh(a.canal)+' · '+eh(a.status)+'</span></span>'+
      '<b style="color:'+tone+';font-size:11px;white-space:nowrap">'+eh(a.prioridade||'')+'</b></div>';
  }
  function cardCamp(c){
    return '<div class="kv" style="padding:6px 0;cursor:pointer" data-open-campaign="'+eh(c.id)+'">'+
      '<span style="text-align:left;color:var(--txt)">'+eh(c.nome)+
      '<br><span class="sub">'+eh(c.status||'')+' · '+((c.metricas&&c.metricas.enviados)||0)+' enviados</span></span></div>';
  }
  function cardConv(c){
    return '<div class="kv" style="padding:6px 0;cursor:pointer" data-open-conversation="'+eh(c.id)+'">'+
      '<span style="text-align:left;color:var(--txt)">'+eh(c.contato||'')+
      '<br><span class="sub">'+eh(c.canal||'')+' · '+eh(c.ultimo_texto||'')+'</span></span></div>';
  }
  function cardWebLead(r){
    var linha=[r.cargo,r.cidade||r.regiao||r.estado].filter(Boolean).join(' · ');
    var cont=[];
    if(r.email) cont.push(eh(r.email));
    if(r.telefone) cont.push('+55 '+eh(String(r.telefone).replace(/\D/g,'')));
    if(r.site) cont.push(eh(r.site));
    return '<div class="kv" style="padding:6px 0"><span style="text-align:left;color:var(--txt)">'+
      eh(r.nome||r.empresa||'—')+(linha?'<br><span class="sub">'+eh(linha)+'</span>':'')+
      (cont.length?'<br><span class="sub">'+cont.join(' · ')+'</span>':'')+'</span></div>';
  }

  function topN(txt,def){var m=txt.match(/\b(\d{1,3})\b/);return Math.max(1,Math.min(m?parseInt(m[1],10):def,25));}

  function respAjuda(){
    return '<strong>Consultas</strong><div class="sub" style="margin:4px 0">resumo · atenção · leads quentes · top 5 quentes · leads frios · fila · campanhas · conversas · quantos leads · quantos b2b · grupo a</div>'+
      '<strong style="display:block;margin-top:8px">Ações</strong><div class="sub" style="margin-top:4px">criar campanha para X · disparar campanha X · pausar campanha X · retomar campanha X · excluir campanha X · abrir X · mande mensagem para X · autorizar recomendações</div>'+
      '<strong style="display:block;margin-top:8px">Buscar e listar</strong><div class="sub" style="margin-top:4px">buscar leads clínica estética em SP · criar lista clínicas SP · listas · adicionar Clínica Mariana à lista clínicas SP</div>'+
      '<strong style="display:block;margin-top:8px">Arquivos</strong><div class="sub" style="margin-top:4px">ler arquivo X · o que tem no arquivo X · procurar preço nos arquivos</div>';
  }
  function respResumo(){
    var ov=(typeof deriveOverview==='function')?deriveOverview():{};
    return '<strong>Resumo</strong>'+
      '<div class="kv"><span>Leads na base</span><b>'+num((state.opportunities||[]).length)+'</b></div>'+
      '<div class="kv"><span>Oportunidades abertas</span><b>'+num(ov.oportunidades||0)+'</b></div>'+
      '<div class="kv"><span>Erros</span><b>'+(ov.erros||0)+'</b></div>'+
      '<div class="kv"><span>Bloqueadas</span><b>'+(ov.bloqueios||0)+'</b></div>'+
      '<div class="kv"><span>Atrasadas</span><b>'+(ov.atrasadas||0)+'</b></div>';
  }
  function respAtencao(){
    var crit=(typeof deriveCritical==='function')?deriveCritical().slice(0,8):[];
    if(!crit.length) return '<strong>Nada crítico.</strong>';
    return '<strong>'+crit.length+' itens pedindo atenção</strong>'+crit.map(cardAction).join('');
  }
  function respQuentes(txt){
    var nn=topN(txt,8);
    var arr=(state.opportunities||[]).filter(function(o){return o.temperatura==='Quente'||o.temperatura==='Muito quente';})
      .filter(function(o){return o.estagio!=='Fechado'&&o.estagio!=='Perdido';})
      .sort(function(a,b){return (b.score||0)-(a.score||0);});
    return '<strong>'+num(arr.length)+' leads quentes</strong> · top '+nn+arr.slice(0,nn).map(cardLead).join('');
  }
  function respFrios(txt){
    var nn=topN(txt,8);
    var arr=(state.opportunities||[]).filter(function(o){return o.temperatura==='Frio';}).sort(function(a,b){return (b.score||0)-(a.score||0);});
    return '<strong>'+num(arr.length)+' leads frios</strong> · top '+nn+arr.slice(0,nn).map(cardLead).join('');
  }
  function respListaGenerica(txt){
    var arr=state.opportunities||[];
    if(has(txt,['b2b'])) arr=arr.filter(function(o){return o.tipo==='B2B';});
    if(has(txt,['projeto','projetos'])) arr=arr.filter(function(o){return o.tipo==='Projeto';});
    if(has(txt,['vaga','vagas'])) arr=arr.filter(function(o){return o.tipo==='Vaga';});
    if(has(txt,['parceria','parcerias'])) arr=arr.filter(function(o){return o.tipo==='Parceria';});
    if(has(txt,['grupo a','tier 1','tier1'])) arr=arr.filter(function(o){return o.grupo==='A';});
    if(has(txt,['grupo b','tier 2','tier2'])) arr=arr.filter(function(o){return o.grupo==='B';});
    if(has(txt,['grupo c','tier 6','tier6'])) arr=arr.filter(function(o){return o.grupo==='C';});
    if(has(txt,['decisor','decisores'])) arr=arr.filter(function(o){return o.perfil==='Decisor';});
    if(has(txt,['aberto','abertos','aberta','abertas'])) arr=arr.filter(function(o){return o.estagio!=='Fechado'&&o.estagio!=='Perdido';});
    var nn=topN(txt,8);
    return '<strong>'+num(arr.length)+' leads</strong>'+(arr.length?' · top '+nn+arr.slice(0,nn).map(cardLead).join(''):'');
  }
  function respFila(){
    if(typeof filaContagem!=='function'||typeof FILA_GRUPOS==='undefined') return respAtencao();
    var c=filaContagem(), tot=0, k;
    for(k in c) tot+=c[k];
    var linhas=FILA_GRUPOS.map(function(g){
      var tone=(g.tom==='urgent'||g.tom==='hot')?'var(--urgent)':g.tom==='warn'?'var(--warn)':g.tom==='ok'?'var(--ok)':'var(--info)';
      return '<div class="kv"><span>'+eh(g.label)+'</span><b style="color:'+tone+'">'+(c[g.id]||0)+'</b></div>';
    }).join('');
    return '<strong>Fila: '+tot+'</strong>'+linhas;
  }
  function respCampanhas(txt){
    var arr=(state.campaigns||[]).filter(function(c){return !c.sugestao;});
    if(has(txt,['ativa','ativas','execucao','rodando'])) arr=arr.filter(function(c){return c.status==='EM EXECUÇÃO';});
    if(has(txt,['pausa','pausada','pausadas'])) arr=arr.filter(function(c){return c.status==='PAUSADA';});
    var nn=topN(txt,8);
    return '<strong>'+num(arr.length)+' campanhas</strong>'+arr.slice(0,nn).map(cardCamp).join('');
  }
  function respConversas(txt){
    var arr=(typeof liveConversations==='function')?liveConversations():[];
    if(has(txt,['responder','pendente','pendentes','precisa'])) arr=arr.filter(function(c){return c.precisa_resposta;});
    var nn=topN(txt,8);
    return '<strong>'+num(arr.length)+' conversas</strong>'+arr.slice(0,nn).map(cardConv).join('');
  }
  function respContagem(txt){
    if(!has(txt,['quantos','quantas','total','numero de'])) return null;
    if(has(txt,['lead','leads','oportunidade','oportunidades','cliente','clientes','contato','contatos','empresa','empresas'])) return respListaGenerica(txt);
    if(has(txt,['acao','acoes'])) return '<strong>'+num((state.actions||[]).length)+' ações</strong>';
    if(has(txt,['campanha','campanhas'])) return respCampanhas(txt);
    if(has(txt,['conversa','conversas','mensagem','mensagens'])) return respConversas(txt);
    return null;
  }
  var _cache=null,_stamp=0;
  function listaCache(){
    var s=(state.opportunities||[]).length;
    if(_cache&&s===_stamp) return _cache;
    _cache=(state.opportunities||[]).map(function(o){return {o:o,hay:norm([o.empresa,o.contato,o.descricao,o.segmento,o.email].join(' '))};});
    _stamp=s;
    return _cache;
  }
  function respBuscaLivre(txt){
    var stop=['procure','busque','encontre','ache','localize','mostre','mostra','quais','quem','lista','listar','ver','sobre','lead','leads','empresa','empresas','cliente','clientes','contato','contatos'];
    var words=norm(txt).split(' ').filter(function(w){return w.length>=3&&stop.indexOf(w)<0;});
    if(!words.length) return null;
    var out=[],idx=listaCache();
    for(var i=0;i<idx.length&&out.length<8;i++){
      for(var j=0;j<words.length;j++){ if(idx[i].hay.indexOf(words[j])>=0){ out.push(idx[i].o); break; } }
    }
    if(!out.length) return null;
    return '<strong>'+out.length+' resultado(s)</strong>'+out.map(cardLead).join('');
  }

  function findCampaign(q){
    q=norm(q); if(!q) return null;
    var cs=(state.campaigns||[]).filter(function(c){return !c.sugestao;}),i;
    for(i=0;i<cs.length;i++) if(cs[i].id.toLowerCase()===q) return cs[i];
    for(i=0;i<cs.length;i++) if(norm(cs[i].nome)===q) return cs[i];
    var partials=cs.filter(function(c){return norm(c.nome).indexOf(q)>=0;});
    if(partials.length) return partials[0];
    var words=q.split(' ').filter(function(w){return w.length>=3;});
    if(words.length){
      var best=null,bs=0;
      cs.forEach(function(c){var n=norm(c.nome),s=0;words.forEach(function(w){if(n.indexOf(w)>=0)s++;});if(s>bs){bs=s;best=c;}});
      if(best&&bs>=1) return best;
    }
    return null;
  }
  function findLead(q){
    q=norm(q); if(!q) return null;
    var arr=state.opportunities||[],i;
    for(i=0;i<arr.length;i++) if(arr[i].id.toLowerCase()===q) return arr[i];
    for(i=0;i<arr.length;i++) if(norm(arr[i].empresa)===q) return arr[i];
    for(i=0;i<arr.length;i++) if(norm(arr[i].empresa).indexOf(q)>=0) return arr[i];
    var words=q.split(' ').filter(function(w){return w.length>=3;});
    if(!words.length) return null;
    var best=null,bs=0;
    for(i=0;i<arr.length&&i<3000;i++){
      var o=arr[i],h=norm([o.empresa,o.contato].join(' ')),s=0;
      words.forEach(function(w){if(h.indexOf(w)>=0)s++;});
      if(s>bs){bs=s;best=o;if(s===words.length)break;}
    }
    return bs>0?best:null;
  }

  function chatSay(html){
    var b=byId('chatBody'); if(!b) return;
    b.insertAdjacentHTML('beforeend','<div class="msg hermes"><strong>Hermes</strong><br>'+html+'</div>');
    b.scrollTop=b.scrollHeight;
  }
  function chatReplace(el,html){
    if(!el) return;
    el.innerHTML='<strong>Hermes</strong><br>'+html;
    var b=byId('chatBody'); if(b) b.scrollTop=b.scrollHeight;
  }

  function actCriarCampanha(txt){
    var m=txt.match(/\bcri(a|e|ar)\s+(uma\s+)?campanha\b\s*(.*)/i);
    if(!m) return false;
    var sub=(m[3]||'').replace(/^(para|de|pra|:)\s*/i,'').trim();
    var prefill={nome:sub?('Campanha · '+sub):'',publico:{segmento:sub,cargo:'',localizacao:''}};
    if(typeof openModal!=='function'||typeof modalCampanha!=='function'){chatSay('Formulário indisponível.');return true;}
    try{openModal(modalCampanha(false,prefill,false));if(typeof afterCampModal==='function')afterCampModal();chatSay('Formulário aberto'+(sub?' para <b>'+eh(sub)+'</b>':'')+'.');}
    catch(err){chatSay('Erro: '+eh(err.message));}
    return true;
  }
  function actDisparar(txt){
    var m=txt.match(/\b(dispara|dispare|disparar|lanca|lance|lancar)\s+(a\s+)?campanha\s+(.+)/i);
    if(!m) return false;
    var c=findCampaign(m[3].trim());
    if(!c){chatSay('Não achei campanha com "<b>'+eh(m[3])+'</b>".');return true;}
    var pend=(typeof acoesDaCampanha==='function')?acoesDaCampanha(c.id).filter(function(a){return ['PRONTO','AGENDADO','EXECUTANDO'].indexOf(a.status)>=0;}).length:0;
    chatSay('Disparar <b>'+eh(c.nome)+'</b>?<div class="sub" style="margin-top:4px">'+eh(c.status)+' · '+pend+' pendente(s)</div>'+
      (typeof waPronto==='function'&&!waPronto()?'<div class="sub" style="color:var(--warn)">WhatsApp sem integração.</div>':'')+
      '<div style="display:flex;gap:6px;margin-top:10px">'+
      (pend?'<button class="btn primary sm" data-chat-do="dispatch" data-camp-id="'+eh(c.id)+'">Disparar agora</button>':'')+
      '<button class="btn sm" data-chat-do="open-camp" data-camp-id="'+eh(c.id)+'">Abrir campanha</button>'+
      '<button class="btn sm ghost" data-chat-do="cancel">Cancelar</button></div>');
    return true;
  }
  function actPausar(txt){
    var m=txt.match(/\bpaus(a|e|ar|ar)\s+(a\s+)?campanha\s+(.+)/i);
    if(!m) return false;
    var c=findCampaign(m[3].trim());
    if(!c){chatSay('Não achei campanha.');return true;}
    if(typeof setCampaignStatus!=='function'){chatSay('Função indisponível.');return true;}
    if(setCampaignStatus(c.id,'PAUSADA')) chatSay('Campanha <b>'+eh(c.nome)+'</b> pausada.'); else chatSay('Não consegui pausar.');
    return true;
  }
  function actRetomar(txt){
    var m=txt.match(/\b(retoma|retome|retomar|resume|resumir|ativar|ative|ativa)\s+(a\s+)?campanha\s+(.+)/i);
    if(!m) return false;
    var c=findCampaign(m[3].trim());
    if(!c){chatSay('Não achei campanha.');return true;}
    if(typeof setCampaignStatus!=='function'){chatSay('Função indisponível.');return true;}
    if(setCampaignStatus(c.id,'EM EXECUÇÃO')) chatSay('Campanha <b>'+eh(c.nome)+'</b> retomada.'); else chatSay('Não consegui retomar.');
    return true;
  }
  function actExcluir(txt){
    var m=txt.match(/\b(excluir|exclua|apagar|apaga|remover|remove|deletar|delete)\s+(a\s+)?campanha\s+(.+)/i);
    if(!m) return false;
    var c=findCampaign(m[3].trim());
    if(!c){chatSay('Não achei campanha.');return true;}
    var qtd=(typeof acoesDaCampanha==='function')?acoesDaCampanha(c.id).length:0;
    chatSay('Excluir <b>'+eh(c.nome)+'</b> e <b>'+qtd+'</b> ação(ões)?'+
      '<div style="display:flex;gap:6px;margin-top:10px">'+
      '<button class="btn danger sm" data-chat-do="delete-camp" data-camp-id="'+eh(c.id)+'">Excluir</button>'+
      '<button class="btn sm ghost" data-chat-do="cancel">Cancelar</button></div>');
    return true;
  }
  function actAbrir(txt){
    var m=txt.match(/\babri(r)?\s+(.+)/i);
    if(!m) return false;
    var q=m[2].replace(/^(a|o|as|os)\s+/i,'').trim(); if(!q) return false;
    var c=findCampaign(q);
    if(c&&typeof drawerCampaign==='function'){drawerCampaign(c.id);chatSay('Abri a campanha <b>'+eh(c.nome)+'</b>.');return true;}
    var o=findLead(q);
    if(o&&typeof drawerOpportunity==='function'){drawerOpportunity(o.id);chatSay('Abri <b>'+eh(o.empresa||o.contato)+'</b>.');return true;}
    chatSay('Não achei nada com "<b>'+eh(q)+'</b>".');
    return true;
  }
  function actMensagem(txt){
    var m=txt.match(/\b(manda|mande|mandar|envia|envie|enviar)\s+mensagem\s+(?:para|pra|a|ao|pro|p\/)\s+([^,]+?)(?:\s+dizendo\s+(.+))?$/i);
    if(!m) return false;
    var q=m[2].trim(),texto=(m[3]||'').trim();
    var o=findLead(q);
    if(!o){chatSay('Não achei lead com "<b>'+eh(q)+'</b>".');return true;}
    var num=(o.whatsapp||o.telefone||'').replace(/\D/g,'');
    if(!num){chatSay('O lead <b>'+eh(o.empresa||o.contato)+'</b> não tem telefone.');return true;}
    var msg=texto||('Olá '+(o.contato||'')+', tudo bem? Aqui é Flávio.');
    chatSay('Enviar mensagem?'+
      '<div class="kv" style="margin-top:6px"><span>Para</span><b>'+eh(o.empresa||o.contato)+'</b></div>'+
      '<div class="kv"><span>Número</span><b>+55 '+eh(num)+'</b></div>'+
      '<div style="margin-top:8px;font-size:12px;line-height:1.5;background:rgba(255,255,255,.03);padding:8px 10px;border-left:2px solid var(--recommend);border-radius:0 6px 6px 0">'+eh(msg)+'</div>'+
      '<div style="display:flex;gap:6px;margin-top:10px">'+
      '<button class="btn primary sm" data-chat-do="send-msg" data-opp-id="'+eh(o.id)+'" data-msg="'+eh(msg)+'">Enviar agora</button>'+
      '<button class="btn sm ghost" data-chat-do="cancel">Cancelar</button></div>');
    return true;
  }
  function actAutorizarRecs(txt){
    if(!has(txt,['autorizar','aprovar','aprova','autoriza'])) return false;
    if(!has(txt,['recomendac','sugest'])) return false;
    var pend=(typeof getRecommendations==='function')?getRecommendations().filter(function(r){return r.status==='pending';}):[];
    if(!pend.length){chatSay('Sem recomendações pendentes.');return true;}
    chatSay('Autorizar todas as <b>'+pend.length+'</b> recomendações pendentes?'+
      '<div style="display:flex;gap:6px;margin-top:10px">'+
      '<button class="btn primary sm" data-chat-do="approve-recs">Autorizar todas</button>'+
      '<button class="btn sm ghost" data-chat-do="cancel">Cancelar</button></div>');
    return true;
  }

  var RAG_URL='http://127.0.0.1:8500/api/arquivos';
  var _rag=null;
  function carregarRAG(){
    if(_rag) return Promise.resolve(_rag);
    return fetch(RAG_URL).then(function(r){return r.json();}).then(function(d){_rag=d;return d;})
      .catch(function(e){_rag={erro:String(e&&e.message||e)};return _rag;});
  }
  function respRAG(texto){
    var t=norm(texto);
    if(t.indexOf('arquiv')<0) return false;
    var mArq=t.match(/arquivo\s+([a-z0-9_\-\.]+)/);
    if(mArq){
      chatSay('Lendo arquivo…');
      carregarRAG().then(function(d){
        var b=byId('chatBody');
        var ult=b?b.querySelector('.msg.hermes:last-child'):null;
        if(d.erro){chatReplace(ult,'Servidor RAG não respondeu: '+eh(d.erro));return;}
        var hit=(d.arquivos||[]).filter(function(a){return norm(a.nome).indexOf(mArq[1])>=0;})[0];
        if(!hit){chatReplace(ult,'Nenhum arquivo com "'+eh(mArq[1])+'". Disponíveis: '+eh((d.arquivos||[]).map(function(a){return a.nome;}).slice(0,20).join(', ')));return;}
        var am=String(hit.conteudo||'').slice(0,1500).replace(/\s+/g,' ');
        chatReplace(ult,'<b>'+eh(hit.nome)+'</b><div class="sub" style="margin:4px 0 8px">'+num(String(hit.conteudo||'').length)+' caracteres · primeiros 1500</div>'+
          '<div style="font-size:11.5px;line-height:1.55;background:rgba(255,255,255,.03);padding:10px 12px;border-radius:8px;border-left:2px solid var(--recommend)">'+eh(am)+'</div>');
      });
      return true;
    }
    /* Procurar termos nos arquivos */
    var stop=['procure','procura','busque','buscar','encontre','encontrar','ache','localize','sobre','arquivo','arquivos','nos','no','na','de','do','da','em','para','por','com','uma','um','o','que','tem'];
    var words=t.split(' ').filter(function(w){return w.length>=3&&stop.indexOf(w)<0;});
    if(!words.length) return false;
    chatSay('Procurando nos arquivos…');
    carregarRAG().then(function(d){
      var b=byId('chatBody');
      var ult=b?b.querySelector('.msg.hermes:last-child'):null;
      if(d.erro){chatReplace(ult,'Servidor RAG não respondeu: '+eh(d.erro)+'<div class="sub">Rode: python3 ~/rag-hermes.py</div>');return;}
      var achados=[];
      (d.arquivos||[]).forEach(function(a){
        var lc=norm(a.conteudo),primeiro=-1,count=0;
        words.forEach(function(w){var idx=lc.indexOf(w);if(idx>=0){count++;if(primeiro<0)primeiro=idx;}});
        if(count>0) achados.push({nome:a.nome,score:count,pos:primeiro,conteudo:a.conteudo});
      });
      if(!achados.length){chatReplace(ult,'Nada encontrado para <b>'+eh(words.join(', '))+'</b> nos '+((d.arquivos||[]).length)+' arquivos.');return;}
      achados.sort(function(x,y){return y.score-x.score;});
      var html='<strong>'+achados.length+' arquivo(s) com o termo</strong>';
      html+=achados.slice(0,5).map(function(a){
        var pos=a.pos,tam=280;
        var ini=Math.max(0,pos-Math.floor(tam/2)),fim=Math.min(a.conteudo.length,pos+Math.ceil(tam/2));
        var tr=(ini>0?'… ':'')+a.conteudo.slice(ini,fim).replace(/\s+/g,' ').trim()+(fim<a.conteudo.length?' …':'');
        return '<div style="padding:6px 0;border-bottom:1px solid var(--line)"><b style="color:var(--recommend)">'+eh(a.nome)+'</b> <span class="sub">('+a.score+')</span><div class="sub" style="margin-top:2px;line-height:1.5">'+eh(tr)+'</div></div>';
      }).join('');
      chatReplace(ult,html);
    });
    return true;
  }

  function actBuscarLead(txt){
    var m=txt.match(/\b(buscar|busca|busque|procurar|procure|pesquisar|pesquise)\s+leads?\s+(.+)/i);
    if(!m) return false;
    var resto=m[2].trim();
    var reg='',termo=resto;
    var em=resto.match(/\s+em\s+(.+)$/i);
    if(em){termo=resto.slice(0,em.index).trim();reg=em[1].trim();}
    chatSay('Buscando <b>'+eh(termo)+'</b>'+(reg?' em <b>'+eh(reg)+'</b>':'')+'…');
    fetch('http://127.0.0.1:8430/api/pesquisar',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({canal:'Diretório',termo:termo,quantidade:25,regiao:reg})
    }).then(function(r){return r.json();}).then(function(d){
      var b=byId('chatBody');
      var ult=b?b.querySelector('.msg.hermes:last-child'):null;
      var lista=d.resultados||[];
      if(!lista.length){chatReplace(ult,'Nenhum resultado para <b>'+eh(termo)+'</b>.');return;}
      state._ultimaBusca={termo:termo,regiao:reg,resultados:lista};
      var html='<strong>'+lista.length+' resultado(s) para "'+eh(termo)+'"</strong>'+lista.slice(0,10).map(cardWebLead).join('');
      html+='<div class="sub" style="margin-top:8px">Para salvar: <b>criar lista clínicas '+(reg||'')+'</b></div>';
      chatReplace(ult,html);
    }).catch(function(e){
      var b=byId('chatBody');
      var ult=b?b.querySelector('.msg.hermes:last-child'):null;
      chatReplace(ult,'Não consegui buscar: '+eh(e.message)+'<div class="sub">Servidor de busca rodando em http://127.0.0.1:8420?</div>');
    });
    return true;
  }
  function actCriarLista(txt){
    var m=txt.match(/\b(criar|cria|crie)\s+(uma\s+)?lista\s+(.+)/i);
    if(!m) return false;
    var nome=m[3].trim();
    var ub=state._ultimaBusca;
    if(!ub||!ub.resultados.length){chatSay('Sem resultados de busca. Faça <b>buscar leads clínica estética</b> antes.');return true;}
    var store=loadUserStore();
    var have=new Set(state.opportunities.map(function(o){return o.id;}));
    var novos=[];
    ub.resultados.forEach(function(r){
      var opp=webParaOportunidade(r,'WEB');
      if(!have.has(opp.id)){
        store.leadsExtras.push(opp);state.opportunities.push(opp);have.add(opp.id);novos.push(opp);
      } else {
        novos.push(state.opportunities.find(function(o){return o.id===opp.id;}));
      }
    });
    var l={id:nextListId(),nome:nome,ids:novos.map(function(o){return o.id;}),filtro:'busca: '+ub.termo+(ub.regiao?' em '+ub.regiao:''),criadaEm:new Date().toISOString()};
    store.listas.push(l);
    saveUserStore(store);
    if(typeof rebuildOppIndex==='function') rebuildOppIndex();
    chatSay('<b>Lista "'+eh(nome)+'"</b> criada com '+novos.length+' lead(s).');
    if(typeof render==='function') render();
    delete state._ultimaBusca;
    return true;
  }
  function actAdicionarLista(txt){
    var m=txt.match(/\b(adicionar|adiciona|incluir|inclua|colocar|coloque|poe|poem)\s+(.+?)\s+(?:na|a|à|em)\s+lista\s+(.+)/i);
    if(!m) return false;
    var q=m[2].trim(),nome=m[3].trim();
    var store=loadUserStore();
    var l=store.listas.filter(function(x){return norm(x.nome)===norm(nome);})[0]
      || store.listas.filter(function(x){return norm(x.nome).indexOf(norm(nome))>=0;})[0];
    if(!l){chatSay('Lista "'+eh(nome)+'" não encontrada.');return true;}
    var o=findLead(q);
    if(!o){chatSay('Lead "'+eh(q)+'" não encontrado.');return true;}
    if(l.ids.indexOf(o.id)>=0){chatSay('<b>'+eh(o.empresa)+'</b> já está na lista.');return true;}
    l.ids.push(o.id);
    saveUserStore(store);
    chatSay('<b>'+eh(o.empresa)+'</b> adicionado à lista <b>'+eh(l.nome)+'</b>.');
    return true;
  }
  function respListas(){
    var ls=(typeof userLists==='function')?userLists():[];
    if(!ls.length) return '<strong>Nenhuma lista criada.</strong>';
    return '<strong>'+ls.length+' listas</strong>'+
      ls.map(function(l){return '<div class="kv"><span style="text-align:left;color:var(--txt)">'+eh(l.nome)+'<br><span class="sub">'+l.ids.length+' leads</span></span></div>';}).join('');
  }

  function runChatAction(kind,btnEl,msgEl){
    if(kind==='cancel'){chatReplace(msgEl,'Cancelado.');return;}
    var d=btnEl.dataset;
    if(kind==='dispatch'){
      var c=(state.campaigns||[]).filter(function(x){return x.id===d.campId;})[0];
      if(!c){chatReplace(msgEl,'Campanha não encontrada.');return;}
      if(typeof runDisparo!=='function'){chatReplace(msgEl,'Função indisponível.');return;}
      chatReplace(msgEl,'Disparando <b>'+eh(c.nome)+'</b>…');
      runDisparo(c,true).then(function(r){chatReplace(msgEl,'<b>'+eh(c.nome)+'</b><br>'+eh(r.texto||'sem resultado'));});
    }
    else if(kind==='open-camp'){
      var c2=(state.campaigns||[]).filter(function(x){return x.id===d.campId;})[0];
      if(c2&&typeof drawerCampaign==='function'){drawerCampaign(c2.id);chatReplace(msgEl,'Abri a campanha.');}
      else chatReplace(msgEl,'Não consegui abrir.');
    }
    else if(kind==='delete-camp'){
      var c3=(state.campaigns||[]).filter(function(x){return x.id===d.campId;})[0];
      if(!c3){chatReplace(msgEl,'Campanha não encontrada.');return;}
      if(typeof deleteCampaign==='function'){deleteCampaign(c3.id);chatReplace(msgEl,'Campanha <b>'+eh(c3.nome)+'</b> excluída.');}
      else chatReplace(msgEl,'Função indisponível.');
    }
    else if(kind==='send-msg'){
      var o=(state.opportunities||[]).filter(function(x){return x.id===d.oppId;})[0];
      if(!o){chatReplace(msgEl,'Lead não encontrado.');return;}
      if(typeof enviarWhatsApp!=='function'){chatReplace(msgEl,'Função indisponível.');return;}
      chatReplace(msgEl,'Enviando para <b>'+eh(o.empresa||o.contato)+'</b>…');
      enviarWhatsApp(o.whatsapp||o.telefone||'',d.msg).then(function(r){
        if(r.ok) chatReplace(msgEl,'Enviado para <b>'+eh(r.para)+'</b>.');
        else chatReplace(msgEl,'Falha: '+eh(r.erro||'erro'));
      });
    }
    else if(kind==='approve-recs'){
      var pend=(typeof getRecommendations==='function')?getRecommendations().filter(function(r){return r.status==='pending';}):[];
      if(!state.recommendDecisions) state.recommendDecisions={};
      pend.forEach(function(r){
        state.recommendDecisions[r.id]={status:'approved'};
        if(typeof createActionFromRecommendation==='function'){try{createActionFromRecommendation(r,r.prazo);}catch(e){}}
      });
      chatReplace(msgEl,'<b>'+pend.length+'</b> recomendações autorizadas.');
      if(typeof render==='function') render();
    }
  }

  function handle(txt){
    var t=norm(txt); if(!t) return 'Digite algo.';
    if(actCriarCampanha(txt)) return null;
    if(actDisparar(txt)) return null;
    if(actPausar(txt)) return null;
    if(actRetomar(txt)) return null;
    if(actExcluir(txt)) return null;
    if(actMensagem(txt)) return null;
    if(actAutorizarRecs(txt)) return null;
    if(actBuscarLead(txt)) return null;
    if(actCriarLista(txt)) return null;
    if(actAdicionarLista(txt)) return null;
    if(actAbrir(txt)) return null;
    if(has(t,['ajuda','help','comandos'])) return respAjuda();
    if(has(t,['oi','ola','bom dia','boa tarde','boa noite'])) return 'Oi. Diga <em>ajuda</em>.';
    if(has(t,['resumo','panorama','status','overview','como esta','como estamos'])) return respResumo();
    if(has(t,['atencao','urgente','critico','prioridade'])) return respAtencao();
    if(has(t,['quente','quentes','hot'])) return respQuentes(txt);
    if(has(t,['frio','frios','esfriando','esfriou'])) return respFrios(txt);
    if(has(t,['fila','agenda','agendado','agendados'])) return respFila();
    if(has(t,['campanha','campanhas'])) return respCampanhas(txt);
    if(has(t,['conversa','conversas','mensagem','mensagens','resposta','respostas','inbox'])) return respConversas(txt);
    if(has(t,['lista','listas'])) return respListas();
    var c=respContagem(txt); if(c) return c;
    var b=respBuscaLivre(txt); if(b) return b;
    if(respRAG(txt)) return null;
    return 'Não entendi. Diga <em>ajuda</em>.';
  }

  function send(){
    var i=byId('chatInput'), b=byId('chatBody');
    if(!i||!b) return;
    var t=i.value.trim(); if(!t) return;
    b.insertAdjacentHTML('beforeend','<div class="msg me">'+eh(t)+'</div>');
    i.value=''; b.scrollTop=b.scrollHeight;
    try{var r=handle(t);if(r!==null) chatSay(r);}
    catch(err){chatSay('Erro: '+eh(err.message));}
  }
  function patch(){
    var s=byId('chatSend'), i=byId('chatInput');
    if(s){var ns=s.cloneNode(true); s.replaceWith(ns); ns.addEventListener('click',send);}
    if(i){var ni=i.cloneNode(true); i.replaceWith(ni); ni.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();send();}});}
  }
  document.addEventListener('click',function(ev){
    var b=ev.target.closest('[data-chat-do]');
    if(!b||!b.closest('#chatBody')) return;
    ev.preventDefault(); ev.stopPropagation();
    runChatAction(b.dataset.chatDo,b,b.closest('.msg'));
  },true);
  document.addEventListener('click',function(ev){
    var b=ev.target.closest('[data-chat-example]');
    if(!b||!b.closest('#chatBody')) return;
    ev.preventDefault(); ev.stopPropagation();
    var inp=byId('chatInput'); if(!inp) return;
    inp.value=b.dataset.chatExample;
    send();
  },true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',patch); else patch();
  window.sendChatMsg=send;
  var css=''+
  '#chatBody .ex{margin-top:6px;padding:8px 10px;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:8px;font-size:11.5px;display:flex;justify-content:space-between;align-items:center;gap:8px}'+
  '#chatBody .kv{padding:8px 0;border-bottom:1px solid var(--line)}'+
  '#chatBody .kv:last-child{border-bottom:0}'+
  '#chatBody .sub{color:var(--muted);font-size:11px;line-height:1.5}'+
  '#chatBody .chip-s{font-size:10px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--muted)}'+
  '#chatBody button[data-chat-do]{cursor:pointer;font-family:inherit}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();
