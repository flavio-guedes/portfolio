# Base de conhecimento: engenharia de software e infraestrutura (111 tópicos)

**Fonte:** carrossel "Quem vai contar pros vibe coders sobre..." de @fabianocarvalhojr
**Uso:** base de treinamento e referência para um sistema agêntico. Cada tópico traz uma descrição curta e critérios de verificação que um agente pode usar para revisar código, arquitetura ou decisões técnicas.
**Estrutura:** seis blocos temáticos. Cada tópico tem número, nome, descrição e critérios de verificação.

---

## Bloco 1: Arquitetura e resiliência (1 a 19)

### 1. Limite de requisições
- **Descrição:** controla quantas requisições um cliente pode fazer em um intervalo de tempo.
- **Verificar:** limite definido por cliente, IP ou chave de API; resposta 429 com cabeçalho Retry-After; limite não contornável por troca de cabeçalhos.

### 2. Cache
- **Descrição:** armazena resultados já calculados para reduzir carga e latência.
- **Verificar:** TTL definido; estratégia para dados desatualizados; dados sensíveis não são cacheados sem controle de acesso.

### 3. Balanceamento de carga
- **Descrição:** distribui requisições entre várias instâncias de um serviço.
- **Verificar:** health checks configurados; algoritmo escolhido (round robin, least connections etc.); sessões tratadas (stateless ou sticky).

### 4. Proxies reversos
- **Descrição:** intermediário que recebe requisições externas e as encaminha a serviços internos.
- **Verificar:** backends ocultos da internet; terminação TLS quando aplicável; limites de tamanho de payload e de timeout.

### 5. API Gateways
- **Descrição:** ponto de entrada que centraliza autenticação, limite de taxa, roteamento e observabilidade.
- **Verificar:** autenticação feita na borda; roteamento por versão; logs centralizados.

### 6. CI/CD
- **Descrição:** pipeline automatizado de build, teste e deploy.
- **Verificar:** testes executados antes do deploy; artefatos versionados; deploy reversível.

### 7. Docker
- **Descrição:** empacotamento de aplicações em containers isolados e reproduzíveis.
- **Verificar:** imagem mínima; processo não executa como root; nenhum segredo embutido na imagem.

### 8. Kubernetes
- **Descrição:** orquestra containers, cuidando de escala, reinício e deploy.
- **Verificar:** requests e limits de CPU e memória definidos; probes configuradas; segredos vindos de Secret ou gerenciador externo.

### 9. Descoberta de serviços
- **Descrição:** localiza dinamicamente as instâncias disponíveis de cada serviço.
- **Verificar:** registro e remoção automáticos; instâncias indisponíveis deixam de receber tráfego.

### 10. Circuit breakers
- **Descrição:** interrompe chamadas a um serviço que falha repetidamente, dando tempo para ele se recuperar.
- **Verificar:** estados aberto, meio-aberto e fechado implementados; fallback definido; limiar de falha configurado.

### 11. Timeouts
- **Descrição:** limite de tempo para aguardar operações remotas.
- **Verificar:** todo cliente HTTP e de banco tem timeout explícito; timeouts em cascata são coerentes entre camadas.

### 12. Retries
- **Descrição:** repete operações que falharam de forma transitória.
- **Verificar:** usado apenas em operações seguras ou idempotentes; número máximo de tentativas definido; sem tempestade de retries.

### 13. Backoff exponencial
- **Descrição:** aumenta o intervalo entre tentativas a cada falha.
- **Verificar:** intervalo cresce exponencialmente; jitter aplicado; teto máximo definido.

### 14. Idempotência
- **Descrição:** repetir a mesma operação produz o mesmo efeito que executá-la uma vez.
- **Verificar:** chave de idempotência em criações e pagamentos; efeito único garantido no armazenamento.

### 15. Filas de mensagens
- **Descrição:** desacoplam produtor e consumidor, que processam no próprio ritmo.
- **Verificar:** confirmação (ack) explícita; mensagens duplicadas tratadas; ordem garantida quando necessária.

