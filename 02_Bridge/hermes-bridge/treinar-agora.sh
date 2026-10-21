#!/bin/bash
LOG=/tmp/hermes-treinamento-ordem.log
JID="5521999719474@s.whatsapp.net"
TOK=hermes123
enviar(){
  curl -s -X POST -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" -d "{\"number\":\"$JID\",\"message\":\"$1\"}" http://127.0.0.1:8787/send > /dev/null
}
echo "" >> $LOG
echo "════ TREINAMENTO 1 — CONHECER CONFIGURACOES ════" >> $LOG
echo "inicio: $(date '+%H:%M:%S')" >> $LOG
T1=(
"/config"
"Como funciona a janela de envio do WhatsApp e por que 9h-18h?"
"Explique o aquecimento de numero: quantas mensagens por dia comecar e como subir?"
"Qual o intervalo ideal entre envios no WhatsApp e por que?"
"O que e failStreak e quando a campanha pausa automaticamente?"
"Como funciona o opt-out e LGPD numa campanha WhatsApp?"
"Quais sao os 3 registros DNS obrigatorios pra email nao cair em spam?"
"Qual o limite diario recomendado pra email nos primeiros 14 dias?"
"Como personalizar template com nome do lead quando o dado esta faltando?"
"Quais metricas indicam que uma campanha deve ser pausada?"
)
for i in "${!T1[@]}"; do
  P="${T1[$i]}"
  echo "[T1-$((i+1))] $P" >> $LOG
  enviar "$P"
  sleep 25
  ULT=$(tail -3 /tmp/hermes-agent.log | grep -aE "RESPONDER|enviado|ESCALAR" | tail -1)
  echo "  resposta: $ULT" >> $LOG
done
echo "" >> $LOG
echo "════ TREINAMENTO 2 — OPERAR E SUGERIR CAMPANHAS ════" >> $LOG
echo "inicio: $(date '+%H:%M:%S')" >> $LOG
T2=(
"/nova Clinicas Estetica whatsapp"
"/nova Freelancer Produto email"
"/nova Vagas Comunicacao linkedin"
"/lista"
"/editar CMP-0001 enviados 142"
"/editar CMP-0001 respostas 19"
"/editar CMP-0002 enviados 76"
"/editar CMP-0002 respostas 14"
"/sugerir"
"Com base nas 3 campanhas que criei qual tem a melhor taxa de resposta e o que sugere pra proxima semana?"
"Se eu tenho 142 enviados e 19 respostas na clinica e 76 enviados e 14 no freelancer qual campanha devo dobrar?"
"/relatorio_painel"
"Me da 3 acoes concretas pra aumentar reunioes a partir de respostas"
"/pausar CMP-0003"
"/retomar CMP-0003"
"/lista"
"Qual a melhor janela de horario pra disparar as 3 campanhas essa semana?"
"Sugere mudar algum template com base nas taxas atuais?"
)
for i in "${!T2[@]}"; do
  P="${T2[$i]}"
  echo "[T2-$((i+1))] $P" >> $LOG
  enviar "$P"
  sleep 25
  ULT=$(tail -3 /tmp/hermes-agent.log | grep -aE "RESPONDER|enviado|ESCALAR" | tail -1)
  echo "  resposta: $ULT" >> $LOG
done
echo "" >> $LOG
echo "════ TREINAMENTOS CONCLUIDOS $(date '+%H:%M:%S') ════" >> $LOG
