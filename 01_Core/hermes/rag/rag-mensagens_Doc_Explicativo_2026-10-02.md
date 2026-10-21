# RAG · Biblioteca de mensagens

## COMO USAR
Toda mensagem que sai do painel é uma linha desta biblioteca.
Hermes escolhe template, resolve variáveis, valida, envia.

Cadeia: FLUXO (A/B/C/D) → ETAPA (A1, A2...) → CANAL → IDIOMA → TEMPERATURA → CASE.
Template = {fluxo}{etapa}-{sigla_canal}. Ex.: A2-LI.

Sem template para a combinação → não cria disparo.

## VARIÁVEIS
{nome} {empresa} {cargo} {cargo_vaga} {gatilho} {gatilho_curto}
{novo_gatilho} {tema} {segmento} {case} {prova_curta} {link_case}
{insight_unico} {ponto_da_vaga} {prova_nova} {slot_a} {slot_b}
{remetente} {assinatura} {cta} {cta_en}

## CTA POR TEMPERATURA
Frio: "Faz sentido mantermos contato?"
Morno: "Faz sentido trocar uma ideia sobre isso?"
Quente: "Se fizer sentido, posso te mostrar rapidamente o case."
Muito quente: "Podemos conversar sobre isso?"

EN:
Frio: Would it make sense to stay in touch?
Morno: Would it make sense to exchange ideas on this?
Quente: Happy to show the case quickly if useful.
Muito quente: Can we talk about this?

Nunca pedir reunião de 30 min para lead frio.

## LIMITES POR CANAL
LinkedIn convite: ≤200 (validar)
LinkedIn mensagem: ≤500
E-mail: ~1000
WhatsApp: ≤600

## ESTILO
Preferir: "Vi X." / "Isso me chamou atenção porque..." / "Trabalhei em algo parecido..."
Evitar: "Espero que esteja tudo bem" / "Venho por meio desta" / "Tenho vasta experiência"

## FLUXO A · B2B/Parceria (voz F)

A1-LI · Convite
Oi, {nome}. Vi {gatilho_curto} na {empresa}. Trabalho com estratégia, processos e IA aplicada à operação e achei que valia nos conectarmos.

A2-LI · Pós-aceite
Obrigado por aceitar, {nome}. {gatilho}. Isso me lembrou um trabalho recente: {prova_curta} ({case}). Vi uma possível complementaridade com o que a {empresa} está fazendo em {tema}. {cta}

A3-EM · E-mail insight
Assunto: {empresa} e {tema}: uma observação

{nome}, vi {gatilho}.

Num projeto parecido ({case}), {prova_curta}. O ponto que mais pesou foi {insight_unico}: tratar {tema} como um fluxo único, e não como frentes isoladas.

Deixo o case aqui, caso ajude: {link_case}

{cta}

{assinatura}

A4-LI · Follow-up
{nome}, voltando ao que comentei sobre {tema}: separei o {case} porque tem a ver com o momento da {empresa}. {prova_curta}. {cta}

A5-EM · Fechamento
Assunto: Sigo à disposição, {nome}

{nome}, entendo que a rotina anda corrida. Deixo o assunto em aberto por aqui. Se {tema} voltar à pauta na {empresa}, é só me chamar.

{assinatura}

A6-RE · Reengajamento
{nome}, faz um tempo que trocamos mensagem. Vi {novo_gatilho} na {empresa} e lembrei da nossa conversa sobre {tema}. Faz sentido retomarmos?

## FLUXO B · Freelancer/Projetos

B1-LI · Convite
Oi, {nome}. Vi {gatilho_curto} e fiquei pensando em uma possível oportunidade em {tema}. Faz sentido nos conectarmos?

B2-LI · Case + pergunta
Obrigado por aceitar, {nome}. Vi {gatilho}. No {case}, {prova_curta}. Se {tema} estiver na pauta da {empresa}, posso comentar como estruturei. {cta}

B3-EM · Escopo
Assunto: Escopo enxuto para {tema} na {empresa}

{nome}, montei um escopo pontual em duas fases:
Fase 1: diagnóstico e priorização de {tema}.
Fase 2: execução do que a Fase 1 mostrar que vale.

Mesmo desenho do {case}: {prova_curta}. Case: {link_case}

{cta}

{assinatura}

B4-LI · Insight
{nome}, fiquei pensando em {tema} na {empresa}. No {case}, o que mais mudou o resultado foi {insight_unico}. Quer que eu detalhe?

B5-EM · Fechamento
Assunto: Deixo em aberto, {nome}

{nome}, não quero lotar sua caixa. Deixo a proposta de {tema} em aberto. Se o projeto entrar no radar, retomamos.

{assinatura}

## FLUXO C · Vagas

C1-LI · Hiring/recruiter
Oi, {nome}. Vi a vaga de {cargo_vaga} na {empresa} e há conexão direta com minha experiência: {prova_curta} (UnitedClass). Já me candidatei e queria me apresentar por aqui. Posso te enviar um resumo?

C1-EM · E-mail
Assunto: {cargo_vaga}: {nome}

{nome}, candidatei-me à vaga de {cargo_vaga}. Na UnitedClass, {prova_curta}. É o tipo de operação que a posição descreve ({ponto_da_vaga}).

Portfólio: {link_case}

{assinatura}