### 16. Pub/Sub
- **Descrição:** publicadores enviam eventos a vários assinantes independentes.
- **Verificar:** assinantes não dependem uns dos outros; contrato do evento versionado.

### 17. Arquitetura orientada a eventos
- **Descrição:** componentes reagem a eventos que descrevem fatos já ocorridos.
- **Verificar:** eventos nomeados como fatos passados; rastreabilidade entre eventos encadeados.

### 18. Transações distribuídas
- **Descrição:** mantêm consistência entre operações que envolvem vários serviços ou bancos.
- **Verificar:** estratégia (compensação ou 2PC) documentada; falhas parciais tratadas explicitamente.

### 19. Padrão Saga
- **Descrição:** sequência de transações locais, em que cada passo tem uma compensação caso a saga falhe.
- **Verificar:** cada passo possui compensação; estado da saga persistido para retomada.

---

## Bloco 2: Dados, banco e concorrência (20 a 41)

### 20. Dead letter queues
- **Descrição:** fila para mensagens que falharam repetidamente e precisam de análise.
- **Verificar:** DLQ monitorada; reprocessamento manual ou automático definido.

### 21. Cron jobs
- **Descrição:** tarefas agendadas para horários ou intervalos fixos.
- **Verificar:** execuções não se sobrepõem; tarefa idempotente; falhas geram alerta.

### 22. WebSockets
- **Descrição:** canal bidirecional persistente entre cliente e servidor.
- **Verificar:** reconexão tratada; autenticação no handshake; limite de conexões simultâneas.

### 23. Long polling
- **Descrição:** o cliente mantém uma requisição aberta até o servidor ter dados para responder.
- **Verificar:** timeout da requisição definido; reconexão imediata; custo de conexões abertas monitorado.

### 24. Server-Sent Events
- **Descrição:** fluxo unidirecional do servidor para o cliente, sobre HTTP.
- **Verificar:** reconexão com Last-Event-ID; usado quando o cliente não precisa enviar dados em tempo real.

### 25. Índices no banco
- **Descrição:** estruturas que aceleram buscas por colunas específicas.
- **Verificar:** índices alinhados às consultas reais; custo de escrita considerado.

### 26. Otimização de queries
- **Descrição:** reescrita e ajuste de consultas para reduzir tempo e uso de recursos.
- **Verificar:** plano de execução (EXPLAIN) analisado; sem SELECT * desnecessário; paginação aplicada.

### 27. Queries N+1
- **Descrição:** uma consulta inicial seguida de uma consulta por item retornado.
- **Verificar:** problema detectado em logs ou no ORM; resolvido com join ou eager loading.

### 28. Pool de conexões
- **Descrição:** reutiliza conexões com o banco em vez de abrir uma nova a cada operação.
- **Verificar:** tamanho máximo configurado; conexões devolvidas em todos os caminhos de código; timeout de espera definido.

### 29. Réplicas de leitura
- **Descrição:** cópias do banco que atendem consultas de leitura.
- **Verificar:** atraso de replicação (lag) tratado; leituras críticas direcionadas ao primário.

### 30. Sharding
- **Descrição:** divide os dados horizontalmente entre vários bancos.
- **Verificar:** chave de shard com distribuição uniforme; consultas entre shards minimizadas.

### 31. Particionamento
- **Descrição:** divide tabelas ou conjuntos de dados em partes menores.
- **Verificar:** critério de partição alinhado às consultas; criação e remoção de partições automatizadas.

### 32. Replicação
- **Descrição:** mantém cópias dos dados em vários nós.
- **Verificar:** modo síncrono ou assíncrono definido; procedimento de promoção de réplica documentado.

### 33. Eleição de líder
- **Descrição:** escolhe um nó coordenador em um sistema distribuído.
- **Verificar:** algoritmo de consenso (Raft, Paxos ou serviço gerenciado); risco de split-brain evitado.

