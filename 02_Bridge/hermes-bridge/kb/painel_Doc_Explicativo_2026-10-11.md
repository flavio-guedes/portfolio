# Configurações do Painel Hermes V10

## Limites diários por canal
- WhatsApp: 10 mensagens/dia
- LinkedIn: 10 mensagens/dia
- E-mail: 20 mensagens/dia

## WhatsApp
- Janela de envio: 09h–18h (dias úteis)
- Aquecimento: começa com ~20 msgs/dia, sobe +20 a cada 2 dias
- Intervalo recomendado entre envios: 40 segundos
- FailStreak: pausar após 3 falhas consecutivas

## E-mail
- SPF: `v=spf1 include:_spf.google.com ~all`
- DKIM: chave 2048 bits, seletor hermes
- DMARC: `p=quarantine`
- Rate-limit primeiros 14 dias: 30 emails/hora

## LGPD / Opt-out
- Toda campanha precisa de link de descadastro
- Respeitar lista de bloqueio imediatamente
- Não enviar sem consentimento registrado

## Comandos WhatsApp aceitos
/config, /lista, /nova, /editar, /pausar, /retomar, /sugerir, /relatorio_painel
