# Hermes Guide

Extensão do Chrome/Edge que funciona como uma camada inteligente de aprendizagem contextual sobre o Hermes.

## Estrutura

- `src/content` — content script
- `src/background` — service worker
- `src/popup` — popup da extensão
- `src/components` — componentes reutilizáveis
- `src/knowledge` — base de conhecimento
- `src/context` — detecção de contexto
- `src/styles` — estilos

## Scripts

```bash
npm install
npm run dev
```

## Instalação manual

1. Gere o build com `npm run build`
2. Abra `chrome://extensions`
3. Habilite Developer mode
4. Load unpacked na pasta `dist`
