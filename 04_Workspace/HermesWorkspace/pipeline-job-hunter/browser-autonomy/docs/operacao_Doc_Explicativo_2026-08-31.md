# Browser Autonomy Framework — Operação

- Use `BrowserOrchestrator.execute()` como ponto único.
- `TaskContext` deve conter pelo menos `platform`, `url`, `known_flow`, `api_available`, `dynamic_page`, `auth_blocked`.
- Quando a evidência apontar `HUMAN_REQUIRED`, siga o protocolo documentado em `core/human_action.py`.
- Ajuste um playbook em `platforms/` antes de automatizar fluxos sensíveis.