### 34. Teorema CAP
- **Descrição:** durante uma partição de rede, um sistema precisa escolher entre consistência e disponibilidade.
- **Verificar:** trade-off explicitado por componente; comportamento em partição definido.

### 35. Consistência eventual
- **Descrição:** réplicas convergem para o mesmo estado com o tempo.
- **Verificar:** janela de inconsistência aceitável para o negócio; conflitos resolvidos com regra definida.

### 36. Lock otimista
- **Descrição:** detecta conflito comparando uma versão na hora de gravar, sem bloquear a leitura.
- **Verificar:** campo de versão atualizado a cada escrita; conflito tratado com nova tentativa ou erro claro.

### 37. Lock pessimista
- **Descrição:** bloqueia o registro durante a leitura e escrita para evitar acesso concorrente.
- **Verificar:** duração do lock mínima; risco de deadlock avaliado.

### 38. Locks distribuídos
- **Descrição:** exclusão mútua entre processos que rodam em máquinas diferentes.
- **Verificar:** expiração (TTL) definida; fencing token considerado para evitar uso após expiração.

### 39. Condições de corrida
- **Descrição:** o resultado depende da ordem de execução de operações concorrentes.
- **Verificar:** estado compartilhado protegido; testes de concorrência presentes.

### 40. Deadlocks
- **Descrição:** processos ficam esperando uns pelos outros indefinidamente.
- **Verificar:** ordem consistente de aquisição de locks; timeout de transação configurado.

### 41. Vazamento de memória
- **Descrição:** memória alocada que nunca é liberada, crescendo ao longo do tempo.
- **Verificar:** listeners e timers removidos ao fim do uso; uso de heap monitorado ao longo do tempo.

---

## Bloco 3: Escala e entrega (42 a 59)

### 42. Coleta de lixo
- **Descrição:** liberação automática de memória que não está mais em uso.
- **Verificar:** pausas medidas em cenários de carga; alocações grandes evitadas em caminhos críticos.

### 43. Thread safety
- **Descrição:** garantia de que o código funciona corretamente quando executado por várias threads.
- **Verificar:** estado mutável compartilhado sincronizado; coleções concorrentes usadas quando necessário.

### 44. Backpressure
- **Descrição:** o consumidor sinaliza ao produtor que precisa desacelerar.
- **Verificar:** buffers com limite; comportamento definido quando saturado (rejeitar ou enfileirar com limite).

### 45. Autoscaling
- **Descrição:** ajuste automático do número de instâncias conforme a demanda.
- **Verificar:** métricas de gatilho definidas; limites mínimo e máximo; tempo de inicialização considerado.

### 46. Escala horizontal
- **Descrição:** aumenta a capacidade adicionando mais instâncias.
- **Verificar:** aplicação stateless ou estado externalizado.

### 47. Escala vertical
- **Descrição:** aumenta a capacidade aumentando os recursos de uma instância.
- **Verificar:** limite físico e custo avaliados; impacto em disponibilidade considerado.

### 48. CDN
- **Descrição:** rede de distribuição de conteúdo com servidores em várias regiões.
- **Verificar:** cabeçalhos de cache corretos; conteúdo dinâmico tratado separadamente.

### 49. Cache na borda
- **Descrição:** armazena respostas em servidores próximos ao usuário.
- **Verificar:** chaves de cache corretas; conteúdo personalizado não vazado para outros usuários.

### 50. Invalidação de cache
- **Descrição:** remoção ou atualização de entradas desatualizadas.
- **Verificar:** estratégia definida (TTL, evento ou purge); risco de dado antigo avaliado.

### 51. Feature flags
- **Descrição:** ativam ou desativam funcionalidades sem novo deploy.
- **Verificar:** cada flag tem dono e data prevista de remoção; comportamento padrão seguro.

### 52. Deploy blue-green
- **Descrição:** dois ambientes idênticos, com troca de tráfego entre eles.
- **Verificar:** banco compatível com as duas versões; troca reversível.

