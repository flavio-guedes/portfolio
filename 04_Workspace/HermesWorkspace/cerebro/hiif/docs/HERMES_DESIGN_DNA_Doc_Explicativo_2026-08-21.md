# HERMES — DESIGN DNA

Documento canônico de identidade visual, comportamento e estrutura de interface.
Use este arquivo como contrato para reconstruir, refinar ou auditar a UI do Hermes.

---

## 1. Arquitetura da interface

- Layout base: app shell com topbar fixa, sidebar fixa e área principal fluida.
- Responsabilidade clara: navegação global na esquerda, contexto e estado no topo, trabalho principal no centro.
- Princípio: zero scroll lateral no desktop; no mobile, sidebar vira drawer e conteúdo vira coluna única.
- Composição preferida: painel principal + overlays discretos (command palette, drawers, toasts).
- Camadas visuais: fundo atmosférico > superfície > conteúdo > ações > foco.
- Regra: interface nunca deve competir com o conteúdo. Decoração apóia legibilidade, não a substitui.

---

## 2. Grid e proporções

- Grid base: 12 colunas.
- Sidebar desktop: 280px fixos.
- Topbar: 64px fixos.
- Espaçamento base: 4px.
- Escala de espaçamento: 4, 8, 12, 16, 20, 24, 32, 40.
- Conteúdo principal:
  - margem horizontal mínima: 32px;
  - largura máxima de leitura: 1200px;
  - quebras em 860px e 480px.
- Raio padrão:
  - sm: 6px;
  - md: 10px;
  - lg: 16px;
  - full: 9999px para pills/badges.

---

## 3. Sistema de cores

- Modo preferido: dark-first.
- Papéis semânticos:
  - bg: preto profundo;
  - surface: vidro com transparência baixa;
  - surface-hover: vidro com transparência média;
  - border: borda mínima e contida;
  - border-active: foco/estado ativo;
  - text: texto primário;
  - text-secondary: texto secundário;
  - text-tertiary: texto suprimido;
  - accent: cor de destaque azulada fria;
  - accent-glow: brilho de destaque;
  - success: verde;
  - warning: âmbar;
  - danger: vermelho.
- Regra: cor comunica estado, não decora. Evitar paletas quentes em excesso.
- Translucidez: usar com moderação para superfícies, nunca para texto.

---

## 4. Tipografia

- Famílias: Space Grotesk para títulos; Inter para corpo.
- Pesos preferidos: 300, 400, 500, 600.
- Títulos: mais curtos e pesados; corpo: leve e espacioso.
- Escala tipográfica:
  - xs: 10px / 11px;
  - sm: 12px / 12.5px;
  - base: 13px / 13.5px;
  - md: 15px / 16px;
  - lg: 18px / 20px;
  - xl: 24px+.
- Tracking:
  - títulos: 0.04 a 0.12;
  - labels: 0.10 a 0.18;
  - corpo: 0.01 a 0.04.
- Line-height:
  - títulos: 1.1 a 1.25;
  - corpo: 1.45 a 1.6;
  - labels compactos: 1.1 a 1.3.

---

## 5. Sidebar e navegação

- Desktop: fixa à esquerda, largura 280px, separada por linha sutil.
- Estrutura:
  - marca no topo;
  - seções com labels pequenos em caixa alta;
  - itens com ícone + rótulo;
  - estado ativo com superfície + borda ativa.
- Comportamento:
  - hover suave;
  - transição curta;
  - foco visível e não intrusivo.
- Mobile:
  - drawer off-canvas;
  - botão hamburger no topo;
  - fechar por clique fora ou botão X;
  - backdrop com opacidade baixa.

---

## 6. Sistema visual dos 6 agentes

Defina visualmente cada agente por:
- cor própria;
- ícone;
- estado;
- nome e papel curto.

Agentes e papéis sugeridos:

1. Estratégia
   - função: decisão, planejamento e priorização;
   - cor sugerida: azul frio.
2. Criação
   - função: geração de conteúdo e formato;
   - cor sugerida: roxa.
3. Dados
   - função: números, análise e extração;
   - cor sugerida: ciano.
4. Execução
   - função: automação, deploy e fluxo operacional;
   - cor sugerida: verde.
