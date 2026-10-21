#!/usr/bin/env python3
"""
Browser Autonomy Framework — EvidenceStore
Records runs, screenshots, states, errors, and fallback events.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class EvidenceStore:
    def __init__(self, directory: str | Path | None = None) -> None:
        base = Path(directory) if directory else Path("browser-autonomy/evidence")
        self.runs_path = base / "runs.json"
        self.runs_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.runs_path.exists():
            self.runs_path.write_text("[]", encoding="utf-8")

    def record_run(self, result: Any) -> None:
        entry = {
            "run_id": result.run_id,
            "task": result.task,
            "platform": result.platform,
            "executor": result.executor,
            "state": result.state,
            "started_at": result.started_at,
            "finished_at": result.finished_at,
            "evidence": result.evidence,
            "next_action": result.next_action,
            "error": result.error,
        }
        self._append("runs.json", entry)

    def record_execution(self, run_id: str, executor: str, summary: str, extra: dict[str, Any] | None = None) -> None:
        entry = {
            "run_id": run_id,
            "executor": executor,
            "summary": summary,
            "extra": extra or {},
            "at": _utcnow(),
        }
        self._append("executions.json", entry)

    def _append(self, filename: str, entry: dict[str, Any]) -> None:
        path = self.runs_path.parent / filename
        data: list[dict[str, Any]] = []
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                data = []
        data.append(entry)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()
