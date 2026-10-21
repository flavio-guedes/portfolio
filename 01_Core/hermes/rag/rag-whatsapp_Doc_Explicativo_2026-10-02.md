# RAG · Integração WhatsApp ↔ CRM

## CONTEXTO
- Painel Hermes OS no navegador. Persistência em localStorage (chave
  hermes-os.v7.user) via saveUserStore.
- Base embutida recarrega a cada refresh(). O que o usuário cria precisa
  passar pelo userStore ou some no próximo reload.
- Sessão Baileys já autenticada. Config em userCfg.integracoes.baileys:
  {url, token, sendPath, fieldTo, fieldText, jidSuffix}.
- waPronto() retorna true só se url preenchida.
- enviarWhatsApp(numero, texto) faz POST {url}{sendPath} com JSON
  {[fieldTo]: jid, [fieldText]: texto} + Bearer se houver token.
- normalizeBR(raw): tira não-dígitos, tira 55 inicial quando >11 dígitos,
  recoloca 55. NÃO inventa o nono dígito.

## ESTRUTURAS
Oportunidade: id, empresa, contato, telefone, whatsapp, email,
canal_preferido, estagio, temperatura, status_lead, grupo, perfil, score,
campaign_id. telefone vem da coluna Telefone do CSV. whatsapp
frequentemente é flag booleana, não número.

Ação: id, opportunity_id, campaign_id, contato, empresa, canal, etapa,
acao, prazo, prioridade, prioridade_fila, status, allowed, enviado_em,
enviado_para, erro. allowed é derivado de status por
allowedForActionStatus().

Conversa: id, contato, empresa, canal, campaign_id, ultimo_texto,
ultima_interacao, temperatura, responsavel, precisa_resposta, contexto.
precisa_resposta = true quando última msg é inbound.

Evento: id, tipo, atualizado, acao, contato, canal, campanha_id, detalhe.
Tipos: captura, envio, resposta, erro, decisao, acao. Teto: 200.

## UTILITÁRIOS
normalizeBR, upsertAction, deleteAction, registerEvent, saveUserStore,
loadUserStore, rebuildOppIndex, renderMensagem, runDisparo,
despacharAcao, campEnviados, campPendentes, campTargets.

## LINKEDIN BLOQUEADO DE PROPÓSITO
CHANNEL_STATUS.LinkedIn.conectado === false. liveConversations() filtra
canais não conectados. Não é bug.

---

## FASES

### Fase 1 · Diagnóstico silencioso
1. baileyConfig() → validar url. Se vazia, G1.
2. GET {url}/health → esperar 200.
3. GET {url}/session/status → esperar {status:"connected"|"open",
   me:{id}}. Se ≠, G2.
4. GET {url}/messages?limit=1 para saber se histórico é servido.
   404 → historico_disponivel=false, seguir só com envio.
5. registerEvent tipo captura: "handshake OK · número {me.id}".
Output: {historico_disponivel, numero_conectado}.

### Fase 2 · Ingestão do histórico
Pré: historico_disponivel === true. Senão, pular para Fase 4.
1. Puxar 90 dias, paginando 500/página.
2. Ignorar JID @g.us (grupo) e @broadcast.
3. Reduzir cada thread a UMA Conversa. precisa_resposta = última msg é
   INBOUND.
4. normalizeBR no telefone antes de gravar.
5. Deduplicar por jid. Conversa existente tem prioridade em conflito.
6. Limitar state.conversations a 500 mais recentes.
Output: N conversas.

### Fase 3 · Vínculo com o CRM
Cascata: 1) telefone exato via normalizeBR; 2) nome/empresa
case-insensitive sem acento; 3) domínio do e-mail.
- Match → conversa.opportunity_id = o.id, o.canal_preferido='WhatsApp'.
- Sem match → sem_vinculo: true.
- Se vinculou E o.estagio ∈ {Descoberta, Qualificação} E última msg é
  INBOUND → o.estagio='Conversa', o.temperatura='Quente',
  o.status_lead='EM CONVERSA'.
Se >20% órfãs E índice telefone→opp cobre <10% das opps → G4.
Output: {vinculadas, orfas, oportunidades_atualizadas}.

### Fase 4 · Registro de eventos
1. Cada INBOUND nova → evento resposta, agente Mercúrio, entidade =
   opportunity_id (ou null).
2. Cada OUTBOUND já enviado → evento envio, agente Executor.
3. Deduplicar por (jid + timestamp ao minuto).
4. Respeitar teto de 200.
Output: R respostas + E envios.

### Fase 5 · Envio validado
1. Persistir config: userCfg.integracoes.baileys = baileyConfig().
2. Disparo controlado para me.id: "Teste de integração · {ISO}".
3. OK → envio_validado=true.
4. 4xx/5xx não transitório → G3.
5. despacharAcao e runDisparo passam a operar reais.
Output: {envio_validado}.

### Fase 6 · Agendador
1. startDisparoLoop() ativo (tick 30s).
2. Campanha agendada_em vencida, status ≠ PAUSADA, ações pendentes →
   runDisparo(c,false).
3. Pausa é lei: runDisparo devolve {bloqueado:true}.
4. Teto diário conta envios de hoje; não reinicia no reload.
Output: {agendador_ativo:true}.

### Fase 7 · Relatório final
Evento tipo decisao com: sessão, histórico (N msgs, M threads, janela),
conversas (K vinculadas/órfãs), oportunidades (A estágio, B
temperatura), eventos (R respostas, E envios), envio validado, agendador,
gates falhados. Devolver mesmo resumo como resposta.

---

## GATES

G1 · Servidor inacessível: baileyConfig().url vazia, ou {url}/health
falha 3x com 5s. Pedir confirmação da URL.

G2 · Sessão caiu: session/status ≠ connected/open durante Fase 2 ou 5.
Não reconectar automaticamente. Reportar status.

G3 · Envio de teste falhou: 4xx/5xx não transitório (408, 429, 5xx
esporádico: tentar 2x antes). Parar antes de envio em massa.

G4 · Base sem telefone: >20% órfãs E índice cobre <10% das opps. Não
disparar em massa. Reportar.

---

## REGRAS INVIOLÁVEIS

R1 · Nunca marcar ação ENVIADO sem ok:true do Baileys.
R2 · Nunca inventar telefone, contato, empresa, destinatário.
R3 · metricas.enviados da base é somado, não recalculado.
R4 · Pausa é lei. Campanha PAUSADA não dispara nem no tick.
R5 · Toda escrita passa por upsertAction/saveUserStore.
R6 · Erro no meio de uma fase → parar, registerEvent tipo erro, reportar.