### 53. Releases canário
- **Descrição:** a nova versão é liberada primeiro para uma pequena parcela de usuários.
- **Verificar:** métricas comparadas com a versão estável; critério de promoção ou rollback definido.

### 54. Rolling deploys
- **Descrição:** atualização gradual das instâncias, uma parcela por vez.
- **Verificar:** versões coexistentes são compatíveis; health checks ativos durante a troca.

### 55. Rollbacks
- **Descrição:** retorno à versão anterior após uma falha.
- **Verificar:** rollback testado; migrations reversíveis ou compatíveis com a versão anterior.

### 56. Health checks
- **Descrição:** verificação de que a instância está operacional.
- **Verificar:** checagem leve; não depende de serviços externos para indicar que o processo está vivo.

### 57. Liveness e readiness probes
- **Descrição:** liveness indica se o processo travou e deve ser reiniciado; readiness indica se pode receber tráfego.
- **Verificar:** as duas probes são distintas; timeouts e intervalos adequados.

### 58. Monitoramento
- **Descrição:** coleta contínua da saúde do sistema.
- **Verificar:** dashboards cobrindo latência, erros, saturação e volume de tráfego.

### 59. Logs
- **Descrição:** registros de eventos gerados pela aplicação.
- **Verificar:** formato estruturado; sem dados sensíveis; correlação por ID de requisição.

---

## Bloco 4: Observabilidade e segurança (60 a 82)

### 60. Rastreamento distribuído
- **Descrição:** acompanha o caminho de uma requisição entre vários serviços.
- **Verificar:** trace ID propagado em todos os saltos, inclusive em filas e chamadas assíncronas.

### 61. Métricas
- **Descrição:** valores numéricos agregados ao longo do tempo.
- **Verificar:** nomes e rótulos consistentes; cardinalidade controlada.

### 62. Alertas
- **Descrição:** notificações disparadas quando uma condição anormal acontece.
- **Verificar:** alertas acionáveis; ligados a sintomas percebidos pelo usuário, não a ruído.

### 63. SLOs
- **Descrição:** metas de confiabilidade definidas para um serviço.
- **Verificar:** meta baseada na expectativa real do usuário e acompanhada com regularidade.

### 64. SLIs
- **Descrição:** indicadores que medem o desempenho do serviço, como taxa de sucesso ou latência.
- **Verificar:** medidos do ponto de vista do usuário; definição explícita de quais requisições contam.

### 65. Error budgets
- **Descrição:** margem de falha tolerada pelo SLO.
- **Verificar:** consumo do orçamento acompanhado; decisões de release ligadas ao saldo disponível.

### 66. Observabilidade
- **Descrição:** capacidade de entender o estado interno do sistema a partir dos dados que ele emite (logs, métricas e traces).
- **Verificar:** os três sinais integrados; novas perguntas respondíveis sem novo deploy.

### 67. Gestão de segredos
- **Descrição:** armazenamento e distribuição seguros de credenciais e chaves.
- **Verificar:** nenhum segredo no código ou no repositório; rotação possível sem reescrever o código.

### 68. IAM
- **Descrição:** controle de identidades, papéis e permissões.
- **Verificar:** princípio do menor privilégio aplicado; permissões revisadas periodicamente.

### 69. OAuth
- **Descrição:** protocolo de autorização delegada entre aplicações.
- **Verificar:** fluxo adequado ao tipo de cliente; escopos mínimos; PKCE em clientes públicos.

### 70. Rotação de JWT
- **Descrição:** troca periódica das chaves usadas para assinar tokens.
- **Verificar:** validação aceita a chave anterior durante a transição; tokens com expiração curta.

### 71. TLS
- **Descrição:** protocolo que criptografa a comunicação na rede.
- **Verificar:** versões antigas desabilitadas; certificados renovados automaticamente.

