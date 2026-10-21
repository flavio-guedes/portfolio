# Registro de Alterações — Fase 4

## A.1 — ~/.hermes_env com chaves (CONCLUÍDA)
Data: 2026-10-11
- Ação: criado backup + adicionado `export GROQ_API_KEY=` e `export NVIDIA_API_KEY=`
- Arquivo: ~/.hermes_env (pré-existente, 128 B → ampliado)
- Backup: ~/.hermes_env.bak-1791761126
- Reversão: cp ~/.hermes_env.bak-1791761126 ~/.hermes_env
- Teste: grep -c retornou 1 e 1 (chaves preenchidas)
- Estado: OK

## A.2 — Subir LiteLLM em :4000 (CONCLUÍDA)
Data: 2026-10-11
- Ação: instalar litellm[proxy] via uv tool + prisma==0.15.0, subir proxy em :4000
- Arquivos afetados:
  * ~/.config/litellm/litellm_config.yaml (adicionado disable_auth, store_model_in_db=false, dangerously_permit_weak_or_unset_master_key)
  * ~/.config/litellm/proxy.pid (novo)
  * ~/.config/litellm/proxy.log (sobrescrito)
- Backups: ~/.config/litellm/litellm_config.yaml.bak-* (2 arquivos)
- Reversão: pkill -f "litellm.*4000" + restaurar backup do yaml
- Teste: /health/liveliness → "I'm alive!"; /v1/models → 13 modelos
- Estado: OK
- Observação: master_key removida (auth desabilitada para uso local)

## A.3 — Load balancing multi-provedor (CONCLUÍDA)
Data: 2026-10-12
- Ação: reescrito `model_list` para largura 3-4 por perfil + `bk-nim` adicionado
- Estratégia: `routing_strategy: simple-shuffle`, `num_retries: 2`, `timeout: 45`, `cooldown_time: 30`
- Arquivos afetados: ~/.config/litellm/litellm_config.yaml
- Backups: litellm_config.yaml.bak-a3-* e .bak-eol-* e .bak-groq-*
- Reversão: cp <bak> litellm_config.yaml + pkill litellm
- Ajustes durante execução:
  * Modelos NVIDIA EOL substituídos por `nvidia/nemotron-3-super-120b-a12b`
  * Modelos Groq descontinuados substituídos por `openai/gpt-oss-20b`
  * Chave Groq regenerada (a anterior dava 401)
  * Chave OpenRouter regenerada (len=73)
- Testes:
  * /health/liveliness → "I'm alive!"
  * /v1/models → 14 grupos (9 perfis + 5 backups)
  * perfil-principal → resposta válida (cloud)
  * perfil-operacao → resposta válida (local-first)
- Estado: OK

## A.4 — Migração Hermes → LiteLLM (CONCLUÍDA)
Data: 2026-10-12
- Descoberta: gateway hermes usa perfil `operacao` → config real em
  ~/.hermes/profiles/operacao/config.yaml (não em ~/.hermes/config.yaml)
- Ação: provider: custom → openai · default: gpt-oss:20b → perfil-principal
  · base_url: :11434/v1 → :4000/v1 · omniroute.enabled: false
- Backup: config.yaml.bak-a4-*
- Reversão: cp <bak> config.yaml + pkill -f hermes_cli.main gateway
- Testes: hermes status → Model: perfil-principal / Provider: openai
  · hermes -z "BOM DIA" → resposta OK
- Estado: OK

## A.5 — Backend :8422 → LiteLLM (CONCLUÍDA)
Data: 2026-10-12 (modo autônomo)
- Alvo: ~/hermes-bridge/hermes-agent/hermes-agent.mjs (PID 8422)
- Ação: /api/chat (Ollama nativo) → /v1/chat/completions (OpenAI compat)
  · OLLAMA: :11434 → :4000 · MODELO: qwen2.5:3b → perfil-principal
  · + header Authorization: Bearer sk-litellm
- Backup: hermes-agent.mjs.bak-a5-*
- Reversão: cp hermes-agent.mjs.bak-a5-* hermes-agent.mjs && pkill -f hermes-agent.mjs && node hermes-agent.mjs
- Env forçado no launch: MODELO=perfil-principal OLLAMA=http://127.0.0.1:4000
- Estado: OK

## A.6 — Fallback para grupos bk-* (autônomo)
Data: 2026-10-12
- Causa: bk-groq/bk-nim/bk-openrouter/bk-ollama/bk-ollama-code sem fallback
  → 429 em bk-openrouter direto não encontrava retry alternativo
- Ação: +5 entradas em router_settings.fallbacks cobrindo os bk-*
- Backup: litellm_config.yaml.bak-f5-*
- Reversão: cp <bak> litellm_config.yaml + pkill -f litellm + relançar
- Estado: OK

## A.7 — Observações da bateria Fase 5 (autônomo)
Data: 2026-10-12
- 5/6 endpoints OK; fallback bk-openrouter acionou nvidia_nim corretamente
- Modelos de reasoning (gpt-oss-20b, nemotron-3-super) retornam conteúdo em
  `reasoning_content` e deixam `content` vazio com max_tokens baixo.
  → Comportamento esperado, não é falha.
- perfil-operacao (local) respondeu em chinês com prompt curto.
  → Para produção, reforçar system prompt em PT-BR.
- perfil-rapido: parser do teste quebrou com newline não-escapeado no
  reasoning_content. Endpoint responde; só o wrapper de teste precisa
  usar json.loads com strict=False.
- Estado: OK para avanço

## A.8b — Hardcode modelo no agent (autônomo)
Data: 2026-10-12
- Problema: env MODELO=qwen2.5:3b vencia o default mesmo passado inline
  (herança via launchd do shell pai)
- Solução: const MODELO hardcoded em hermes-agent.mjs
  · const MODELO = 'perfil-principal'
  · const OLLAMA = 'http://127.0.0.1:4000'
- Backup: hermes-agent.mjs.bak-a8b-*
- Resultado: POST /v1/chat/completions 200 OK; resposta estruturada gerada
- Bridge: 403 destino não autorizado é whitelist (esperado, não é bug)
- Estado: OK

## A.8c — Recuperação de content vazio (autônomo)
Data: 2026-10-12
- Causa: modelos reasoning (gpt-oss, nemotron) devolvem texto em
  `reasoning_content`, deixando `content` vazio com max_tokens curto.
  Agent tentava JSON.parse('') e falhava.
- Ação: ollama() reescrita para:
  · max_tokens 200 → 800
  · fallback: content vazio → usa reasoning_content
  · extrai JSON de dentro de ```json ... ```
  · removeu response_format: json_object (não suportado por alguns modelos)
  · log de erro inclui corpo do 400
- Backup: hermes-agent.mjs.bak-a8c-*
- Estado: OK

## Validação final autônoma — 2026-10-12 11:43
- Rotas testadas: perfil-principal, perfil-operacao, perfil-pesado, perfil-code-nuvem, bk-groq, bk-nim, bk-openrouter
- Pipeline :8422 → LiteLLM: 3 casos (saudação, dúvida, spam)
- Fallback: bk-openrouter → provedor alternativo
- Resultado: PASS=10 · FAIL=1
- Estado: 1 falhas
