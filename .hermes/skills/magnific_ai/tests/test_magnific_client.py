import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest


SCRIPT_DIR = Path(__file__).resolve().parent.parent / "scripts"
TEST_OUTPUT_DIR = Path("/tmp/magnific_test_output")


def load_client_module():
    import importlib.util
    import sys
    spec = importlib.util.spec_from_file_location("magnific_client", SCRIPT_DIR / "magnific_client.py")
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


magnific_client = load_client_module()
MagnificClient = magnific_client.MagnificClient
MagnificConfig = magnific_client.MagnificConfig
MagnificTaskFailedError = magnific_client.MagnificTaskFailedError
validate_webhook = magnific_client.validate_webhook


def build_client(**overrides):
    defaults = {
        "api_key": "test-key",
        "base_url": "https://api.magnific.com",
        "timeout": 5,
        "max_retries": 2,
        "poll_interval": 0.01,
        "max_poll_attempts": 3,
        "output_dir": str(TEST_OUTPUT_DIR),
    }
    defaults.update(overrides)
    return MagnificClient(MagnificConfig(**defaults))


def test_missing_api_key_raises():
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(Exception):
            MagnificConfig.from_env()


def test_submit_mystic_returns_task():
    client = build_client()
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {
        "data": {"task_id": "task-1", "status": "CREATED", "generated": []}
    }
    with patch.object(client.session, "request", return_value=response) as mocked:
        result = client.submit_mystic(prompt="A clean editorial image of AI-assisted creative work.")
    assert result.task_id == "task-1"
    assert result.status == "CREATED"
    body = mocked.call_args.kwargs.get("json") or mocked.call_args[1].get("json")
    assert body["model"] == "realism"
    assert body["resolution"] == "2k"


def test_submit_upscale_returns_task():
    client = build_client()
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {
        "data": {"task_id": "task-2", "status": "CREATED", "generated": []}
    }
    with patch.object(client.session, "request", return_value=response) as mocked:
        result = client.submit_upscale(image="https://example.com/asset.png", scale_factor=2, flavor="photo")
    assert result.task_id == "task-2"
    body = mocked.call_args.kwargs.get("json") or mocked.call_args[1].get("json")
    assert body["scale_factor"] == 2
    assert body["flavor"] == "photo"


def test_get_task_completed():
    client = build_client()
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {
        "data": {
            "task_id": "task-3",
            "status": "COMPLETED",
            "generated": ["https://cdn.example.com/image.png"],
        }
    }
    with patch.object(client.session, "request", return_value=response):
        task = client.get_task("task-3", kind="mystic")
    assert task.status == "COMPLETED"
    assert task.generated == ["https://cdn.example.com/image.png"]


def test_wait_for_completed_avoids_polling():
    client = build_client()
    task = MagicMock()
    task.status = "COMPLETED"
    task.generated = ["https://cdn.example.com/image.png"]
    with patch.object(client, "get_task", return_value=task) as get_task:
        result = client.wait_for_task("task-4", kind="mystic")
    assert result.status == "COMPLETED"
    get_task.assert_called_once_with("task-4", kind="mystic")


def test_wait_for_failed_raises():
    client = build_client()
    task = MagicMock()
    task.status = "FAILED"
    task.raw = {"message": "Model unavailable"}
    with patch.object(client, "get_task", return_value=task):
        with pytest.raises(MagnificTaskFailedError):
            client.wait_for_task("task-5", kind="mystic")


def test_download_result_writes_file():
    client = build_client()
    response = MagicMock()
    response.status_code = 200
    response.headers.get.return_value = "image/png"
    response.iter_content.return_value = [b"pngbytes"]
    response.raise_for_status = MagicMock()
    response.__enter__ = MagicMock(return_value=response)
    response.__exit__ = MagicMock(return_value=False)
    with patch.object(magnific_client.requests, "get", return_value=response):
        path = client.download_result("https://cdn.example.com/image.png")
    assert path.exists()
    assert path.read_bytes() == b"pngbytes"


def test_auth_error_mapping():
    client = build_client()
    response = MagicMock()
    response.status_code = 401
    response.text = "Invalid API key"
    with patch.object(client.session, "request", return_value=response):
        with pytest.raises(Exception) as exc:
            client.submit_mystic(prompt="test")
    assert "API key" in str(exc.value)


def test_rate_limit_error_mapping():
    client = build_client()
    response = MagicMock()
    response.status_code = 429
    response.text = "Rate limit exceeded"
    with patch.object(client.session, "request", return_value=response):
        with pytest.raises(Exception) as exc:
            client.submit_mystic(prompt="test")
    assert "Rate limit" in str(exc.value)


def test_webhook_validation():
    import base64, hmac, hashlib
    secret = "shared-secret"
    body = b'{"event":"finished"}'
    headers = {
        "webhook-id": "id-1",
        "webhook-timestamp": "123",
        "webhook-signature": "",
    }
    assert not validate_webhook(headers, body, None)
    assert not validate_webhook({}, body, secret)
    expected = base64.b64encode(
        hmac.new(secret.encode(), f"id-1.123.{body.decode()}".encode(), hashlib.sha256).digest()
    ).decode()
    headers["webhook-signature"] = expected
    assert validate_webhook(headers, body, secret)


def test_invalid_task_kind_raises():
    client = build_client()
    with pytest.raises(ValueError):
        client.get_task("task-1", kind="video")
