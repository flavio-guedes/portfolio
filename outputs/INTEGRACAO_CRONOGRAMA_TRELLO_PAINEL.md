# Integração: Cronograma ↔ Trello ↔ Painel de Acompanhamento

## Diagnóstico
- **Cronograma fonte:** `EPQ/plan-data.json`
  - 48 conteúdos de agosto a dezembro/2026
  - Status encontrados: `Planejado`, `Ideia`, `Aguardar depoimento em vídeo`, `Publicar no mesmo dia`, `Avaliar até 17/09`, `Avaliar até 20/08`
- **Painel de Acompanhamento:** `outputs/EPQ_Painel_Conteudo_v2.html`
  - Campos: data, pilar, formato, responsável, status, link, headline, tema
- **Trello:** sem integração prévia no repositório
- **Painel de Tarefas:** NÃO integrado (mantido independente)

## Resultado da implementação
1. Estruturei o mapeamento oficial `CONTENT_ID -> TRELLO_CARD_ID`.
2. Criei a integração `Cronograma -> Painel de Acompanhamento`.
3. Deixei preparado o ponto de conexão com Trello; para concluir a parte externa, falta informar:
   - `TRELLO_API_KEY`
   - `TRELLO_TOKEN`
   - `TRELLO_BOARD_ID`

Depois disso, eu plugo a criação/vinculação real dos cards sem alterar o Painel de Tarefas.
