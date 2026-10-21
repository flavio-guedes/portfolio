# AI HUB — Componentes Base

Versão alinhada com o design system `0.3.0`.

## 1. Componentes

- AppShell
  - Container grid principal.
  - Áreas: header, nav, office, right, right2, detail.
- Header
  - Marca: COMMAND CENTER · AI HUB.
  - KPIs: Agents, Online, Working, Waiting, Projects, Tasks, Alerts.
- Sidebar / Nav
  - Seções: Operação, Talent Pool, Projetos, Estrutura.
  - Itens: AgentRow, ProjectRow.
- AgentRow
  - Avatar, nome, role, status-dot.
  - Estados: active, hover.
- MetricCard / KPI
  - Label + value.
  - Min-width e padding fixos.
- OfficePanel / OfficeZone
  - Área do escritório virtual.
  - Grid 12x8.
  - Stage com agent-spot + decor.
- AgentSprite
  - SVG com acento por cor do agente.
  - Monitor/desk quando monitor=true.
  - Badge de status.
- ActivityFeed / ActivityItem
  - Item com dot, time e msg.
  - Animação fadein.
- ProjectCard
  - Avatar, nome, meta, progresso.
  - Expansível com milestones.
- TaskCard
  - Avatar, título, status, progresso.
  - Expansível com milestones.
- Expandable / StepList
  - step com icon, title, meta e pill de status.
  - Estados: done, doing, todo.
- DetailPanel
  - Hero com avatar/nome/role.
  - Campos fixos + seção MILESTONES.
- StatusBadge
  - Pill com variante por status.
- EmptyState
  - Quando arrays estiverem vazios.
- LoadingState
  - Placeholder durante carregamento.
- ErrorState
  - Fallback quando fetch falhar.

## 2. Regras de uso

- Reutilizar padrões já existentes no `index.html`.
- Não duplicar estilos sem necessidade.
- Novos componentes devem respeitar `--radius`, `--border`, `--text-dim`.
- Animações só com `prefers-reduced-motion` respeitado quando necessário.
