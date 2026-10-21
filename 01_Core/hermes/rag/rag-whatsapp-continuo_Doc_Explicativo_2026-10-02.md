# RAG · Campanha contínua de interação com leads da base · WhatsApp

## O QUE ESTE RAG RESOLVE
Base viva no WhatsApp: leads que já conversaram, responderam, pediram
portfólio ou marcaram reunião. Objetivo: manter relacionamento quente
até virar reunião para projeto ou freela.

Fluxo contínuo, sem começo e fim. Roda em ciclo enquanto o lead estiver
na base.

## PRINCÍPIOS
1. Lead da base tem histórico. Tom de continuidade, não de primeira vez.
2. Regra 80/20: 80% entrega valor, 20% pede algo.
3. Nenhum toque repete o anterior. Rotação obrigatória.
4. Intervalo mínimo entre toques: 7 dias.
5. 3 toques sem resposta → pausa de 30 dias.
6. Base viva não consome rampa. Teto direto do canal (20/dia WhatsApp).

## SEGMENTAÇÃO
NUTRIÇÃO: respondeu alguma vez, nunca pediu proposta → F-NUT
INTERAÇÃO: respondeu nos últimos 60 dias → F-INT
REATIVAÇÃO: sem resposta há 90+ dias, sem opt-out → F-REA
NOVO CASE: recebeu case antes, demonstrou interesse → F-CASE

Sem interação nunca → não entra aqui. Fica na prospecção fria.

## FLUXO F-NUT · Nutrição
Objetivo: manter aquecido, entregar valor sem pedir nada.

N1 · Insight curto sobre o segmento — PAS — sem CTA, pergunta aberta
N2 · Case novo (1 link) — BAB — "Quer que eu detalhe?"
N3 · Pergunta sobre momento do lead — AIDA — "Faz sentido?"
N4 · Case + número (se existir) — 4Ps — "Posso mostrar como apliquei?"

Depois de N4, volta para N1 com conteúdo rotacionado.

## FLUXO F-INT · Interação
Objetivo: aprofundar conversa existente sem forçar reunião.

I1 · Retomada leve ("lembrei de você quando vi X") — AIDA curto — "O que você achou?"
I2 · Pergunta sobre dor real — SPIN — "Como resolve isso hoje?"
I3 · Micro-case do segmento — BAB — "Isso se aplica aí?"
I4 · Proposta de reunião 15 min (só aqui) — AIDA + agenda — "Consigo {slot_a} ou {slot_b}?"

## FLUXO F-REA · Reativação
Objetivo: trazer de volta sem parecer cobrança.

R1 · Reabertura sem pressão — PAS leve — sem CTA
R2 · Novidade relevante — BAB — "Quer que eu te mande?"
R3 · Pergunta sobre mudança — SPIN — "Mudou algo no cenário?"
R4 · Última tentativa educada — AIDA curto — "Se fizer sentido, é só chamar"

Depois de R4 sem resposta: pausa 30 dias. Se ainda sem resposta,
marca Nutrição e sai da campanha.

## FLUXO F-CASE · Novos cases
Objetivo: mostrar trabalho novo casado com interesse anterior.

C1 · Case novo do segmento — 4Ps — "Faz sentido eu te mostrar?"
C2 · Número do resultado — AIDA — "Quer o case completo?"
C3 · Conexão do case com o contexto — PAS — "Isso se parece com o de vocês?"
C4 · Convite para 15 min — AIDA + agenda — "Consigo {slot_a} ou {slot_b}"

## CADÊNCIA
Ciclo de 4 toques. Intervalo entre toques: 7 dias.
Entre ciclos (T4 → T1): 14 dias.

Exemplo F-NUT:
D0 N1 · D7 N2 · D14 N3 · D21 N4 · D35 N1(rot) · D42 N2(rot)...

Regras:
- Nunca dois toques no mesmo dia
- Se o lead responder, fluxo pausa
- Se marcar reunião, sai da campanha contínua
- Se pedir opt-out, DNC global
- Se pedir portfólio, manda 1 link e retoma 7 dias depois

## LIMITES E FILA
Teto WhatsApp: 20/dia (base não consome rampa)
Intervalo entre envios do canal: 3–8 min
Janela: 09h–18h (America/Sao_Paulo; EN segue fuso do lead)
Prioridade na fila: tier 5 (depois de respostas, follow-ups, quentes, novos)
Cotas P1–P4: esta campanha é P2 (25% do que sobra)

