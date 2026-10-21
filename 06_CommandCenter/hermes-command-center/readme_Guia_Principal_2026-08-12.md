# Hermes Command Center

Observabilidade em tempo real para a arquitetura Hermes.

Status: MOCK / DISCONNECTED.
Esta interface simula execução; integração real será adicionada posteriormente.

## Stack

- Next.js
- React + TypeScript
- Tailwind CSS
- Framer Motion
- React Flow
- Zustand-style store local
- Lucide icons

## Rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Estrutura

```
src/app
src/components/{layout,graph,mission,agents,event-stream,skills,tools,approval,ui}
src/lib
src/hooks
src/types
src/mock
public
```

## Integração futura

Criar adaptadores:

- `MockEventSource`
- `WebSocketEventSource`
- `SSEEventSource`
- `APIEventSource`

O modelo de eventos já está definido em `src/types/events.ts`.
