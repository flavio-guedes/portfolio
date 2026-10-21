#!/usr/bin/env python3
"""
Integração mínima do Browser Autonomy Framework ao pipeline existente.
Mantém contratos do Job Hunter inalterados.
"""
from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent


def browser_autonomy_present() -> bool:
    return (REPO / "browser-autonomy" / "core" / "orchestrator.py").exists()


if __name__ == "__main__":
    print(json.dumps({"browser_autonomy_present": browser_autonomy_present()}, ensure_ascii=False))