Se fila estourar, esta campanha cede vaga primeiro.

## FRAMEWORKS
AIDA: Abertura, convite, proposta de reunião
PAS: Insight, reativação, objeção
BAB: Case, novidade, antes/depois
4Ps: Case com prova, e-mail longo
SPIN: Interação profunda, qualificação
FAB: Resposta a objeção

Regra de escolha:
Toque 1: AIDA curto ou PAS leve
Toque 2: BAB ou 4Ps
Toque 3: SPIN ou AIDA
Toque 4: AIDA + agenda (só aqui pede reunião)

## CTAs POR TEMPERATURA
Frio: "Faz sentido mantermos contato?"
Morno: "Faz sentido trocar uma ideia sobre isso?"
Quente: "Se fizer sentido, posso te mostrar rapidamente o case."
Muito quente: "Consigo {slot_a} ou {slot_b}. Qual funciona?"

Nunca pedir reunião de 30 min para lead frio.

## GATILHOS DE ENTRADA
- Respondeu nos últimos 90 dias → F-INT
- Respondeu há 90+ dias, sem opt-out → F-REA
- Recebeu case antes, demonstrou interesse → F-CASE
- Nunca respondeu mas está na base → F-NUT

## SAÍDA
- Respondeu, conversa ativa → pausa fluxo
- Marcou reunião → sai, vai para projeto
- Pediu opt-out → DNC global
- 3 toques sem resposta → pausa 30 dias
- 90 dias sem interação → sai, marca Nutrição inativa

## MENSAGENS (exemplos)

F-NUT · N1 · Insight PAS
Oi, {nome}. Vi um dado sobre {segmento} que me lembrou da {empresa}:
{insight_curto}. A maioria trata {tema} como frente isolada, mas o que
funciona é {abordagem_alternativa}. Como vocês lidam com isso hoje?

F-NUT · N2 · Case BAB
{nome}, antes: {situacao_antes}. Depois: {situacao_depois}. O que mudou
foi {ponte}. Foi com o {case}. Quer que eu te mande o detalhe?

F-INT · I1 · Retomada AIDA
{nome}, lembrei de você quando vi {novidade}. Achei que tinha a ver com
o que você comentou sobre {tema}. O que você achou?

F-INT · I2 · Pergunta SPIN
{nome}, sobre {tema}: hoje vocês resolvem com {situacao_atual}? Se sim,
o que acontece quando {problema}? Pergunto porque vejo muita gente
travando nesse ponto.

F-REA · R1 · Reabertura PAS
Oi, {nome}. Faz um tempo que não trocamos mensagem. Sem compromisso:
vi {novidade} e lembrei da nossa conversa sobre {tema}. Ainda está na
pauta por aí?

F-REA · R4 · Última AIDA
{nome}, não quero lotar sua caixa. Deixo a porta aberta: se {tema}
voltar à pauta, é só me chamar. Sucesso por aí.

F-CASE · C1 · Case novo 4Ps
{nome}, imagine {picture}. Foi o que aconteceu com {case}: {promise}.
{prove}. Se fizer sentido, te mostro como apliquei: {push}.

F-CASE · C4 · Convite AIDA
{nome}, sobre o {case} que te mandei: consigo {slot_a} ou {slot_b} para
te mostrar em 15 min como isso se aplicaria à {empresa}. Qual funciona?

## ROTAÇÃO ANTI-REPETIÇÃO
O Hermes guarda o último toque de cada lead. O próximo nunca repete:
- Framework do anterior
- Tipo de conteúdo (insight/case/pergunta/convite)
- Case citado

Sem case novo, o toque vira insight ou pergunta.
Nunca repetir o mesmo case duas vezes no mesmo ciclo.

## INTEGRAÇÃO COM OUTROS RAGs
- rag-fila.md: limites, tier 5, cadência 7 dias
- rag-mensagens.md: templates base, frameworks
- rag-whatsapp.md: envio técnico, gates
- rag-hermes.md: comportamento ao receber resposta

## REGRAS INVIOLÁVEIS
1. Nunca dois toques no mesmo dia
2. Nunca pedir reunião antes do toque 4
3. Nunca repetir case no mesmo ciclo
4. Nunca disparar para lead que respondeu nos últimos 3 dias
5. Resposta do lead pausa o fluxo
6. Opt-out é DNC global imediato
7. 3 toques sem resposta → pausa 30 dias
8. Teto 20/dia WhatsApp; cede vaga para prospecção fria se estourar

