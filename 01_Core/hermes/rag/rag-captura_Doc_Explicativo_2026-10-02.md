# RAG · Captura diária de leads

## O QUE ESTE RAG RESOLVE

O Hunter roda todo dia e entrega leads novos para o painel. Este RAG
define: onde buscar, o que contar como lead válido, quais contatos
aceitar, o que fazer quando o dado está incompleto e como entregar
para o Mercúrio qualificar.

Sem este RAG, a captura vira lixo: lead sem canal, lead duplicado,
lead sem base legal. Aqui está o filtro.

Meta diária: **10 a 30 leads qualificáveis**, com pelo menos 1 canal
público válido cada. Qualidade sobre volume.

## PRINCÍPIOS INVIOLÁVEIS

1. **Todo dado tem origem rastreável.** Sem fonte registrada, o lead
   não entra. `FONTES` guarda URL, data e método.

2. **LGPD vale.** Só captura dado pessoal de contexto profissional
   (B2B, cargo, empresa) ou contato publicado pelo próprio titular
   em canal público. Nada de scraping de dado sensível, nada de
   lista comprada, nada de dado vazado.

3. **Nunca inventar.** Se o cargo não está claro, deixa em branco. Se
   o e-mail não foi publicado, não preenche. Campo vazio é honesto.

4. **Não duplicar.** Sempre roda dedup contra a base antes de
   entregar. Chave do lead: domínio. Chave do contato: LinkedIn >
   e-mail > telefone.

5. **Não capturar para vender para outro.** A base é de uso interno
   do Flávio. Sem exportação em massa sem decisão humana.

## ONDE BUSCAR (fontes permitidas)

Ordem de prioridade. Nem todas rodam todo dia — rotaciona conforme
o ciclo.

### Tier 1 · Fontes diretas (rodam diariamente)

| Fonte | O que extrai | Cadência |
|---|---|---|
| **Site da empresa** (via Google) | E-mail comercial, WhatsApp público, endereço, sócios | Diária |
| **LinkedIn** (perfis públicos) | Cargo, empresa, URL do perfil, às vezes e-mail no "sobre" | Diária |
| **Instagram comercial** (bios públicas) | WhatsApp/e-mail em bio, link da bio, nome comercial | Diária |
| **Google Maps / Places** | Telefone, site, e-mail comercial (quando listado), endereço | Diária |
| **Google Search** (com operadores) | Resultados de busca com contato visível | Diária |

### Tier 2 · Fontes contextuais (rodam 2–3x/semana)

| Fonte | O que extrai |
|---|---|
| **Portais de vaga** (Gupy, Kenoby, InHire, LinkedIn Jobs) | Vagas abertas + empresa (alimenta Fluxo C) |
| **Sites de associação/sindicato** | Lista de empresas do setor |
| **Eventos e feiras** (páginas públicas) | Expositores, palestrantes (empresa + cargo público) |
| **Diretórios de mercado** | Segmento → lista de empresas |
| **Blogs e newsletters setoriais** | Autores com bio pública |

### Tier 3 · Fontes de sinais (rodam 1x/semana)

| Fonte | O que extrai |
|---|---|
| **Fóruns e comunidades** (Reddit, Hacker News, grupos públicos) | Discussões que revelam dor (alimenta gatilho) |
| **Reclamações públicas** (Reclame Aqui, reviews) | Empresas com problema visível (gatilho) |
| **Notícias e releases** | Empresa em expansão, contratação, lançamento |
| **Financiamento e M&A** | Empresa com verba nova (gatilho forte) |

## Fontes PROIBIDAS (nunca capturar)

- Listas compradas ou vazadas
- Scraping agressivo que viole ToS (LinkedIn é o principal)
- Dados sensíveis (saúde, religião, política, orientação)
- Contatos de menores de idade
- Dados obtidos por engenharia social

## O QUE CONTA COMO LEAD VÁLIDO

Um lead entra na base se atender **todos**:

- [ ] É uma empresa (CNPJ, MEI, ou operação comercial clara)
- [ ] Tem pelo menos 1 canal público de contato (LinkedIn, e-mail,
      WhatsApp publicado, site com formulário)
- [ ] Tem contexto profissional (não é perfil pessoal sem relação)
- [ ] Está no segmento-alvo do painel (ver abaixo)
- [ ] Não está em DNC
- [ ] Não está duplicado na base
- [ ] Fonte registrada (URL + data)

