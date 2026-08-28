# Magnific AI — Usage Reference

Install the skill under the Hermes skills directory. The Hermes runtime discovers `SKILL.md` automatically.

## Environment

Set the minimum config:

```bash
export MAGNIFIC_API_KEY="..."
export MAGNIFIC_OUTPUT_DIR="outputs/images/magnific"
```

Optional overrides:

```bash
export MAGNIFIC_BASE_URL="https://api.magnific.com"
export MAGNIFIC_DEFAULT_MODEL="realism"
export MAGNIFIC_DEFAULT_RESOLUTION="2k"
export MAGNIFIC_DEFAULT_ASPECT_RATIO="square_1_1"
export MAGNIFIC_POLL_INTERVAL_SECONDS="2"
export MAGNIFIC_MAX_POLL_ATTEMPTS="120"
export MAGNIFIC_WEBHOOK_SECRET="..."
export MAGNIFIC_COST_CAP_EUR="1.5"
```

## Python Usage

```python
from pathlib import Path
import sys
sys.path.insert(0, str(Path.home() / '.hermes' / 'skills' / 'magnific_ai' / 'scripts'))
from magnific_client import MagnificClient, MagnificConfig

config = MagnificConfig(
    api_key="...",
    output_dir="outputs/images/magnific",
    max_poll_attempts=60,
)
client = MagnificClient(config)

# Mystic text-to-image
task = client.submit_mystic(
    prompt="Clean editorial photo representing AI-assisted creative direction. Premium style, no text.",
    aspect_ratio="widescreen_16_9",
    resolution="2k",
)
print(task.task_id, task.status)

# Optional: poll until completion
task = client.wait_for_task(task.task_id, kind="mystic")
print(task.generated)

# Download result
path = client.download_result(task.generated[0])
print(path)

# Upscale existing image
task = client.submit_upscale(
    image="https://example.com/asset.png",
    scale_factor=2,
    flavor="photo",
)
print(task.task_id)
```

## Webhook Receiver Sketch

```python
from flask import Flask, request, jsonify
from pathlib import Path
import sys
sys.path.insert(0, str(Path.home() / '.hermes' / 'skills' / 'magnific_ai' / 'scripts'))
from magnific_client import MagnificClient

app = Flask(__name__)
client = MagnificClient()

@app.route("/webhooks/magnific", methods=["POST"])
def magnific_webhook():
    body = request.get_data()
    headers = dict(request.headers)
    if not MagnificClient.validate_webhook(headers, body, client.config.webhook_secret):
        return jsonify({"error": "invalid signature"}), 401
    event = request.get_json()
    print(event)
    return jsonify({"ok": True}), 200
```

## Notes

- Do not log secrets or full prompt history when operating in shared environments.
- Prefer `webhook_url` for long-running tasks.
- Retry 503s with backoff; respect 429s.
