#!/usr/bin/env python3
"""
magnific_client.py

Cliente oficial para integração Hermes <-> Magnific API.
Não inventa endpoints: usa apenas contratos documentados em:
https://docs.magnific.com/llms.txt
https://docs.magnific.com/api-reference/mystic/post-mystic.md
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import requests


class MagnificConfigError(Exception):
    """Configuração ausente ou inválida."""


class MagnificAuthError(Exception):
    """Falha de autenticação."""


class MagnificRateLimitError(Exception):
    """Rate limit excedido."""


class MagnificServerError(Exception):
    """Erro transitório do Magnific."""


class MagnificTaskFailedError(Exception):
    """Task completada com erro."""


@dataclass
class MagnificConfig:
    api_key: str
    base_url: str = "https://api.magnific.com"
    timeout: int = 60
    max_retries: int = 3
    poll_interval: float = 2.0
    max_poll_attempts: int = 120
    webhook_secret: Optional[str] = None
    output_dir: str = "outputs/images/magnific"
    default_model: str = "realism"
    default_resolution: str = "2k"
    default_aspect_ratio: str = "square_1_1"
    default_engine: str = "automatic"
    cost_cap_eur: Optional[float] = None

    @classmethod
    def from_env(cls) -> "MagnificConfig":
        api_key = os.environ.get("MAGNIFIC_API_KEY", "").strip()
        if not api_key:
            raise MagnificConfigError("MAGNIFIC_API_KEY ausente.")
        return cls(
            api_key=api_key,
            base_url=os.environ.get("MAGNIFIC_BASE_URL", cls.base_url).rstrip("/"),
            timeout=int(os.environ.get("MAGNIFIC_TIMEOUT_SECONDS", str(cls.timeout))),
            max_retries=int(os.environ.get("MAGNIFIC_MAX_RETRIES", str(cls.max_retries))),
            poll_interval=float(os.environ.get("MAGNIFIC_POLL_INTERVAL_SECONDS", str(cls.poll_interval))),
            max_poll_attempts=int(os.environ.get("MAGNIFIC_MAX_POLL_ATTEMPTS", str(cls.max_poll_attempts))),
            webhook_secret=os.environ.get("MAGNIFIC_WEBHOOK_SECRET"),
            output_dir=os.environ.get("MAGNIFIC_OUTPUT_DIR", cls.output_dir),
            default_model=os.environ.get("MAGNIFIC_DEFAULT_MODEL", cls.default_model),
            default_resolution=os.environ.get("MAGNIFIC_DEFAULT_RESOLUTION", cls.default_resolution),
            default_aspect_ratio=os.environ.get("MAGNIFIC_DEFAULT_ASPECT_RATIO", cls.default_aspect_ratio),
            default_engine=os.environ.get("MAGNIFIC_DEFAULT_ENGINE", cls.default_engine),
            cost_cap_eur=(
                float(os.environ["MAGNIFIC_COST_CAP_EUR"])
                if os.environ.get("MAGNIFIC_COST_CAP_EUR")
                else None
            ),
        )


@dataclass
class TaskResult:
    task_id: str
    status: str
    generated: List[str] = field(default_factory=list)
    has_nsfw: Optional[List[bool]] = None
    raw: Dict[str, Any] = field(default_factory=dict)


class MagnificClient:
    def __init__(self, config: Optional[MagnificConfig] = None) -> None:
        self.config = config or MagnificConfig.from_env()
        self.session = requests.Session()
        self.session.headers.update({
            "x-magnific-api-key": self.config.api_key,
            "content-type": "application/json",
        })

    def _request(self, method: str, path: str, *, params: Optional[Dict[str, Any]] = None, json_body: Optional[Dict[str, Any]] = None) -> requests.Response:
        url = f"{self.config.base_url}{path}"
        last_exception: Optional[Exception] = None
        for attempt in range(1, self.config.max_retries + 1):
            try:
                response = self.session.request(
                    method,
                    url,
                    params=params,
                    json=json_body,
                    timeout=self.config.timeout,
                )
            except requests.RequestException as exc:
                last_exception = exc
                if attempt == self.config.max_retries:
                    raise MagnificServerError(f"Falha de conexão com Magnific: {exc}") from exc
                time.sleep(min(2 ** attempt, 10))
                continue

            if response.status_code in (502, 503, 504):
                if attempt == self.config.max_retries:
                    raise MagnificServerError(f"Magnific indisponível após {attempt} tentativas: {response.text}")
                time.sleep(min(2 ** attempt, 10))
                continue

            if response.status_code == 429:
                raise MagnificRateLimitError("Rate limit excedido no Magnific.")

            if response.status_code == 401:
                raise MagnificAuthError("API key inválida ou ausente.")

            return response

        raise MagnificServerError(f"Falha após {self.config.max_retries} tentativas.") from last_exception

    def submit_mystic(self, *, prompt: Optional[str] = None, resolution: Optional[str] = None, aspect_ratio: Optional[str] = None, model: Optional[str] = None, engine: Optional[str] = None, creative_detailing: Optional[int] = None, fixed_generation: Optional[bool] = None, filter_nsfw: Optional[bool] = None, webhook_url: Optional[str] = None, structure_reference: Optional[str] = None, structure_strength: Optional[int] = None, style_reference: Optional[str] = None, adherence: Optional[int] = None, hdr: Optional[int] = None, styling: Optional[Dict[str, Any]] = None) -> TaskResult:
        payload: Dict[str, Any] = {}
        if prompt is not None:
            payload["prompt"] = prompt
        if webhook_url is not None:
            payload["webhook_url"] = webhook_url
        if structure_reference is not None:
            payload["structure_reference"] = structure_reference
        if structure_strength is not None:
            payload["structure_strength"] = structure_strength
        if style_reference is not None:
            payload["style_reference"] = style_reference
        if adherence is not None:
            payload["adherence"] = adherence
        if hdr is not None:
            payload["hdr"] = hdr
        payload["resolution"] = resolution or self.config.default_resolution
        payload["aspect_ratio"] = aspect_ratio or self.config.default_aspect_ratio
        payload["model"] = model or self.config.default_model
        payload["engine"] = engine or self.config.default_engine
        if creative_detailing is not None:
            payload["creative_detailing"] = creative_detailing
        if fixed_generation is not None:
            payload["fixed_generation"] = fixed_generation
        if filter_nsfw is not None:
            payload["filter_nsfw"] = filter_nsfw
        if styling:
            payload["styling"] = styling

        response = self._request("POST", "/v1/ai/mystic", json_body=payload)
        response.raise_for_status()
        body = response.json()
        data = body.get("data", body)
        return TaskResult(
            task_id=str(data.get("task_id", "")),
            status=str(data.get("status", "")),
            generated=[str(url) for url in data.get("generated", [])],
            has_nsfw=data.get("has_nsfw"),
            raw=body,
        )

    def submit_upscale(self, *, image: str, scale_factor: Optional[int] = None, sharpen: Optional[int] = None, smart_grain: Optional[int] = None, ultra_detail: Optional[int] = None, flavor: Optional[str] = None, webhook_url: Optional[str] = None) -> TaskResult:
        if not image:
            raise ValueError("image é obrigatório para upscale.")
        payload: Dict[str, Any] = {"image": image}
        if scale_factor is not None:
            payload["scale_factor"] = scale_factor
        if sharpen is not None:
            payload["sharpen"] = sharpen
        if smart_grain is not None:
            payload["smart_grain"] = smart_grain
        if ultra_detail is not None:
            payload["ultra_detail"] = ultra_detail
        if flavor is not None:
            payload["flavor"] = flavor
        if webhook_url is not None:
            payload["webhook_url"] = webhook_url

        response = self._request("POST", "/v1/ai/image-upscaler-precision-v2", json_body=payload)
        response.raise_for_status()
        body = response.json()
        data = body.get("data", body)
        return TaskResult(
            task_id=str(data.get("task_id", "")),
            status=str(data.get("status", "")),
            generated=[str(url) for url in data.get("generated", [])],
            raw=body,
        )

    def get_task(self, task_id: str, *, kind: str = "mystic") -> TaskResult:
        if kind not in {"mystic", "upscale"}:
            raise ValueError("kind deve ser 'mystic' ou 'upscale'.")
        path = "/v1/ai/mystic/{task_id}" if kind == "mystic" else "/v1/ai/image-upscaler-precision-v2/{task_id}"
        response = self._request("GET", path.format(task_id=task_id))
        response.raise_for_status()
        body = response.json()
        data = body.get("data", body)
        return TaskResult(
            task_id=str(data.get("task_id", task_id)),
            status=str(data.get("status", "")),
            generated=[str(url) for url in data.get("generated", [])],
            has_nsfw=data.get("has_nsfw"),
            raw=body,
        )

    def wait_for_task(self, task_id: str, *, kind: str = "mystic") -> TaskResult:
        task = self.get_task(task_id, kind=kind)
        if task.status == "COMPLETED":
            return task
        if task.status == "FAILED":
            raise MagnificTaskFailedError(f"Task {task_id} falhou: {task.raw}")
        for _ in range(self.config.max_poll_attempts):
            time.sleep(self.config.poll_interval)
            task = self.get_task(task_id, kind=kind)
            if task.status == "COMPLETED":
                return task
            if task.status == "FAILED":
                raise MagnificTaskFailedError(f"Task {task_id} falhou: {task.raw}")
        raise TimeoutError(f"Task {task_id} não concluída após {self.config.max_poll_attempts} tentativas.")

    def download_result(self, url: str, filename: Optional[str] = None) -> Path:
        parsed = urlparse(url)
        safe_name = filename or (Path(parsed.path).name or f"magnific_{int(time.time())}.png")
        dest_dir = Path(self.config.output_dir)
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / safe_name
        with requests.get(url, stream=True, timeout=self.config.timeout) as response:
            response.raise_for_status()
            with open(dest_path, "wb") as fh:
                for chunk in response.iter_content(chunk_size=1024 * 256):
                    if chunk:
                        fh.write(chunk)
        return dest_path

    @staticmethod
    def validate_webhook(headers: Dict[str, str], body: bytes, secret: Optional[str]) -> bool:
        webhook_id = headers.get("webhook-id", "")
        webhook_timestamp = headers.get("webhook-timestamp", "")
        webhook_signature = headers.get("webhook-signature", "")
        if not webhook_id or not webhook_timestamp or not webhook_signature:
            return False
        if not secret:
            return False
        content_to_sign = f"{webhook_id}.{webhook_timestamp}.{body.decode('utf-8', errors='replace')}"
        expected = base64.b64encode(
            hmac.new(secret.encode(), content_to_sign.encode(), hashlib.sha256).digest()
        ).decode()
        return hmac.compare_digest(expected, webhook_signature)


def validate_webhook(headers: Dict[str, str], body: bytes, secret: Optional[str]) -> bool:
    return MagnificClient.validate_webhook(headers, body, secret)
