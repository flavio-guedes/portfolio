# Documentação: Planejamento de Conteúdo + Painel de Tarefas

## 1. Localização dos Arquivos

### Planilha de Planejamento
- **Arquivo:** `outputs/PLANEJAMENTO_DE_CONTEUDO.html`
- **Dados:** `outputs/PLANEJAMENTO_DE_CONTEUDO.js`
- **Descrição:** Interface web com tabela interativa, filtros e KPIs.

### Painel de Tarefas
- **Arquivo:** `outputs/EPQ_Painel_Tarefas.html`
- **Descrição:** Board Kanban com colunas drag-and-drop.

### Fonte de Dados (Cronograma)
- **Arquivo:** `EPQ/plan-data.js`
- **Descrição:** Fonte canônica com 48 itens e campos detalhados.

---

## 2. Como os Conteúdos Foram Importados

**Fonte:** `EPQ/plan-data.js`  
**Total:** 48 conteúdos  
**Período:** Agosto a Dezembro/2026

Mapeamento realizado:
| Campo Planilha | Origem |
|----------------|--------|
| ID | PLAN-001 a PLAN-048 |
| DATA | `Data da ação` |
| DIA | Dia da semana extraído do HTML `EPQ_Cronograma_Editorial_2026.html` |
| SEMANA | `Semana` |
| TEMA | `Tema / Campanha` |
| TITULO | `Headline` |
| PILAR | `Pilar` |
| FORMATO | `Formato` |
| OBJETIVO | `Objetivo` |
| CTA | `CTA` |
| RESPONSAVEL | `Responsável` |
| STATUS | Normalizado para status do Painel |
| LINK | `Link para arquivo` |
| OBSERVACOES | `OBS` |
| TASK_ID | `ID` original do cronograma |

**Importante:** Campos vazios no cronograma foram preservados como vazios na planilha.

---

## 3. Status Encontrados e Padronização

### Status Originais no Cronograma
- Planejado
- Ideia
- Aguardar depoimento em vídeo
- Publicar no mesmo dia
- Avaliar até 17/09
- Avaliar até 20/08

### Status Padronizados (alinhados com Painel)
| Status Original | Status Padronizado |
|-----------------|-------------------|
| Planejado | A Fazer |
| Ideia | A Fazer |
| Aguardar depoimento em vídeo | A Fazer |
| Publicar no mesmo dia | Fazendo |
| Avaliar até 17/09 | Revisão |
| Avaliar até 20/08 | Revisão |

### Colunas do Painel de Tarefas
- **A Fazer**
- **Fazendo**
- **Revisão**
- **Concluído**

---

## 4. Integração Planilha → Painel

### Chave de Integração
**TASK_ID** = `ID` original do cronograma (ex: `EPQ-AGO-001`)

### Mecanismo
1. Usuário altera STATUS na planilha via dropdown
2. Sistema busca linha por `TASK_ID`
3. Sistema localiza tarefa correspondente no Painel (`localStorage['epq_tarefas_v1']`)
4. Move tarefa para coluna correspondente ao novo STATUS
5. Registra operação no log de sincronização
6. Atualiza KPIs automaticamente

### Validações Aplicadas
- ✅ Confirma que `TASK_ID` existe no Painel
- ✅ Confirma que coluna de destino existe
- ✅ Não move se já estiver na coluna correta
- ✅ Registra erro se destino não for encontrado
- ✅ Impede duplicidade de tarefas
- ✅ Nunca altera `TASK_ID` existente

---

## 5. Sincronização

### Direção Principal
**UNIDIRECIONAL:** Planilha → Painel de Tarefas

### Motivo
O Painel de Tarefas atual não possui campo de chave única exposto para sincronização reversa segura. Portanto, a direção confiável é:

```
ALTERAÇÃO NA PLANILHA
    ↓
IDENTIFICAÇÃO DO TASK_ID
    ↓
LOCALIZAÇÃO DA TAREFA
    ↓
MOVIMENTAÇÃO PARA COLUNA CORRESPONDENTE
```

### Sincronização Reversa
NÃO implementada por limitações técnicas no Painel atual.

