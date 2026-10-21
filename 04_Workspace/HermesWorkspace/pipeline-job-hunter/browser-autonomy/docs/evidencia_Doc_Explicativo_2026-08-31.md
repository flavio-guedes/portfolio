# Browser Autonomy Framework — Evidência

Toda execução relevativa registra em `browser-autonomy/evidence/`:

- `runs.json` — `run_id`, `task`, `platform`, `executor`, `state`, timestamps, `error`, `next_action`, `evidence`
- `executions.json` — detalhamento do executor por `run_id`

O framework não considera `SUBMITTED` sem evidência de confirmação.
