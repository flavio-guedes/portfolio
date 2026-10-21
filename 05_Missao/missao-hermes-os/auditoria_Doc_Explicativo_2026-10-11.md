# Auditoria — Fase 1 (somente leitura)
Data: 2026-10-11 · host: MacBook-Pro-de-Mac.local · user: mac

## Diretório de trabalho identificado
- Pasta de missão (entregáveis): ~/missao-hermes-os/
- Runtime do agente Hermes:        ~/.hermes/hermes-agent/   (Python, venv)
- Workspace do agente:             /Users/mac/HermesWorkspace   (config.yaml: terminal.cwd)
- Hermes OS (painel+backend):      ~/hermes-work/hermes-os/
- Bridge + agente Node:            ~/hermes-bridge/
- Painel ativo:                    ~/hermes-work/reference/Painel_Hermes_V10.html

## Serviços ativos (CONFIRMADO)
| PID | Processo | Porta | Papel |
|-----|----------|-------|-------|
| 516 | hermes_cli.main gateway | — | Hermes Gateway |
| 1121 | ollama serve | 11434 | daemon Ollama |
| 6383 | llama-server gpt-oss:20b | (efêmera) | worker Ollama |
| 503 | openclaw gateway | 18789 | OpenClaw |
| 511 | epq-control.js | 7687 | EPQ Control |
| 587 | hermes-bridge.mjs | 8421, 8787 | Hermes Bridge |
| 522 | hermes-agent.mjs | 8422 | Agente Node |
| 6381 | bridge.js whatsapp | 3000 | WhatsApp bridge |
| 505 | whatsapp-supervisor.sh | — | supervisor WhatsApp |

## Serviços instalados, NÃO em execução
- LiteLLM      (config em ~/.config/litellm/litellm_config.yaml, sem processo, sem :4000)
- OmniRoute    (binário em ~/.local/bin/omniroute, sem processo, sem :20128)
- Hermes OS backend (hermes-work/hermes-os/backend — sem processo, mas com log recente e :8420 configurado em .env)
- Atlas e Mercúrio: NÃO são serviços — são personas/agentes mapeados em perfis.

## Caminhos reais de inferência (CONFIRMADO)
1) Hermes CLI      → Ollama :11434/v1 (modelo default gpt-oss:20b)
2) Hermes CLI      → OmniRoute :20128 (config, endpoint morto)         [PARCIAL]
3) Hermes OS backend → OpenRouter direto (perfis.json, sem LiteLLM)    [CONFIRMADA]
4) LiteLLM         → projetado com fallback cloud→cloud→cloud→ollama   [AUSENTE runtime]

## Modelos disponíveis no Ollama (12)
gpt-oss:20b (tools, thinking) · qwen3:4b / 1.7b / 0.6b / qwen3-fast (tools, thinking)
qwen2.5:7b / 3b / 0.5b · deepseek-coder:6.7b · tinyllama · nomic-embed-text

## Perfis Hermes (8) — alinhados entre CLI, backend e LiteLLM
principal · projetos · epq · pesado · code · operacao · rapido · lucas

## Configs mascaradas — observações
- ~/.hermes/config.yaml: provider=ollama-cloud, default=gpt-oss:20b, base_url=localhost:11434
  omniroute.enabled=true (endpoint :20128 — morto); anthropic.enabled=true.
- ~/.config/litellm/litellm_config.yaml: 9 perfis + 4 backups, fallback em cascata.
- ~/hermes-work/hermes-os/backend/perfis.json: 8 perfis com modelos OpenRouter diretos.
- Diverge de LiteLLM em: operacao, rapido, lucas (backend usa cloud; LiteLLM especifica local).

## Segurança
- backend.log contém chaves de sessão WhatsApp/Signal — NÃO incluir em relatórios.
- .env do backend define PORT, HERMES_TOKEN, CORS_ORIGIN (valores ocultos).
- Segredos presentes em config.yaml, litellm_config.yaml, perfis.json — nunca copiar.

## Falhas ativas observadas
- WhatsApp Baileys em loop "reconectando em 3s..." (flapping contínuo).
- OmniRoute: referenciado como vivo no config do Hermes, mas endpoint morto.
- LiteLLM: arquitetura-alvo definida, mas nenhum cliente aponta para ele.

## Lacunas (DESCONHECIDA)
- Fonte de verdade oficial do "Hermes OS": backend (hermes-work) vs workspace (HermesWorkspace).
- Quem dispara o backend :8420 hoje (nenhum processo ativo na auditoria).
- Se OmniRoute deve ser reativado ou removido do config.
- Endpoint de health do WhatsApp bridge (:3000 responde sem /health).
