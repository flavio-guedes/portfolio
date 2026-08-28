# AI LOCAL COMMANDS

- ollama serve
- curl http://localhost:11434/api/tags
- curl -X POST http://localhost:11434/api/generate -d '{"model":"qwen2.5:3b","prompt":"Olá","stream":false}'
- bash /Users/mac/HermesWorkspace/outputs/ai-local-stack/scripts/health_check.sh
- /Users/mac/HermesWorkspace/outputs/ai-local-stack/ai-local-env/bin/python3 -c "from faster_whisper import WhisperModel; print('whisper ok')"
- /Users/mac/HermesWorkspace/outputs/ai-local-stack/ai-local-env/bin/python3 /Users/mac/HermesWorkspace/outputs/ai-local-stack/scripts/ai_local_router.py
