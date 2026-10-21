# IMAGE GENERATION — Hermes

## STATUS

- `imagegen.py` — available
- `image_generator.py` — available
- Provider: `pollinations` working without keys
- Google Drive upload — authenticated and tested

## ARCHITECTURE

Hermes -> `tools/image_generator.py` -> `tools/imagegen.py` -> Provider API -> local file -> optional Drive upload

## PROVIDERS

1. `openai` requires `OPENAI_API_KEY`
2. `fal` requires `FAL_KEY`
3. `pollinations` public fallback, no key required

## USAGE

```bash
python3 /Users/mac/HermesWorkspace/tools/image_generator.py \
  --prompt "..." \
  --size 1024x1024 \
  --aspect 1:1 \
  --provider pollinations \
  --output_dir /Users/mac/HermesWorkspace/outputs/images/generated-images/tests
```

## HEALTHCHECK

```bash
python3 /Users/mac/HermesWorkspace/tools/image_generator.py \
  --prompt "Clean abstract editorial image representing artificial intelligence and creative work. No text, no logos, premium visual style." \
  --size 1024x1024 --aspect 1:1 --output_dir /Users/mac/HermesWorkspace/outputs/images/generated-images/tests
```

## GOOGLE DRIVE

Upload via:

```bash
python3 /Users/mac/.hermes/skills/productivity/google-workspace/scripts/google_api.py drive upload <file> --parent <folder_id>
```

## STORAGE

Local outputs: `/Users/mac/HermesWorkspace/outputs/images/generated-images/<YYYY>/<MM>/<subfolder>`
