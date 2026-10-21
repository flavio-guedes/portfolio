# Browser Autonomy Framework

Camada transversal do Hermes / Job Hunter para executar ações no navegador com roteamento determinístico e evidência.

## Estrutura

- `core/` — orquestrador, router, state machine, evidência, protocolo humano
- `platforms/` — playbooks por plataforma
- `docs/` — operação e diagnóstico
- `tests/` — sanidade rápida do framework

## Uso básico

```python
from browser_autonomy.core.orchestrator import BrowserOrchestrator
from browser_autonomy.core.router import TaskContext

orchestrator = BrowserOrchestrator(evidence_dir="browser-autonomy/evidence")

result = orchestrator.execute(
    task="submit_proposal",
    platform="upwork",
    context=TaskContext(
        platform="upwork",
        known_flow=True,
        url="https://www.upwork.com/...",
    ),
)
print(result.state, result.executor, result.evidence)
```

## Próximas fases

- adaptadores concretos API/Playwright/Stagehand/BrowserUse
- conectores por plataforma
- métricas e learning
