#!/usr/bin/env python3
"""
Gerador de imagens para Hermes - EPQ.

Fluxo:
  Hermes -> prompt enriquecido -> API de geração -> arquivo local

Uso:
  python imagegen.py --prompt "..." --aspect 4:5 --output /Users/mac/HermesWorkspace/outputs/images/2026/08/EPQ_*.png

Dependências:
  pip install requests Pillow

Provedores suportados:
  - OpenAI (DALL-E 3 / gpt-image-1) -> OPENAI_API_KEY
  - Pollinations (público, sem chave) -> fallback garantido
  - Fal.ai (FAL_KEY)
  - Outros via skill hermes-image-generation

Observação:
  Sem OPENAI_API_KEY, este script já funciona com Pollinations.
"""

from __future__ import annotations

import argparse
import base64
import datetime
import hashlib
import io
import json
import os
import sys
import textwrap
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Optional, Tuple

# Diretório padrão do projeto Hermes
DEFAULT_OUTPUT_DIR = Path("/Users/mac/HermesWorkspace/outputs/images")
LOG_DIR = Path("/Users/mac/HermesWorkspace/outputs/logs")
LOG_FILE = LOG_DIR / "imagegen.log"
BRAND = "EPQ"


def log_event(event: str, payload: dict):
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": datetime.datetime.now().isoformat(),
        "event": event,
        "payload": payload,
    }
    line = json.dumps(entry, ensure_ascii=False)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def build_filename(prompt: str, aspect: str, ext: str = "png") -> str:
    now = datetime.datetime.now()
    safe = "_".join(prompt.split())[:120].replace("/", "-").replace("\\", "-")
    slug = hashlib.sha1(safe.encode()).hexdigest()[:8]
    return f"EPQ_{safe[:40]}_{slug}.{ext}"


def enhance_prompt(raw: str, aspect: str, style: str) -> str:
    extra = textwrap.dedent(
        f"""
        publicidade premium, marca EPQ — Estudando Por Questões,
        objetivo: anúncio de alta conversão para concurso público,
        público-alvo: jovens adultos brasileiros em preparação para concurso,
        estilo: {style if style else 'fotografia publicitária realista, cinematográfica, sofisticada'},
        proporção {aspect},
        iluminação cinematográfica, composição equilibrada, foco no estudante e na sensação de evolução,
        sem texto sobreposto, sem logotipos, sem marcas proprietárias, sem elementos genéricos de IA.
        """  # noqa: E501
    ).strip()
    if "\n\n" in raw:
        return raw + "\n\n" + extra
    return raw + " | " + extra.replace("\n", " ")


def _get(prompt: str) -> Tuple[str, Optional[str]]:
    try:
        import requests

        return requests.__version__, "requests"
    except Exception:
        return "", None


def save_bytes(path: Path, data: bytes) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path


def validate_image(path: Path) -> bool:
    if not path.exists():
        return False
    try:
        from PIL import Image

        with Image.open(path) as img:
            img.verify()
        return True
    except Exception:
        return path.stat().st_size > 0


# ----------------- OpenAI -----------------
def openai_generate(prompt: str, aspect: str, size: str, output_dir: Path) -> Optional[Path]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        size_map = {
            "1:1": "1024x1024",
            "4:5": "1024x1280",
            "9:16": "1024x1792",
            "16:9": "1792x1024",
        }
        size_val = size_map.get(aspect, size)

        payload = {
            "model": "gpt-image-1",
            "prompt": prompt,
            "size": size_val,
            "n": 1,
            "output_format": "png",
        }
        req = urllib.request.Request(
            "https://api.openai.com/v1/images/generations",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode())

        item = data["data"][0]
        url = item.get("url")
        b64 = item.get("b64_json")
        if b64:
            img_bytes = base64.b64decode(b64)
        elif url:
            with urllib.request.urlopen(url, timeout=60) as r:
                img_bytes = r.read()
        else:
            return None

        out_path = output_dir / build_filename(prompt, aspect)
        save_bytes(out_path, img_bytes)
        return out_path if validate_image(out_path) else None
    except Exception as e:
        log_event("openai_failed", {"error": str(e)})
        return None


