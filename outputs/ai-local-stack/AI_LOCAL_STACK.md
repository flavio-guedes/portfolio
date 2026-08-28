========================================
AI LOCAL STACK — RELATÓRIO
========================================

SISTEMA
OS: macOS 12.7.6
CPU: Intel Core i5 dual-core 2.9GHz
RAM: 16GB DDR3
GPU: Intel Iris Graphics 6100 shared 1.5GB
ARMAZENAMENTO: 500GB SSD, ~293GB livre

OLLAMA
Status: OK
Versão: 0.32.15
Serviço: ativo em localhost:11434
Modelos instalados: qwen2.5:0.5b, qwen2.5:3b
Teste textual: OK

MODELOS LOCAIS
- qwen2.5:0.5b — leve, baixo uso de RAM
- qwen2.5:3b — médio, qualidade razoável para CPU
Função geral/código/reasoning: OK

WHISPER
Status: OK
Implementação: faster-whisper tiny, CPU
Teste: OK com áudio local em português
Saída: transcrição funcional

COMFYUI
Status: BLOQUEADO
Motivo: hardware Intel Iris 6100 + CPU sem GPU discreta; stack de imagem local muito pesado para este Mac sem benefício confiável.

MODELOS DE IMAGEM LOCAIS
Status: BLOQUEADO
Motivo: mesmo de ComfyUI; FLUX/ modelos similares não são viáveis aqui.

N8N
Status: OK
Versão: 2.35.7
URL: http://127.0.0.1:5678
Health: 200 OK

FFMPEG
Status: OK
Canal: ffmpeg-static via npm oficial
Path: /Users/mac/.local/lib/node_modules/ffmpeg-static/ffmpeg
Versão: 6.1.1-tessus
Observação: brew bloqueado para este macOS por política de suporte; alternativa mantida.

PYTHON AI ENV
Status: OK
Caminho: /Users/mac/HermesWorkspace/outputs/ai-local-stack/ai-local-env
Pacotes: requests, httpx, pillow, huggingface_hub, faster-whisper, python-dotenv

AI LOCAL ROUTER
Status: OK
Arquivo: scripts/ai_local_router.py
Rotas: text/code/reasoning → Ollama; transcription → Whisper; image bloqueado; n8n bloqueado por hardware/necessidade
Verificação: rota text ok

HERMES INTEGRATION
Status: OK
Skill: local-ai-stack registrada em ~/.hermes/skills/autonomous-ai-agents/local-ai-stack/

========================================
FERRAMENTAS FUNCIONANDO
========================================
- Ollama local
- Modelos leves locais
- Whisper local
- Python AI toolkit
- Router local
- n8n local
- FFmpeg via npm static
- Skill Hermes integrada

========================================
FERRAMENTAS NÃO INSTALADAS
========================================
- ComfyUI: incompatível com hardware atual
- Modelos locais de imagem pesados: incompatíveis com hardware atual

========================================
BLOQUEIOS
========================================
- GPU integrada Intel insuficiente para geração local de imagens pesadas
- Homebrew bloqueado para ffmpeg no macOS 12; solução alternativa aplicada

========================================
PRÓXIMOS PASSOS
========================================
- Usar o stack para tarefas de texto, áudio e automação
- Se quiser imagem local no futuro, usar máquina com GPU discreta
