---
name: magnific_ai
description: "Use when integrating Hermes with official Magnific visual APIs for image generation, upscaling, enhancement, and asset workflows. Handles async task submission, polling, webhooks, downloads, cost metadata, and retries."
version: 0.1.0
author: Hermes Agent
metadata:
  hermes:
    tags: [creative, design, image-generation, upscale, enhancement, assets, api]
---

# HERMES-MAGNIFIC-AI

Integração oficial com o Magnific API para capacidades visuais no Hermes, baseada exclusivamente em endpoints documentados e autenticação por API key.

## REGRA PRINCIPAL

NÃO usar scraping, browser automation para login, bypass de autenticação, coleta de paywall ou qualquer meio que contorne os mecanismos oficiais do Magnific.

## FONTES OFICIAIS

- Documentação: https://docs.magnific.com/llms.txt
- Referência Mystic: https://docs.magnific.com/api-reference/mystic/post-mystic
- Referência Upscaler: https://docs.magnific.com/api-reference/image-upscaler-precision-v2/overview
- Webhooks: https://docs.magnific.com/webhooks
- API base: https://api.magnific.com

## CONFIGURAÇÃO

Variáveis de ambiente obrigatórias/recomendadas:

- `MAGNIFIC_API_KEY`: chave da equipe/tenant, obtida no dashboard do Magnific.
- `MAGNIFIC_BASE_URL`: opcional, default `https://api.magnific.com`
- `MAGNIFIC_TIMEOUT_SECONDS`: timeout por request, default `60`
- `MAGNIFIC_MAX_RETRIES`: número máximo de tentativas, default `3`
- `MAGNIFIC_POLL_INTERVAL_SECONDS`: intervalo entre status checks, default `2`
- `MAGNIFIC_MAX_POLL_ATTEMPTS`: limite de polling antes de falha operacional, default `120`
- `MAGNIFIC_WEBHOOK_SECRET`: segredo para validação de webhooks HMAC-SHA256.
- `MAGNIFIC_OUTPUT_DIR`: diretório local para downloads, default `outputs/images/magnific`
- `MAGNIFIC_COST_CAP_EUR`: teto estimado por operação em EUR, opcional.
- `MAGNIFIC_DEFAULT_MODEL`: default do modelo Mystic quando não informado, default `realism`
- `MAGNIFIC_DEFAULT_RESOLUTION`: default `2k`
- `MAGNIFIC_DEFAULT_ASPECT_RATIO`: default `square_1_1`
- `MAGNIFIC_DEFAULT_ENGINE`: default `automatic`

Segurança:

- Nunca gravar `MAGNIFIC_API_KEY` no código, Git, arquivos públicos ou em respostas.
- Se a chave vazar, revogar no dashboard antes de reutilizar.

## QUANDO USAR MAGNIFIC

- geração de imagem via Mystic;
- transformação guiada por estrutura/estilo via Mystic;
- upscale/precisão via Upscaler Precision V2;
- melhoria controlada de detalhes/grain/sharpen;
- preparação de assets visuais para campanhas;
- tratamento de imagens produzidas por outros agentes.

## QUANDO NÃO USAR MAGNIFIC

- tarefas exclusivamente textuais;
- imagens que já atendem ao HIIF sem ganho mensurável;
- operações sem necessidade de processamento visual;
- situações que exijam bypass de autenticação/limitação do serviço.

## ARQUITETURA CONCEITUAL

```text
HERMES MASTER
     ↓
Creative / Design Agent
     ↓
magnific_ai skill
     ↓
Magnific API REST
     ↓
Asset final em CDN + workspace local
```

Fluxo recomendado:

1. Submeter operação async.
2. Receber `task_id`.
3. Consultar status até `COMPLETED` ou `FAILED`.
4. Baixar asset para `MAGNIFIC_OUTPUT_DIR`.
5. Registrar observabilidade.
6. Retornar caminho/metadados ao agente solicitante.

## INTERFACE

Script principal: `scripts/magnific_client.py`

Objetivo: expor operações reais alinhadas à API oficial:

- `submit_mystic(...)`
- `get_task(task_id, kind="mystic")`
- `submit_upscale(...)`
- `download_result(url, dest_dir)`
- `validate_webhook(headers, body, secret)`

Essa camada NÃO inventa endpoints; qualquer novo modelo/caminho deve ser verificado contra `references/contract.md` antes do uso.

## ERROS E LIMITES

Erros comuns:

- `401`: chave ausente ou inválida.
- `429`: rate limit por tier.
- `400`: parâmetro inválido, combinação incompatível ou payload malformado.
- `503`: indisponibilidade temporária; usar retry com backoff.
- `FAILED`: task concluída com erro; usar `status`/`error_message` quando disponível.

Limites operacionais:

- Free: até 10 requests/dia.
- Tier 1: até 125 requests/dia.
- Mystic pode ignorar LoRAs em configurações específicas; isso é comportamento documentado.

## OBSERVABILIDADE

Registrar sempre que possível:

- timestamp ISO8601
- agente solicitante, quando chamado por outro agente
- operação/modelo/kind
- parâmetros relevantes, sem dados sensíveis
- status final
- duração em ms
- erro, se houver
- custo estimado, quando disponível
- caminho final do asset salvo

## SEGURANÇA E PRIVACIDADE

- Não logar `MAGNIFIC_API_KEY`, segredos de webhook ou conteúdo sensível.
- Validar webhooks apenas quando o destino for confiável e controlado pelo usuário.
- Preferir URLs públicas temporárias apenas quando inevitável; após download, remover referência sensível quando possível.

## TESTES

Testes mínimos esperados após implementação:

1. autenticação/config ausente → falha controlada
2. operação simples com mock de resposta
3. retorno com `task_id` e metadados coerentes
4. download/storage local
5. tratamento de erro/timeout/retry
6. segunda operação sequencial
7. discovery da skill pelo Hermes

## REFERÊNCIAS

- `references/contract.md`
- `references/usage.md`
- `references/testing.md`
