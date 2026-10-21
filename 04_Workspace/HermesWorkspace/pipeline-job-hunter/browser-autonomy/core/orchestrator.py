#!/usr/bin/env python3
"""
Browser Autonomy Framework — BrowserOrchestrator
Routes browser tasks across:
- API
- Playwright
- Stagehand
- Browser Use
- Human Action Required
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any

from .evidence import EvidenceStore
from .router import ExecutionRouter, ExecutorType, TaskContext


class RunState(str, Enum):
    PENDING = "PENDING"
    EXECUTING = "EXECUTING"
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"
    BLOCKED = "BLOCKED"
    HUMAN_REQUIRED = "HUMAN_REQUIRED"
    EXPIRED = "EXPIRED"


@dataclass
class RunResult:
    run_id: str
    task: str
    platform: str
    executor: ExecutorType | None = None
    state: RunState = RunState.PENDING
    started_at: str = ""
    finished_at: str = ""
    evidence: dict[str, Any] = field(default_factory=dict)
    next_action: str = ""
    error: str | None = None


class BrowserOrchestrator:
    def __init__(self, evidence_dir: str | Path | None = None) -> None:
        self.router = ExecutionRouter()
        self.evidence = EvidenceStore(evidence_dir)

    def execute(self, task: str, platform: str, context: TaskContext | None = None) -> RunResult:
        run_id = f"run-{int(time.time() * 1000)}"
        result = RunResult(
            run_id=run_id,
            task=task,
            platform=platform,
            started_at=_utcnow(),
            state=RunState.EXECUTING,
        )

        try:
            route = self.router.select(context)
            result.executor = route.executor
            outcome = route.executor_fn(context=context or TaskContext(), evidence=self.evidence, run_id=run_id)
            result.state = RunState.SUCCESS if outcome.get("success") else RunState.ERROR
            result.evidence = outcome.get("evidence", {})
            result.next_action = outcome.get("next_action", "")
            result.error = outcome.get("error")
        except Exception as exc:  # pragma: no cover - defensive
            result.state = RunState.ERROR
            result.error = str(exc)
        finally:
            result.finished_at = _utcnow()

        self.evidence.record_run(result)
        return result


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()