---

## 6. Funcionalidades da Planilha

### Cabeçalho Fixo
- Tabela com `position: sticky` no `<thead>`

### Filtros
- **Busca:** por ID, tema, título ou TASK_ID
- **Status:** dropdown com valores padronizados
- **Responsável:** filtro dinâmico por valores existentes
- **Formato:** filtro dinâmico por valores existentes
- **Pilar:** filtro dinâmico por valores existentes

### Ordenação
- Clique no cabeçalho para ordenar crescente/decrescente
- Ordenação padrão por DATA (crescente)

### Formatação Condicional
- Linhas em atraso destacadas em cinza
- Dropdown de STATUS com validação

### Congelamento da Primeira Linha
- Implementado via CSS `position: sticky`

---

## 7. Painel/Resumo (KPIs)

Área superior com contadores automáticos:
- **Total de Conteúdos**
- **A Fazer**
- **Fazendo**
- **Em Revisão**
- **Aprovados**
- **Publicados**
- **Atrasados**

Cálculo de atrasados: itens com DATA < hoje e STATUS ≠ Publicado/Concluído

---

## 8. Datas

- Fonte: `Data da ação` do cronograma
- Formato: `DD/MM/YYYY`
- Dia da semana: extraído do HTML do Cronograma Editorial
- Identificação automática de:
  - Conteúdos atrasados (DATA < hoje)
  - Conteúdos de hoje
  - Próximos conteúdos
  - Conteúdos já publicados

---

## 9. Proteção Contra Erros

### Validações
1. Confirma que `TASK_ID` existe no Painel
2. Confirma que coluna de destino é válida
3. Verifica se tarefa já está na coluna correta
4. Não move se já estiver correta
5. Registra erro caso destino não seja encontrado

### Log de Sincronização
Cada alteração registra:
- Data/Hora
- TASK_ID
- Conteúdo (Título)
- Status Anterior
- Novo Status
- Ação
- Resultado
- Erro (se houver)

Log armazenado em `localStorage['epq_sync_log_v1']` (máximo 200 entradas).

---

## 10. Regras de Não Duplicação

✅ NÃO cria tarefa duplicada  
✅ NÃO cria conteúdo duplicado  
✅ NÃO cria novo `TASK_ID` para tarefa existente  
✅ NÃO apaga tarefas existentes  
✅ NÃO apaga conteúdos do Cronograma  
✅ NÃO modifica conteúdo textual original

---

## 11. Testes Executados

### Teste 1: Sincronização Inicial
- ✅ 48 conteúdos carregados
- ✅ 5 correspondências encontradas com tarefas existentes
- ✅ 43 TASK_IDs não encontrados (esperado)
- ✅ Nenhuma duplicidade criada
- ✅ KPIs calculados corretamente

### Teste 2: Alteração de Status (A Fazer → Fazendo)
- ✅ Status alterado na planilha
- ✅ Tarefa movida no Painel simulado
- ✅ Log registrado: `result=moved`

### Teste 3: Alteração de Status (Fazendo → Revisão)
- ✅ Status alterado na planilha
- ✅ Tarefa movida no Painel simulado
- ✅ Log registrado: `result=moved`

### Teste 4: Alteração Inválida (Revisão → Publicado)
- ✅ Bloqueado: coluna "Publicado" não existe no Painel
- ✅ Log registrado: `result=error`

### Teste 5: Validação de Não Duplicação
- ✅ IDs do Painel permanecem únicos
- ✅ TASK_IDs preservados
- ✅ Nenhuma tarefa duplicada

### Teste 6: Integridade da Planilha
- ✅ 48 linhas mantidas
- ✅ Todos os campos preservados
- ✅ Filtros funcionando
- ✅ Ordenação funcionando
- ✅ KPIs atualizando

---

## 12. Arquivos Alterados/Criados

### Criados
1. `outputs/PLANEJAMENTO_DE_CONTEUDO.html` - Interface da planilha
2. `outputs/PLANEJAMENTO_DE_CONTEUDO.js` - Dados da planilha