### 72. Criptografia em repouso
- **Descrição:** dados armazenados de forma cifrada.
- **Verificar:** chaves gerenciadas separadamente dos dados cifrados.

### 73. Criptografia em trânsito
- **Descrição:** proteção dos dados enquanto são transmitidos.
- **Verificar:** TLS em todas as conexões, inclusive as internas com dados sensíveis.

### 74. WAF
- **Descrição:** firewall de aplicação web que filtra requisições maliciosas.
- **Verificar:** modo de detecção testado antes do bloqueio; regras atualizadas.

### 75. Proteção contra DDoS
- **Descrição:** mitigação de ataques que tentam sobrecarregar o serviço.
- **Verificar:** limites de taxa e serviço de mitigação na borda da rede.

### 76. CORS
- **Descrição:** política que define quais origens podem acessar a API a partir do navegador.
- **Verificar:** origens listadas explicitamente; wildcard não usado junto com credenciais.

### 77. CSRF
- **Descrição:** ataque que induz o navegador do usuário autenticado a executar ações indesejadas.
- **Verificar:** tokens anti-CSRF ou cookies com SameSite em ações que alteram estado.

### 78. SQL Injection
- **Descrição:** entrada maliciosa que altera a consulta SQL executada.
- **Verificar:** consultas parametrizadas; entrada do usuário nunca concatenada em SQL.

### 79. XSS
- **Descrição:** injeção de scripts que são executados no navegador de outros usuários.
- **Verificar:** escape de saída aplicado; Content-Security-Policy configurada.

### 80. SSRF
- **Descrição:** o servidor é induzido a fazer requisições para destinos internos ou sensíveis.
- **Verificar:** allowlist de destinos; bloqueio de IPs privados e do endpoint de metadados da nuvem.

### 81. Migrations de banco
- **Descrição:** alterações versionadas no esquema do banco.
- **Verificar:** migrations reversíveis ou compatíveis com a versão anterior; testadas em staging.

### 82. Versionamento de schema
- **Descrição:** controle da evolução da estrutura dos dados.
- **Verificar:** mudanças retrocompatíveis; campos marcados como depreciados antes de serem removidos.

---

## Bloco 5: Confiabilidade, rede e protocolos (83 a 101)

### 83. Recuperação de desastres
- **Descrição:** restauração da operação após uma falha grave.
- **Verificar:** RTO e RPO definidos e testados na prática.

### 84. Backups
- **Descrição:** cópias dos dados usadas para restauração.
- **Verificar:** restauração testada periodicamente; cópias guardadas fora do ambiente principal.

### 85. Failover
- **Descrição:** troca automática para um componente de reserva quando o principal falha.
- **Verificar:** detecção de falha confiável; procedimento de retorno ao principal definido.

### 86. Deploy multirregião
- **Descrição:** sistema operando em várias regiões geográficas.
- **Verificar:** estratégia de dados entre regiões definida; roteamento por proximidade ou saúde.

### 87. Engenharia do caos
- **Descrição:** injeção controlada de falhas para testar a resiliência do sistema.
- **Verificar:** experimento com hipótese, escopo limitado e critério de parada.

### 88. Otimização de custos
- **Descrição:** redução de gastos mantendo os requisitos atendidos.
- **Verificar:** custo atribuído por serviço; recursos ociosos identificados.

### 89. Cold starts
- **Descrição:** latência da primeira execução após período de inatividade, comum em serverless.
- **Verificar:** impacto medido; pré-aquecimento aplicado quando o caminho é crítico.

### 90. Limites do serverless
- **Descrição:** restrições de tempo de execução, memória, conexões e estado.
- **Verificar:** duração e concorrência compatíveis com a carga esperada.

### 91. Latência
- **Descrição:** tempo entre o envio de uma requisição e a resposta recebida.
- **Verificar:** medida ponta a ponta, do lado do cliente quando possível.

### 92. Throughput
- **Descrição:** volume de trabalho processado por unidade de tempo.
- **Verificar:** medido sob carga realista.