### Segmentos-alvo (por prioridade)

| Segmento | Prioridade | Case padrão |
|---|---|---|
| B2B serviços, parceria | P1 | EPQ / UnitedClass |
| Freelancer, projetos | P2 | EPQ |
| Vagas (comunicação, produto, design) | P3 | UnitedClass / CEFM |
| Terceirização | P4 | Gafisa / AstraZeneca |
| Saúde, Educação, Food, Tech, Automotivo | Apoio | conforme mapa de cases |

Lead fora do segmento-alvo só entra se o gatilho for muito forte.
Caso contrário, vai para FILA_REVISAO.

## CONTATOS ACEITOS (por tipo)

Só entra contato com pelo menos 1 destes. Ordem de preferência:

### LinkedIn (preferido)
- URL do perfil no formato `https://www.linkedin.com/in/slug`
- Só perfil de pessoa física com cargo atual visível
- Não capturar se perfil está fechado ou não informa cargo

### E-mail
- Publicado em site, bio, ou perfil da empresa
- Marcar como `genérico` se for `contato@`, `comercial@`, `info@`
- Genérico só entra no Fluxo C (vagas) ou como canal secundário

### WhatsApp
- Só se **publicado pelo próprio** em bio, site ou Google Maps
- Marcar origem como `Público-comercial`
- Nunca inferir número a partir de DDD + nome

### Instagram
- Handle comercial (@empresa, @marca)
- Só se a bio tiver contato profissional
- Instagram não é canal de disparo — alimenta a ficha do lead

### Site
- Domínio do site oficial
- Não entra como canal de disparo; entra como fonte de contexto
  (valida empresa, alimenta case fit)

## O QUE REGISTRAR POR LEAD

Campos mínimos ao entregar para Mercúrio:

```
empresa         · nome comercial
dominio         · do site (ou derivado do e-mail)
segmento        · do mapa LISTAS.segmentos
pais / idioma   · BR / PT por padrão, EN se empresa fora do BR
fonte_url       · de onde veio (URL exata)
fonte_data      · quando foi capturado (ISO)
metodo          · site / linkedin / google-maps / diretorio / evento
```

Contatos vinculados (1 a N):

```
nome            · do perfil público
cargo           · como está no perfil (não normalizar ainda)
linkedin_url    · se existir
email           · se público
whatsapp        · se público
instagram       · se for @ comercial
origem_contato  · mesmo método do lead
```

Campos opcionais que aumentam valor:

```
gatilho_observado · vaga aberta, expansão, lançamento, menção na mídia
problema_aparente · inferido do contexto (reclamação, post, notícia)
cidade / uf       · do Maps ou do site
porte             · do site ou LinkedIn (funcionários)
```

## FLUXO DIÁRIO DE CAPTURA

### Ciclo automático (roda 07h30 todo dia)

1. **Varredura Tier 1** — Google Search com operadores, LinkedIn
   público, Instagram bios, Maps. Limite: 50 consultas/dia (rate
   limit para não chamuscar o IP).

2. **Extração bruta** — para cada resultado, extrai campos mínimos
   (empresa, cargo, contato). Não qualifica ainda.

3. **Dedup imediato** — antes de gravar, roda `normalizeBR` e
   compara domínio / LinkedIn URL contra a base. Se bater, mescla
   apenas dados novos (complementa, não sobrescreve).

4. **Validação de canal** — se não há canal público válido, descarta
   e registra em `FONTES.registros_rejeitados`. Não vai para
   FILA_REVISAO — é lixo puro.

5. **Entrega ao Mercúrio** — grava em `LEADS` com
   `status_lead = Novo` e dispara o ciclo de qualificação.

6. **Log** — registra em `CONTROLE.LOG`: quantos buscou, quantos
   aceitou, quantos rejeitou e por quê.

### Ciclo semanal (roda sexta 17h)

- Varredura Tier 2 e Tier 3.
- Relatório consolidado para o Flávio: fontes que mais renderam,
  segmentos com mais lead, taxa de aceite por fonte.
- Ajuste de rotação: se uma fonte rendeu muito, prioriza na semana
  seguinte; se rendeu zero 3 semanas seguidas, desativa.

## DEDUP (regra dura)

