#!/usr/bin/env python3
"""
Browser Autonomy Framework — HumanActionProtocol
Structured format for human-required incidents.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


class HumanActionProtocol:
    @staticmethod
    def build(platform: str, task: str, block: str, why: str, current_state: str, next_action: str) -> dict[str, Any]:
        return {
            "protocol": "HUMAN_ACTION_REQUIRED",
            "platform": platform,
            "task": task,
            "block": block,
            "why": why,
            "current_state": current_state,
            "next_action": next_action,
            "created_at": _utcnow(),
        }


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()