C2-LI · Segundo contato
Oi, {nome}. Estou me candidatando à posição de {cargo_vaga} na {empresa}. Se for o contato certo, fico à disposição; se não for, agradeço se puder me indicar quem cuida da vaga.

C3-FU · Follow-up
{nome}, retomando minha candidatura a {cargo_vaga}: um ponto que talvez ajude é {prova_nova}. Segue o material: {link_case}. Algum retorno?

C4-FE · Fechamento
{nome}, imagino que o processo esteja movimentado. Deixo meu interesse registrado em {cargo_vaga} e fico à disposição.

C5-NU · Pós-vaga
{nome}, vi que a posição de {cargo_vaga} foi encerrada. Sigo acompanhando o trabalho da {empresa} em {tema}. Se surgir algo, fico à disposição.

## FLUXO D · Terceirização (voz H)

D1-LI · Convite
Olá, {nome}! Acompanho o trabalho da {empresa} e gostaria muito de me conectar por aqui.

D2-LI · Consultiva
Oi, {nome}, obrigado por aceitar! Tenho acompanhado movimentos da {empresa} e acredito que podemos contribuir em marketing, conteúdo e comunicação. Existe algum desafio atual em que eu possa ajudar a pensar?

D3-LI · Follow-up 1
Oi, {nome}, só passando para não deixar esfriar. Separei um case parecido com o momento da {empresa}: {case} ({link_case}). Faz sentido trocarmos 15 min essa semana?

D4-LI · Follow-up 2
{nome}, entendo que a rotina anda corrida. Deixo em aberto por aqui — se fizer sentido conversar sobre marketing e conteúdo, é só me chamar.

D5-AG · Agendamento
Que ótimo, {nome}! Vou te apresentar o Flávio Guedes, que conduz a etapa de diagnóstico. Ele consegue {slot_a} ou {slot_b}. Qual funciona?

D6-WA · WhatsApp direto
Oi, {nome}, tudo bem? Aqui é {remetente}, conversamos no LinkedIn sobre a {empresa}. Queria entender melhor o momento de marketing e conteúdo. Tem 10 min essa semana? Se preferir não receber mensagens, é só avisar.

D7-RE · Reengajamento
Oi, {nome}, faz um tempo que trocamos mensagem. Passando para saber como está o momento da {empresa} hoje.

## RESPOSTAS A INTERAÇÃO

R-AGENDA · Positivo
Que ótimo, {nome}. Consigo {slot_a} ou {slot_b}. Qual funciona melhor?

R-PORTFOLIO · Pediu portfólio
Segue o material mais próximo do que você descreveu: {link}. Se quiser, comento como isso se aplicaria à {empresa}.

R-OBJ-ORCAMENTO · Objeção orçamento
Sem problema, {nome}. Muitos clientes começam só entendendo o diagnóstico, sem compromisso. Posso enviar um resumo do que costumamos identificar?

R-OBJ-AGENCIA · "Já temos agência"
Faz sentido, {nome}. Muitas vezes atuamos como complemento pontual, sem concorrer com o time atual. Vale uma conversa para mapear onde isso ajudaria?

R-SEM-OPORTUNIDADE · Sem interesse agora
Obrigado pela transparência, {nome}. Fico acompanhando. Se algo mudar, é só chamar.

R-OPTOUT · Pediu saída
Entendido, {nome}. Removi seu contato. Obrigado pelo retorno.

R-PESSOA-ERRADA
Obrigado, {nome}. Se puder me indicar quem cuida de {tema} na {empresa}, encaminho direto.

## CASES E PROVAS
EPQ: 42 leads em 2 semanas, reestruturação do fluxo comercial, painéis em tempo real, automação de captação
My Dream: +337% seguidores em 28 dias e +178,3% engajamento
UnitedClass: operação de comunicação estruturada do zero em 65 dias, equipe de 3, 8+ eventos, 4 campanhas
IEJUR: conteúdo técnico, planejamento editorial, eventos e mídia paga
Colgate: múltiplas frentes criativas sob linha editorial única
Gafisa: comunicação de vendas para lançamentos imobiliários
AstraZeneca: comunicação regulada, aprovação regulatória
Demais: descrever tipo de trabalho. Sem número.

## SEGMENTO → CASE
Imobiliário → Gafisa
Saúde, HealthTech → AstraZeneca
Varejo → Colgate
Food → My Dream
Educação, EdTech → IEJUR
Automotivo → Help Automotiva
Fluxo Comercial, Dados, Produtos Digitais, Automação, Processos, Marketing e Vendas → EPQ
Tecnologia, SaaS, Marketplace, E-commerce → BBScore / Estapar

## VALIDAÇÃO ANTES DE ENVIAR
- Sem variável {xxx} não resolvida
- Sem [colchete] remanescente
- Comprimento dentro do limite do canal
- Máximo 1 link
- Idioma bate com CONTATO.idioma
- CTA bate com temperatura
- Sem emoji (exceto se contato usou antes)
- Case citado existe na biblioteca
- WhatsApp: identificação + saída fácil
- E-mail frio: linha de saída
- Nome do contato escrito certo

## NUNCA SAI
Número sem fonte / métrica estimada / promessa de resultado /
case sem conexão / citar um contato para outro / "somos especialistas" /
preço / emoji / áudio no primeiro toque

