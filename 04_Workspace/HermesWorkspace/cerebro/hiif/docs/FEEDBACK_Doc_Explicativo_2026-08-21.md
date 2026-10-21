# HIIF — Processamento de Feedback

## Objetivo
Integrar referências e feedback do usuário ao framework de forma estruturada.

## Passos
1. Receber feedback via template `feedback-template.md`
2. Classificar cada item usando critérios de curadoria
3. Atualizar `references.json`, `patterns.json` ou docs conforme aplicável
4. Documentar mudanças em `analysis/feedback-YYYY-MM-DD.md`
5. Commitar alterações

## Regras
- Sempre classificar: Novo padrão | Evolução | Nova tecnologia | Nova técnica | Nova referência | Tendência temporária | Insight experimental
- Se não melhora o HIIF, descarta
- Manter rastro de todas as alterações em analysis/