### 93. Latência P99
- **Descrição:** tempo abaixo do qual 99% das requisições são concluídas.
- **Verificar:** percentis analisados, não apenas médias.

### 94. Latência de cauda
- **Descrição:** comportamento das requisições mais lentas, que muitas vezes revelam gargalos ocultos.
- **Verificar:** causas dos outliers investigadas (pausas de coleta de lixo, filas, retries).

### 95. Partições de rede
- **Descrição:** perda de comunicação entre nós que deveriam se falar.
- **Verificar:** comportamento em partição definido e testado.

### 96. Clock skew
- **Descrição:** diferença entre os relógios de máquinas distintas.
- **Verificar:** NTP sincronizado; ordenação crítica não depende de timestamps locais.

### 97. DNS
- **Descrição:** sistema que traduz nomes em endereços IP.
- **Verificar:** TTLs adequados a mudanças de infraestrutura; efeito de cache DNS considerado.

### 98. TCP vs UDP
- **Descrição:** TCP garante entrega e ordem; UDP não tem conexão nem essas garantias.
- **Verificar:** protocolo escolhido conforme a necessidade de confiabilidade e latência.

### 99. HTTP/2 e HTTP/3
- **Descrição:** versões que permitem múltiplas requisições simultâneas numa mesma conexão; o HTTP/3 usa QUIC sobre UDP.
- **Verificar:** suporte habilitado no servidor e na CDN.

### 100. gRPC
- **Descrição:** RPC binário sobre HTTP/2, com contratos definidos em Protobuf.
- **Verificar:** contratos versionados; deadlines definidos nas chamadas.

### 101. Webhooks
- **Descrição:** notificações HTTP enviadas por um sistema ao receptor quando um evento ocorre.
- **Verificar:** assinatura do payload validada; processamento idempotente no receptor; reentregas tratadas.

---

## Bloco 6: Versionamento e operação (102 a 111)

### 102. Versionamento de API
- **Descrição:** controle das versões da interface pública.
- **Verificar:** estratégia clara (na URL ou em cabeçalho); compatibilidade e prazo de depreciação comunicados.

### 103. Versionamento semântico
- **Descrição:** esquema MAJOR.MINOR.PATCH que indica o tipo de mudança.
- **Verificar:** MAJOR usado para quebras de compatibilidade; changelog mantido.

### 104. Infraestrutura como código
- **Descrição:** infraestrutura definida em arquivos versionados.
- **Verificar:** ambientes reproduzíveis; mudanças passam por revisão.

### 105. Terraform
- **Descrição:** ferramenta declarativa de infraestrutura como código, com suporte a várias nuvens.
- **Verificar:** estado remoto com lock; plan revisado antes do apply.

### 106. Helm charts
- **Descrição:** pacotes de manifestos para Kubernetes, parametrizáveis.
- **Verificar:** valores separados por ambiente; templates validados antes do deploy.

### 107. Cache de build
- **Descrição:** reaproveitamento de resultados de compilações anteriores.
- **Verificar:** chaves de cache refletem todas as entradas da build; builds reproduzíveis.

### 108. Inferno de dependências
- **Descrição:** conflitos entre versões de bibliotecas que dependem umas das outras.
- **Verificar:** lockfile versionado; atualizações feitas em pequenos lotes e testadas.

### 109. Incidentes em produção
- **Descrição:** gestão de falhas que afetam usuários reais.
- **Verificar:** processo de resposta, comunicação e classificação de severidade definidos.

### 110. Plantão
- **Descrição:** escala de atendimento a alertas fora do horário comercial.
- **Verificar:** rotação justa; runbooks disponíveis; volume de alertas por plantonista acompanhado.

### 111. Postmortems
- **Descrição:** análise de incidentes focada em causas e aprendizado, sem buscar culpados.
- **Verificar:** linha do tempo, causa raiz e ações corretivas com dono e prazo.