# ----------------- Pollinations -----------------
def pollinations_generate(prompt: str, aspect: str, seed: Optional[int], output_dir: Path) -> Optional[Path]:
    try:
        qs = {
            "prompt": prompt,
            "model": "flux",
            "width": {"1:1": 1024, "4:5": 1024, "9:16": 1024, "16:9": 1024}.get(aspect, 1024),
            "height": {"1:1": 1024, "4:5": 1280, "9:16": 1792, "16:9": 1024}.get(aspect, 1024),
            "nologo": "true",
        }
        if seed is not None:
            qs["seed"] = str(seed)
        url = "https://image.pollinations.ai/prompt/" + urllib.parse.quote(prompt) + "?" + urllib.parse.urlencode(qs)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=180) as resp:
            img_bytes = resp.read()
        out_path = output_dir / build_filename(prompt, aspect)
        save_bytes(out_path, img_bytes)
        return out_path if validate_image(out_path) else None
    except Exception as e:
        log_event("pollinations_failed", {"error": str(e)})
        return None


# ----------------- Fal.ai -----------------
def fal_generate(prompt: str, aspect: str, size: str, output_dir: Path) -> Optional[Path]:
    fal_key = os.getenv("FAL_KEY")
    if not fal_key:
        return None
    try:
        import requests

        size_map = {"1:1": "1024x1024", "4:5": "1024x1280", "9:16": "1024x1792", "16:9": "1792x1024"}
        payload = {
            "prompt": prompt,
            "model": "fal-ai/flux/dev",
            "image_size": size_map.get(aspect, size),
        }
        r = requests.post(
            "https://fal.run/fal-ai/flux/dev",
            json=payload,
            headers={"Authorization": f"Key {fal_key}"},
            timeout=120,
        )
        r.raise_for_status()
        item = r.json()["images"][0]
        url = item.get("url")
        img = requests.get(url, timeout=60)
        img.raise_for_status()
        out_path = output_dir / build_filename(prompt, aspect)
        save_bytes(out_path, img.content)
        return out_path if validate_image(out_path) else None
    except Exception as e:
        log_event("fal_failed", {"error": str(e)})
        return None


# ----------------- Main flow -----------------
def generate(
    prompt: str,
    aspect: str = "4:5",
    size: str = "1024x1280",
    style: str = "",
    seed: Optional[int] = None,
    output_dir: str = "",
    provider_hint: str = "",
) -> dict:
    out_dir = Path(output_dir) if output_dir else DEFAULT_OUTPUT_DIR / datetime.date.today().strftime("%Y/%m")
    enhanced = enhance_prompt(prompt, aspect, style)

    result = {
        "original_prompt": prompt,
        "enhanced_prompt": enhanced,
        "aspect": aspect,
        "provider": None,
        "model": None,
        "path": None,
        "status": "failed",
        "blockers": [],
    }

    providers = [p for p in (provider_hint, "openai", "fal", "pollinations") if p]
    if not providers:
        providers = ["openai", "fal", "pollinations"]

    for provider in providers:
        provider_fn = {
            "openai": lambda: openai_generate(enhanced, aspect, size, out_dir),
            "fal": lambda: fal_generate(enhanced, aspect, size, out_dir),
            "pollinations": lambda: pollinations_generate(enhanced, aspect, seed, out_dir),
        }.get(provider)
        if not provider_fn:
            continue
        path = provider_fn()
        if path:
            result.update(
                {
                    "provider": provider,
                    "model": {"openai": "gpt-image-1", "fal": "fal-ai/flux/dev", "pollinations": "flux"}.get(provider),
                    "path": str(path),
                    "status": "ok",
                }
            )
            log_event("generated", result)
            return result

    missing = []
    if not os.getenv("OPENAI_API_KEY"):
        missing.append("OPENAI_API_KEY ausente; provedor OpenAI indisponível para este teste.")
    if not os.getenv("FAL_KEY"):
        missing.append("FAL_KEY ausente; provedor Fal.ai indisponível para este teste.")
    result["blockers"] = missing or ["Nenhum provedor disponível."]
    log_event("failed", result)
    return result


def main():
    ap = argparse.ArgumentParser(description="Gerador de imagens EPQ/Hermes")
    ap.add_argument("--prompt", required=True, help="Prompt textual da imagem")
    ap.add_argument("--aspect", default="4:5", choices=["1:1", "4:5", "9:16", "16:9"])
    ap.add_argument("--size", default="1024x1280")
    ap.add_argument("--style", default="")
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--output-dir", default="")
    ap.add_argument("--provider", default="")
    args = ap.parse_args()

    res = generate(
        prompt=args.prompt,
        aspect=args.aspect,
        size=args.size,
        style=args.style,
        seed=args.seed,
        output_dir=args.output_dir,
        provider_hint=args.provider,
    )
    print(json.dumps(res, ensure_ascii=False, indent=2))
    sys.exit(0 if res["status"] == "ok" else 2)


if __name__ == "__main__":
    main()