5. Inteligência
   - função: IA, pesquisa e síntese;
   - cor sugerida: violeta.
6. Interface
   - função: UX, layout e comunicação visual;
   - cor sugerida: âmbar/neutro-dourado.

Representação:
- usar avatar pequeno com gradiente próprio ou superfície tingida;
- nome + função sempre legível;
- status online: ponto verde pulsante;
- status ocupado: ponto âmbar;
- status offline/pausa: ponto cinza;
- evitar muitos detalhes decorativos nos avatares.

---

## 7. Cards e blocos de informação

- Base: vidro escuro + borda sutil + sombra flutuante.
- Estrutura interna:
  - cabeçalho compacto;
  - conteúdo com espaçamento regular;
  - ações alinhadas à direita ou abaixo.
- Regra: priorizar escaneabilidade, não densidade cega.
- Estados visuais:
  - default;
  - hover;
  - active;
  - selected;
  - disabled.
- Agrupamento:
  - usar espaçamento maior entre grupos;
  - separar seções por linhas ou superfícies diferentes, nunca só cor.

---

## 8. Command Palette

- Gatilho:
  - desktop: Cmd+K / Ctrl+K;
  - mobile: botão flutuante.
- Comportamento:
  - overlay central;
  - busca instantânea;
  - ações priorizadas no topo;
  - agrupamento por categoria;
  - atalhos visíveis.
- Regra: command palette é a navegação mais rápida, não um menu extra.
- Não obrigar scroll para ações frequentes.

---

## 9. Motion System

- Objetivo: confirmar ação, guiar atenção, reduzir ruído.
- Princípio: motion ajuda, não distrai.
- Duração preferida: 150ms a 250ms para micro-interações.
- Easing: curvas suaves; evitar bounce exagerado.
- Animações permitidas:
  - hover states;
  - transições de foco;
  - abertura/fechamento de overlays;
  - pulso sutil em status ativos.
- Animações proibidas ou desencorajadas:
  - animação contínua longa sem propósito;
  - flash intenso;
  - movimento que compete com leitura.

---

## 10. Prompt mestre para reconstrução

> Reconstrua a interface do Hermes seguindo estritamente este Design DNA.
>
> Base visual: dark-first, glass surfaces, bordas finas, tipografia leve e hierárquica.
>
> Arquitetura:
> - topbar fixa de 64px;
> - sidebar fixa de 280px no desktop;
> - conteúdo principal fluido com grid de 12 colunas;
> - sem scroll lateral no desktop.
>
> Cores:
> - fundo preto profundo;
> - superfícies translúcidas com pouca opacidade;
> - accent azul frio e glow controlado;
> - status com verde, âmbar, vermelho e cinza.
>
> Tipografia:
> - Space Grotesk para títulos;
> - Inter para corpo;
> - pesos 300 a 600;
> - tracking maior em labels e menor em corpo.
>
> Navegação:
> - sidebar com ícone + rótulo, seções, estado ativo visível;
> - command palette com Cmd+K;
> - drawer no mobile.
>
> 6 agentes:
> - Estratégia: azul frio;
> - Criação: roxa;
> - Dados: ciano;
> - Execução: verde;
> - Inteligência: violeta;
> - Interface: âmbar/dourado neutro.
>
> Componentes:
> - cards com vidro, borda e sombra flutuante;
> - badges e pills compactos;
> - botões com transições curtas e hover discreto;
> - mensagens/turnos com avatar, papel, tempo e corpo.
>
> Motion:
> - micro-interações de 150ms a 250ms;
> - sem animação decorativa longa;
> - pulso apenas em status ativos.
>
> Regra final:
> - mantenha legibilidade, velocidade, acessibilidade e clareza acima de qualquer efeito visual.
>
> Entregue um HTML/CSS/JS standalone pronto para deploy em GitHub Pages.

---

## Diretrizes adicionais

- Nenhuma metáfora médica/neural obrigatória.
- Nomes devem ser diretos e operacionais.
- O design serve para decisão e execução, não para impressionar.
- Se um elemento visual não reduzir carga cognitiva, remova-o.
- Se um padrão não escalar para os projetos Hermes/EPQ, não adote.
