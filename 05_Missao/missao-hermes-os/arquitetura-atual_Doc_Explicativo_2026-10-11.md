# Arquitetura Atual — Fase 2
Legenda: [C]=CONFIRMADA · [P]=PARCIAL · [A]=AUSENTE · [D]=DESCONHECIDA

## Fluxo comprovado
Intenção
  ├─► Hermes CLI ──► Ollama :11434/v1 (gpt-oss:20b)                        [C]
  │                └─► OmniRoute :20128 (config ativa, serviço parado)     [P]
  │                └─► Anthropic (env presente, uso não observado)         [P]
  │
  ├─► Hermes OS backend :8420 ──► OpenRouter direto (perfis.json)          [C]
  │                                └─ WhatsApp Baileys (flapping)          [C c/ falha]
  │                                └─ IMAP 3min                            [C]
  │                                └─ Scheduler IA 30min                   [C]
  │
  └─► Bridge / Agentes:
        hermes-bridge.mjs   :8421, :8787                                   [C]
        hermes-agent.mjs    :8422                                          [C]
        epq-control.js      :7687                                          [C]
        openclaw gateway    :18789                                         [C]
        whatsapp bridge.js  :3000                                          [P]

## Camada de roteamento projetada (ainda não ativa)
LiteLLM :4000
  perfis cloud-first: principal, projetos, epq, pesado, code-nuvem
  perfis local-first: operacao, rapido, lucas, code-local
  fallback cloud: OpenRouter → Groq → Gemini → Ollama
  fallback local: Ollama → Groq
Estado: config válida, serviço parado. Nenhum cliente configurado para :4000.  [A]

## Painel
Painel_Hermes_V10.html (hermes-work/reference)
  Consumidor provável: backend :8420                                      [P]
  Backups datados: ~30 (indica iteração intensa)                          [C]

## Convergências
- 8 perfis idênticos entre CLI, backend e LiteLLM (vocabulário alinhado).

## Divergências comprovadas
1. Roteamento: nenhum cliente usa LiteLLM — cada um fala direto com backend final.
2. Política local-first (operacao/rapido/lucas) do LiteLLM é ignorada pelo backend
   (perfis.json aponta para modelos cloud).
3. OmniRoute aparece no config do Hermes como ativo, mas endpoint :20128 está morto.
4. Duplicação de skills em múltiplas raízes (~/.hermes, ~/HermesWorkspace,
   ~/Desktop/HermesWorkspace, ~/hermes-bridge) — fonte de verdade indefinida.
5. Dois "Hermes OS" candidatos: hermes-work/hermes-os (backend) e HermesWorkspace (cwd).

## Riscos
- Falha em cascata do WhatsApp Baileys (loop de reconexão) sem alarme visível.
- Custos: fallback cloud acionado sem política LiteLLM → sem controle de custo.
- Exposição de segredos: backend.log guarda material Signal; configs guardam API keys.
- Duplicação de skills pode causar seleção inconsistente.
