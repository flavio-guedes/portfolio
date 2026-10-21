# Base de Conhecimento — Campanhas WhatsApp & Email (Hermes)

## 1. ESTRUTURA DE UMA CAMPANHA
Campos mínimos:
- id            → único (ex: CMP-0001)
- nome          → descritivo, curto
- canal         → whatsapp | email | linkedin
- segmento      → Clínicas, Vagas, Freelancer, etc.
- template      → corpo da mensagem com variáveis {{nome}}, {{empresa}}, {{cargo}}
- remetente     → jid WA ou email from
- agendamento   → janela (winStart–winEnd em horas), minMs/maxMs entre envios
- metricas      → enviados, respostas, reunioes, erros, bloqueadas
- estado        → rascunho | ativa | pausada | concluida

## 2. WHATSAPP — CONFIGURAÇÃO
- Janela segura: 9h–18h, seg–sex (fora disso, risco de ban)
- Intervalo entre envios: mínimo 10s, ideal 25–60s (aleatório)
- Aquecimento de número: começar com 20/dia, subir +20/dia até 200
- Marcar "typing…" antes de enviar (humanização) — já ativo no bridge
- Templates com 1ª linha personalizada ("Oi {{nome}}, vi que sua clínica…")
- Respeitar opt-out: se lead responde "pare", "sair", "descadastrar" → mover pra bloqueadas
- Erros técnicos seguidos ≥5 → pausar campanha (failStreak)
- Sem WhatsApp no número (sem_whatsapp) → não é falha, é dado do lead
- Nunca enviar links encurtados suspeitos (bit.ly bloqueia)
- LGPD: base legal + opt-in claro na 1ª mensagem

## 3. EMAIL — CONFIGURAÇÃO
- Domínio com SPF, DKIM, DMARC configurados (senão cai em spam)
- Aquecimento: 10–20/dia primeiros 14 dias, subir gradual
- Assunto: 4–7 palavras, sem CAPS LOCK, sem "!!!"
- Corpo: 1 ideia por email, CTA único, sem anexo no 1º contato
- Rodapé obrigatório com descadastro (link funcional)
- Bounce rate > 5% → pausa e revisa lista
- Unsubscribe em 1 clique (obrigatório Gmail/Yahoo 2024+)
- Personalização: {{nome}}, {{empresa}} — se faltar dado, usar fallback neutro
- Melhor horário: ter–qui, 7h–9h ou 19h–21h

## 4. SUGESTÕES DE CAMPANHA — CRITÉRIOS
- Se fila > 50 e taxa resposta < 5% → sugerir revisão de template
- Se erros > 10% → sugerir pausa + checar aquecimento do número
- Se respostas > 15% mas reuniões < 2% → sugerir CTA mais forte na 2ª mensagem
- Se lead respondeu mas sumiu > 3 dias → sugerir follow-up automático
- Se segmento X tem taxa 3× o segmento Y → sugerir dobrar envio em X
- Se canal whatsapp banindo (erros 403/401) → sugerir migrar pra email
- Se no horário atual (h) fora da janela segura → sugerir agendar próximo envio

## 5. AÇÕES QUE O HERMES PODE EXECUTAR (via painel)
- criar_campanha   { nome, canal, segmento, template }
- editar_campanha  { id, campos… }
- pausar_campanha  { id }
- retomar_campanha { id }
- deletar_campanha { id }
- listar_campanhas → array
- relatorio        { id? } → métricas
- sugerir          → recomendações baseadas no estado atual

## 6. MÉTRICAS QUE IMPORTAM
- Taxa resposta = respostas / enviados (benchmark: 8–20% WA, 2–5% email)
- Taxa reunião   = reunioes / respostas (benchmark: 15–30%)
- Taxa erro      = erros / enviados (alerta se > 5%)
- Taxa bloqueio  = bloqueadas / enviados (alerta se > 2%)
- Tempo médio 1ª resposta: WA 2h, email 6h

## 7. RESPOSTAS PADRÃO DO HERMES
- Pergunta sobre "como criar campanha": explicar 3 passos (nome+canal, template, agendamento)
- Pergunta sobre "quantas campanhas": ler painel, listar com métricas
- Pergunta sobre "sugerir": aplicar critérios §4, oferecer 1–3 sugestões com números
- Pergunta sobre "config": explicar janela, intervalo, aquecimento
- Pedido ambíguo: pedir 1 esclarecimento, não 5
- Nunca inventar campanha ou número — se não tem no painel, dizer "não encontrei"