**Nunca merge automático.** Se duas chaves conflitarem, grava em
`CONTROLE.FILA_REVISAO` com motivo e segue.

### Ordem de checagem

1. Domínio do site → se bate, é o mesmo lead.
2. Nome normalizado da empresa (sem Ltda, S.A., MEI) → se bate 100%,
   é o mesmo lead.
3. LinkedIn URL do contato → se bate, é o mesmo contato.
4. E-mail → se bate, é o mesmo contato.
5. Telefone normalizado → se bate, é o mesmo contato.

Se 1 e 2 divergem, ou 3–5 conflitam entre leads diferentes →
FILA_REVISAO.

## LIMITES E RATE

A captura não pode queimar o IP, a conta ou a reputação da operação.
Limites diários sugeridos (validar com dados reais):

| Fonte | Consultas/dia | Observação |
|---|---|---|
| Google Search | 30 | Usar operadores, não varrer tudo |
| LinkedIn público | 20 | Apenas leitura de perfil público |
| Instagram | 20 | Apenas bios públicas |
| Google Maps | 50 | Sem custo, mas não abusar |
| Sites diretos | 100 | GET no site oficial + parser |
| Fóruns | 10 | Só threads públicas |

Se qualquer fonte retornar captcha, aviso ou erro 429 → **pausa
essa fonte por 24h**, registra, segue com as
outras. Nunca tentar "furar" o bloqueio.

## FALHA E RECUPERAÇÃO

| Situação | Ação |
|---|---|
| Google retorna captcha | Pausa Google 24h, registra, segue |
| LinkedIn exige login | Pausa LinkedIn 24h, não tentar contornar |
| Site fora do ar | Marca como `Inacessível`, tenta em 7 dias |
| Instagram bloqueia bio | Pausa Instagram 24h |
| Fonte retorna 0 resultados 3 dias seguidos | Registra em relatório semanal |
| Taxa de rejeição > 80% numa fonte | Sugere desligar fonte |

## INTEGRAÇÃO COM OS OUTROS RAGs

- **`rag-fila.md`**: os leads capturados entram na fila respeitando
  limites diários e rampa (para lead novo).
- **`rag-mensagens.md`**: define o texto do primeiro toque.
- **`rag-whatsapp.md`**: só dispara para os leads capturados se o
  número foi publicado pelo próprio.
- **`rag-hermes.md`**: comportamento do Hermes ao reportar captura.

## SAÍDA ESPERADA

Todo dia o Hunter produz:

1. **Leads novos** em `LEADS` com `status_lead = Novo`.
2. **Contatos vinculados** em `CONTATOS` com status `Novo`.
3. **Log da captura** em `CONTROLE.LOG`:
   - busca: N consultas
   - aceitos: N leads / M contatos
   - rejeitados: N (por motivo)
   - duplicados: N
   - fontes ativas: lista
   - fontes pausadas: lista

4. **Relatório semanal** (sexta):
   - taxa de aceite por fonte
   - segmentos cobertos
   - sugestão de ajuste de rotação

## MÉTRICAS DE SAÚDE

| Métrica | Meta | Alerta se |
|---|---|---|
| Leads aceitos/dia | 10–30 | < 5 por 3 dias |
| Taxa de aceite | ≥ 40% | < 20% |
| Taxa de rejeição por fonte | ≤ 60% | > 80% |
| Contatos com LinkedIn | ≥ 60% | < 40% |
| Contatos com e-mail | ≥ 40% | < 25% |
| Contatos com WhatsApp | ≥ 20% | < 10% |
| Duplicatas enviadas à revisão | < 5% | > 15% |
| Fontes ativas | ≥ 3 | < 2 |

## REGRAS INVIOLÁVEIS

1. Nunca capturar sem fonte URL e data registradas.
2. Nunca capturar fora dos segmentos-alvo sem gatilho forte.
3. Nunca merge automático em conflito de chave.
4. Nunca contornar captcha, login ou bloqueio.
5. Nunca usar lista comprada ou dado vazado.
6. Nunca entregar lead sem pelo menos 1 canal público válido.
7. Nunca ignorar opt-out — se a pessoa pediu remoção em qualquer
   canal, DNC global imediato, e a captura não recria.
8. Se uma fonte fica offline, o ciclo continua com as outras.
   Nunca travar por causa de uma.