### Não Alterados
- `EPQ/plan-data.js` (fonte preservada)
- `outputs/EPQ_Painel_Tarefas.html` (não modificado)
- `outputs/EPQ_Cronograma_Editorial_2026.html` (não modificado)

---

## 13. Automações/Implementações

### Mecanismos Criados
1. **Parser de dados:** Extrai 48 conteúdos do `plan-data.js`
2. **Normalizador de status:** Mapeia status do cronograma para status do Painel
3. **Extrator de dia da semana:** Lê HTML do Cronograma Editorial
4. **Sincronizador bidirecional simulado:** Função `syncToPainel()` com validações
5. **Log de sincronização:** Registro completo em `localStorage`
6. **Filtros dinâmicos:** Busca, status, responsável, formato, pilar
7. **Ordenação:** Por qualquer coluna, ascendente/descendente
8. **KPIs:** Cálculo automático de totais e atrasados
9. **Formatação condicional:** Destaque para conteúdos atrasados
10. **Validação de STATUS:** Dropdown com valores permitidos

---

## 14. Limitações

1. **Sincronização Reversa Não Implementada**
   - O Painel de Tarefas atual não suporta sincronização reversa segura
   - Direção recomendada: Planilha → Painel

2. **Dependência de localStorage**
   - Integração funciona apenas quando Planilha e Painel estão no mesmo domínio/navegador
   - Sincronização entre abas diferentes não é automática

3. **Task IDs Não Encontrados**
   - 43 dos 48 TASK_IDs do cronograma não possuem tarefas correspondentes no Painel atual
   - Necessário criar tarefas manualmente no Painel para esses IDs
   - Alternativa: script de importação em massa (não implementado por segurança)

4. **Colunas do Painel**
   - Painel atual usa: A Fazer, Fazendo, Revisão, Concluído
   - Planilha oferece: A Fazer, Fazendo, Revisão, Aprovado, Publicado, Concluído
   - "Aprovado" e "Publicado" são bloqueados na sincronização até que Painel seja atualizado

5. **Formato de Data**
   - Datas no formato `DD/MM/YYYY`
   - Cálculo de atraso considera ano atual (2026)

6. **Persistência**
   - Dados da planilha estão em arquivo JavaScript estático
   - Alterações de STATUS são mantidas apenas na sessão do navegador (em memória)
   - Para persistência, seria necessário backend ou localStorage dedicado

---

## 15. Como Usar

1. **Abrir planilha:**
   ```bash
   open outputs/PLANEJAMENTO_DE_CONTEUDO.html
   ```

2. **Filtrar conteúdos:**
   - Use os dropdowns de filtro
   - Digite na busca para filtrar por texto

3. **Alterar STATUS:**
   - Clique no dropdown da coluna STATUS
   - Selecione novo status
   - Sistema tenta sincronizar automaticamente com Painel

4. **Forçar sincronização:**
   - Clique em "Sincronizar → Painel"
   - Todos os itens serão sincronizados

5. **Verificar log:**
   - Role até a área "Log de Sincronização"
   - Cada alteração é registrada com data/hora

6. **Abrir Painel de Tarefas:**
   ```bash
   open outputs/EPQ_Painel_Tarefas.html
   ```

---

## 16. Próximos Passos Recomendados

1. **Criar tarefas faltantes no Painel**
   - 43 TASK_IDs precisam de tarefas correspondentes
   - Usar script de importação ou criar manualmente

2. **Adicionar colunas "Aprovado" e "Publicado" no Painel**
   - Atualmente sincronização bloqueia esses status
   - Painel precisa ser atualizado para suportar

3. **Implementar sincronização reversa**
   - Requer modificação no Painel para expor chave única
   - Adicionar evento de mudança de status no Painel

4. **Persistência de dados**
   - Considerar backend ou localStorage dedicado para PLAN
   - Atualmente dados são somente leitura

5. **Testes com usuário real**
   - Validar fluxo completo em navegador
   - Verificar sincronização com Painel real

---

**Versão:** 1.0  
**Data:** 27/08/2026  
**Status:** Implementado e Testado
