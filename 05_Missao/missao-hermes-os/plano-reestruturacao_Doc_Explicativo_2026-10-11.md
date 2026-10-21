
## ADENDO — Decisão de 2026-10-11 (pós-cadastros)

### Provedores confirmados
- Ollama (local)      → primário, ilimitado
- Groq                → chave cadastrada em ~/.hermes_env
- NVIDIA NIM          → chave cadastrada em ~/.hermes_env
- OpenRouter          → chave já existente

### Provedores indisponíveis no momento
- Gemini   → cadastro não concluído. Marcado como DESATIVADO no config (comentado).
             Alternativas futuras: Together AI, Hyperbolic, Mistral.
- Cerebras → cadastro não concluído (exige cartão). Marcado como DESATIVADO.
             Alternativas futuras: Together AI, Hyperbolic.

### Impacto no plano
- A.3 (load balancing) será executado com 4 grupos em vez de 6.
- Nenhum critério de aceite é afetado: vazão combinada ~390 RPM + ilimitado local.
- Reativação de Gemini/Cerebras passa para FASE C (melhorias opcionais).

### Próximos candidatos (ordem de prioridade, todos sem cartão)
1. Together AI   — https://api.together.xyz  (variável TOGETHER_API_KEY)
2. Hyperbolic    — https://api.hyperbolic.xyz  (variável HYPERBOLIC_API_KEY)
3. Mistral       — https://console.mistral.ai  (variável MISTRAL_API_KEY)
