#!/usr/bin/env python3
"""AI Local Router — minimal dispatcher for Hermes local stack."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, Optional

STACK_ROOT = Path("/Users/mac/HermesWorkspace/outputs/ai-local-stack")
CONFIG_PATH = STACK_ROOT / "config.yaml"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
WHISPER_BIN = os.environ.get("WHISPER_PATH", "")
COMFYUI_URL = os.environ.get("COMFYUI_URL", "http://127.0.0.1:8188")
N8N_URL = os.environ.get("N8N_URL", "http://127.0.0.1:5678")
FFMPEG_BIN = os.environ.get("FFMPEG_PATH", "ffmpeg")


def _run(cmd: str, timeout: int = 60) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)


def route(task: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    task = (task or "text").strip().lower()
    if task in {"text", "chat", "reasoning", "code"}:
        return _ollama_generate(payload.get("prompt", ""))
    if task == "transcription":
        return _whisper_transcribe(payload.get("audio_path", ""))
    if task == "image":
        return {"status": "blocked", "backend": "comfyui", "url": COMFYUI_URL, "detail": "ComfyUI not auto-installed on this hardware"}
    if task == "automation":
        return {"status": "blocked", "backend": "n8n", "url": N8N_URL, "detail": "n8n not auto-installed on this hardware"}
    if task == "ffmpeg":
        return _ffmpeg_test()
    return {"status": "error", "detail": f"Unknown task: {task}"}


def _ollama_generate(prompt: str) -> Dict[str, Any]:
    try:
        import requests  # type: ignore[import-untyped]
    except Exception as exc:  # pragma: no cover - defensive
        return {"status": "error", "backend": "ollama", "detail": f"requests unavailable: {exc}"}
    try:
        r = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": "qwen2.5:3b", "prompt": prompt or "Responda em português com uma frase curta.", "stream": False},
            timeout=120,
        )
        r.raise_for_status()
        data = r.json()
        return {"status": "ok", "backend": "ollama", "model": data.get("model"), "text": data.get("response", "")}
    except Exception as exc:
        return {"status": "error", "backend": "ollama", "detail": str(exc)}


def _whisper_transcribe(audio_path: str) -> Dict[str, Any]:
    if not WHISPER_BIN or not Path(WHISPER_BIN).exists():
        return {"status": "blocked", "backend": "whisper", "detail": "WHISPER_PATH not configured"}
    try:
        p = _run(f"{WHISPER_BIN} -m model.bin -f audio.wav --language pt", timeout=120)
        return {"status": "ok" if p.returncode == 0 else "error", "backend": "whisper", "stdout": p.stdout, "stderr": p.stderr}
    except Exception as exc:
        return {"status": "error", "backend": "whisper", "detail": str(exc)}


def _ffmpeg_test() -> Dict[str, Any]:
    try:
        p = _run(f"{FFMPEG_BIN} -version", timeout=20)
        if p.returncode != 0:
            return {"status": "error", "backend": "ffmpeg", "detail": p.stderr}
        first = p.stdout.splitlines()[0] if p.stdout else ""
        return {"status": "ok", "backend": "ffmpeg", "version": first}
    except Exception as exc:
        return {"status": "error", "backend": "ffmpeg", "detail": str(exc)}


__all__ = ["route"]
