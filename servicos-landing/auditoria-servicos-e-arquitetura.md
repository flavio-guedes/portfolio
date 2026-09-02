# Auditoria · Serviços + Arquitetura de Landing Pages

## 1. Repositório analisado

- Caminho: `/Users/mac/repo-portfolio`
- Site canônico: `https://flavio-guedes.github.io/portfolio/`
- Natureza: HTML/CSS/JS estático, sem framework, sem roteamento, sem data files.

## 2. Estrutura relevante encontrada

### Páginas que representam serviços
- `index.html` — hub
- `produto.html` — produto, UX, design system, consultoria, MVP
- `designhead.html` — direção criativa, branding, conteúdo, opinião, IA
- `parceria.html` — parceria/marketing operacional
- `cases/Marcio_Lopes_Landing.html` — case de transição de carreira

### Evidências operacionais/comerciais
- `planoads.html` — plano de ads
- `relatorio-ads-ago.html` — relatório de ads/performance
- `bolsao*.html` — EPQ
- `01 - Apoio/*.png` — assets/capas
- `integration-manifest.json` — existente, mas sem integração de leads
- `render.yaml` — backend CRM Python no Render, não usado para leads públicas aqui

### Assets/capas base
- `capa-padrao-hero.png`
- `01 - Apoio/Capa Produc Manager.png`

### Observações
- Não existem tokens centralizados, componentes reutilizáveis, rotas ou data files.
- Cada página é um documento HTML grande e isolado.
- Integração de captura/CRM/WhatsApp/Sheets/webhook não existe ainda.

## 3. Serviços identificados com sustentação real

01 · Produto & UX Design
Projetos relacionados:
- `produto.html`
- EPQ: painel de conteúdo e tarefas

Provas encontradas:
- UX, pesquisa, wireframe, prototipação, métrica
- Design system com tokens e componentes
- MVP de produto e priorização
- Governança/operação com previsibilidade

Potencial comercial:
Alto — já há página dedicada e casos documentados.

---

02 · Design System & Operação Digital
Projetos relacionados:
- `produto.html`
- EPQ painel/conteúdo/tarefas

Provas encontradas:
- Tokens, componentes, grid, radius, motion
- Governança visual
- Consistência em larga escala

Potencial comercial:
Alto — complementa Produto/UX e pode ser oferta própria.

---

03 · Direção Criativa / Branding
Projetos relacionados:
- `designhead.html`
- cases externos no Behance
- Hershey, Colgate, My Dream Foods

Provas encontradas:
- Posicionamento editorial
- Direção criativa para marcas
- Campanhas e identidade

Potencial comercial:
Alto — já há posicionamento forte e portfólio reconhecível.

---

04 · Estratégia de Conteúdo & Redação
Projetos relacionados:
- `designhead.html`
- EPQ conteúdo/planejamento
- plano-conteudo-trafego.html

Provas encontradas:
- Territórios de conteúdo
- Planejamento editorial
- Copy e formato

Potencial comercial:
Alto — pode ser oferta ou parte de parceria.

---

05 · Tráfego Pago / Growth
Projetos relacionados:
- `planoads.html`
- `relatorio-ads-ago.html`

Provas encontradas:
- Planejamento semanal de ads
- Funil Topo/Meio/Fundo
- Métricas e cronograma

Potencial comercial:
Médio — hoje está amarrado a execução operacional; pode virar oferta estruturada.

---

06 · Consultoria Executiva em Produto/Marketing
Projetos relacionados:
- `produto.html`
- `parceria.html`

Provas encontradas:
- Diagnóstico, plano de ação, priorização, métrica
- Formato avulso, mensal, sprint

Potencial comercial:
Alto — pode ser porta de entrada para projetos maiores.

---

Serviços que NÃO entrarão agora por falta de sustentação explícita no repositório:
- IA Generativa/IA Agêntica/Automação/GTM/Processos/Comunicação geral: há indícios no posicionamento, mas não há página/case/entregável dedicado suficiente para sustentar landing própria neste momento.

## 4. Arquitetura proposta

```
/Users/mac/repo-portfolio/servicos-landing/
  /assets
    master.css
    master-design-tokens.css
  /components
    hero.html
    problem.html
    solution.html
    services.html
    cases.html
    process.html
    testimonials.html
    faq.html
    cta.html
    leadform.html
    related-services.html
    footer.html
  /data
    services.json
    cases.json
    testimonials.json
    faq.json
  /pages
    index.html
    produto-ux-design.html
    design-system.html
    direcao-criativa.html
    estrategia-conteudo.html
    trafego-pago.html
    consultoria.html
```

Slugs:
- `/servicos/` — hub
- `/servicos/produto-ux-design`
- `/servicos/design-system`
- `/servicos/direcao-criativa`
- `/servicos/estrategia-conteudo`
- `/servicos/trafego-pago`
- `/servicos/consultoria`

## 5. Design system extraído

### Cores
- Dark editorial: `#0A0A0A`, `#F1EDE4`
- Azul marca: `#1455C0`
- Vermelho marca: `#E52420`
- Roxo produto: `#a855f7`, `#6366f1`
- Cinzas neutros e superfícies claras

### Tipografia
- Display: Anton
- Corpo: Inter
- Títulos fortes, uppercase controlado, hierarquia clara

### Grid/Espaçamento
- Containers com 5vw/24px
- Grid com 1fr 1fr e fallback mobile
- Gap médio: 16-28px
- Respiração larga entre seções

### Componentes
- eyebrow/kicker
- stat-card
- case-card
- badge/pill
- signature chips
- timeline items
- contacto buttons

### Animações
- fadeInUp
- float/blobs sutis
- hover com translate e sombra
- scroll-behavior: smooth

### Responsivo
- breakpoints: 1024, 768, 720, 600
- hierarquias reorganizadas para mobile

## 6. Próximos passos recomendados

1. Aprovar lista de serviços e slugs.
2. Aprovar estrutura modular.
3. Criar `master-design-tokens.css` e `master.css`.
4. Implementar hub `/servicos`.
5. Implementar 1 landing como template canônico.
6. Replicar para os demais serviços apenas por dados.
7. Adicionar formulário com campos estruturados.
8. Planejar integração futura: Google Sheets / CRM / WhatsApp / webhook.
