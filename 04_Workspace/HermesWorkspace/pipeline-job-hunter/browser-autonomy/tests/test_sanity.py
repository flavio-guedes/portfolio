#!/usr/bin/env python3
"""
Sanity tests for Browser Autonomy Framework.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO))


def test_core_imports():
    from browser_autonomy.core import orchestrator, router, evidence, state_machine, human_action
    assert orchestrator is not None
    assert router is not None
    assert evidence is not None
    assert state_machine is not None
    assert human_action is not None


def test_orchestrator_execute():
    from browser_autonomy.core.orchestrator import BrowserOrchestrator, RunState
    from browser_autonomy.core.router import TaskContext

    evidence_dir = REPO / "browser-autonomy" / "evidence" / "test"
    orchestrator = BrowserOrchestrator(evidence_dir=evidence_dir)
    result = orchestrator.execute(
        task="diagnostic",
        platform="unknown",
        context=TaskContext(dynamic_page=True),
    )
    assert result.state == RunState.ERROR
    assert result.executor is not None
    assert "error" in result.evidence
    assert (evidence_dir / "runs.json").exists()
    assert (evidence_dir / "executions.json").exists()


def test_state_machine_has_terminal_states():
    from browser_autonomy.core.state_machine import ApplicationState, is_terminal, next_states

    terminal_states = [s for s in ApplicationState if is_terminal(s)]
    assert ApplicationState.CONFIRMED in terminal_states
    assert ApplicationState.REJECTED in terminal_states
    assert ApplicationState.EXPIRED in terminal_states
    assert ApplicationState.READY not in terminal_states
    assert ApplicationState.next_states(ApplicationState.READY)


def test_platform_playbook():
    from browser_autonomy.platforms import upwork

    data = upwork.UpworkPlaybook.to_dict()
    assert data["platform"] == "upwork"
    assert isinstance(data["known_flows"], list)
    assert isinstance(data["common_errors"], list)
    assert "search_jobs" in data["known_flows"]


def _cleanup_test_evidence():
    evidence_dir = REPO / "browser-autonomy" / "evidence" / "test"
    if evidence_dir.exists():
        for filename in ["runs.json", "executions.json"]:
            path = evidence_dir / filename
            if path.exists():
                os.remove(path)
        os.rmdir(evidence_dir)


if __name__ == "__main__":
    try:
        test_core_imports()
        test_orchestrator_execute()
        test_state_machine_has_terminal_states()
        test_platform_playbook()
        print("ok")
    finally:
        _cleanup_test_evidence()
