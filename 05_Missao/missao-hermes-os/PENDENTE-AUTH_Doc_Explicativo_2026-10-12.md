# Pendências que exigem autenticação manual do usuário

Verificar item por item ao final das 6-7h:

- [ ] WhatsApp (bridge :8421): sessão ainda válida? Se expirou,
      rodar fluxo de QR do hermes-bridge.
- [ ] Telegram: bot configurado (home 6928103984) — testar envio real.
- [ ] OpenRouter: chave nova (len=73) ativa — verificar créditos free tier
      (free_model_daily_requests: 50/dia).
- [ ] Groq: chave regenerada (gsk_tBsZ9JFX) — monitorar rate limits.
- [ ] NVIDIA NIM: chave ativa — sem restrição detectada.
- [ ] Google/Gemini: chave detectada — não usada no pipeline atual.
- [ ] OpenAI: chave detectada — não usada no pipeline atual.
- [ ] hermes gateway: token de sessão do CLI — se expirar, rodar
      `hermes login` ou `hermes auth`.

Nenhuma ação bloqueia o pipeline atual — todas são de sessão/expiração.
