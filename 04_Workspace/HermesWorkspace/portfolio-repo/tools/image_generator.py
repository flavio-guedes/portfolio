#!/usr/bin/env python3
"""
Image Generation Adapter for Hermes.

Standardized interface:
    generate_image(prompt, size, quality, output_format, reference_images, metadata)

Provider-backed by tools/imagegen.py, with safer defaults and structured logging.
"""

from __future__ import annotations

import copy
import datetime
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

IMAGE_SCRIPT = Path("/Users/mac/HermesWorkspace/tools/imagegen.py")
DEFAULT_OUTPUT_ROOT = Path("/Users/mac/HermesWorkspace/outputs/images/generated-images")
LOG_DIR = Path("/Users/mac/HermesWorkspace/outputs/logs")
LOG_FILE = LOG_DIR / "image_generator.jsonl"


def _now_iso() -> str:
    return datetime.datetime.now().isoformat(timespec="seconds")


def _slug(text: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in "-_ " else "" for ch in text).strip()
    safe = "_".join(safe.split())[:60]
    return safe or "image"


def _prompt_hash(prompt: str) -> str:
    return hashlib.sha1(prompt.encode("utf-8")).hexdigest()[:8]


def _log(entry: Dict[str, Any]) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass


def _detect_aspect(size: Optional[str]) -> str:
    if not size:
        return "4:5"
    v = size.lower()
    if "x" not in v:
        return "4:5"
    w, h = v.split("x", 1)
    try:
        rw = int(w.strip())
        rh = int(h.strip())
    except ValueError:
        return "4:5"
    g = max(rw, rh)
    if g == 0:
        return "4:5"
    r = min(rw, rh) / g
    if abs(r - 1.0) < 0.05:
        return "1:1"
    if rw < rh:
        if r < 0.6:
            return "9:16"
        return "4:5"
    if rh < rw:
        if r < 0.6:
            return "16:9"
        return "4:5"
    return "4:5"


def generate_image(
    prompt: str,
    size: Optional[str] = None,
    quality: Optional[str] = None,
    output_format: Optional[str] = None,
    reference_images: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    output_dir: Optional[str] = None,
    provider: Optional[str] = None,
    style: Optional[str] = None,
    seed: Optional[int] = None,
) -> Dict[str, Any]:
    metadata = metadata or {}
    ts = _now_iso()
    aspect = _detect_aspect(size)
    base_dir = Path(output_dir) if output_dir else DEFAULT_OUTPUT_ROOT / datetime.date.today().strftime("%Y/%m/%d")
    base_dir.mkdir(parents=True, exist_ok=True)

    provider_order = []
    if provider:
        provider_order.append(provider)
    provider_order.extend(["openai", "fal", "pollinations"])
    seen = set()
    unique_providers = []
    for p in provider_order:
        if p not in seen:
            unique_providers.append(p)
            seen.add(p)

    result: Dict[str, Any] = {
        "timestamp": ts,
        "provider": None,
        "model": None,
        "status": "failed",
        "size": size,
        "quality": quality,
        "output_format": output_format,
        "aspect": aspect,
        "reference_images": reference_images or [],
        "metadata": metadata,
        "output_dir": str(base_dir),
        "path": None,
        "error": None,
        "category": None,
        "duration_ms": None,
    }
    start = datetime.datetime.now()
    last_error = None
    for p in unique_providers:
        cmd = [
            sys.executable,
            str(IMAGE_SCRIPT),
            "--prompt",
            prompt,
            "--aspect",
            aspect,
            "--provider",
            p,
        ]
        if size:
            cmd += ["--size", size]
        if style:
            cmd += ["--style", style]
        if seed is not None:
            cmd += ["--seed", str(seed)]
        cmd += ["--output-dir", str(base_dir)]
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        except subprocess.TimeoutExpired as exc:
            last_error = f"timeout after {exc.timeout}s"
            continue
        if proc.returncode != 0:
            last_error = proc.stderr.strip() or proc.stdout.strip() or "unknown provider failure"
            continue
        try:
            payload = json.loads(proc.stdout)
        except json.JSONDecodeError:
            last_error = "invalid provider response"
            continue
        if payload.get("status") == "ok" and payload.get("path") and Path(payload["path"]).exists():
            duration_ms = int((datetime.datetime.now() - start).total_seconds() * 1000)
            result.update(
                {
                    "status": "ok",
                    "provider": payload.get("provider", p),
                    "model": payload.get("model"),
                    "path": payload.get("path"),
                    "enhanced_prompt": payload.get("enhanced_prompt"),
                    "original_prompt": payload.get("original_prompt"),
                    "duration_ms": duration_ms,
                    "error": None,
                }
            )
            _log(
                {
                    "timestamp": ts,
                    "event": "generate_image.ok",
                    "prompt_hash": _prompt_hash(prompt),
                    "provider": result["provider"],
                    "model": result["model"],
                    "path": result["path"],
                    "duration_ms": duration_ms,
                    "error": None,
                }
            )
            return result
        last_error = "provider returned non-ok response"

    duration_ms = int((datetime.datetime.now() - start).total_seconds() * 1000)
    category = "AUTHENTICATION"
    if "OPENAI_API_KEY" in (last_error or ""):
        category = "AUTHENTICATION"
    elif "network" in (last_error or "").lower() or "timed out" in (last_error or "").lower():
        category = "NETWORK"
    elif "provider" in (last_error or "").lower():
        category = "PROVIDER"
    result.update(
        {
            "status": "failed",
            "error": last_error,
            "category": category,
            "duration_ms": duration_ms,
        }
    )
    _log(
        {
            "timestamp": ts,
            "event": "generate_image.failed",
            "prompt_hash": _prompt_hash(prompt),
            "providers_tried": unique_providers,
            "error": last_error,
            "category": category,
            "duration_ms": duration_ms,
        }
    )
    return result


__all__ = ["generate_image"]
