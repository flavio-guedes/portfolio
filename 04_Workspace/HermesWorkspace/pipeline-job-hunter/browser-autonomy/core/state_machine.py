#!/usr/bin/env python3
"""
Browser Autonomy Framework — ApplicationStateMachine
Standard browser/application states plus exception states.
"""
from __future__ import annotations

from enum import Enum


class ApplicationState(str, Enum):
    DISCOVERED = "DISCOVERED"
    QUALIFIED = "QUALIFIED"
    PREPARING = "PREPARING"
    READY = "READY"
    EXECUTING = "EXECUTING"
    QA = "QA"
    SUBMITTED = "SUBMITTED"
    CONFIRMED = "CONFIRMED"

    BLOCKED = "BLOCKED"
    ERROR = "ERROR"
    EXPIRED = "EXPIRED"
    HUMAN_REQUIRED = "HUMAN_REQUIRED"
    REJECTED = "REJECTED"


DEFAULT_TRANSITIONS = {
    ApplicationState.DISCOVERED: [ApplicationState.QUALIFIED, ApplicationState.BLOCKED, ApplicationState.EXPIRED],
    ApplicationState.QUALIFIED: [ApplicationState.PREPARING, ApplicationState.BLOCKED, ApplicationState.EXPIRED],
    ApplicationState.PREPARING: [ApplicationState.READY, ApplicationState.ERROR],
    ApplicationState.READY: [ApplicationState.EXECUTING, ApplicationState.HUMAN_REQUIRED],
    ApplicationState.EXECUTING: [ApplicationState.QA, ApplicationState.SUBMITTED, ApplicationState.HUMAN_REQUIRED, ApplicationState.ERROR, ApplicationState.BLOCKED],
    ApplicationState.QA: [ApplicationState.SUBMITTED, ApplicationState.READY, ApplicationState.ERROR],
    ApplicationState.SUBMITTED: [ApplicationState.CONFIRMED, ApplicationState.HUMAN_REQUIRED, ApplicationState.REJECTED, ApplicationState.EXPIRED],
    ApplicationState.CONFIRMED: [],
    ApplicationState.BLOCKED: [ApplicationState.READY, ApplicationState.EXECUTING],
    ApplicationState.ERROR: [ApplicationState.READY, ApplicationState.EXECUTING],
    ApplicationState.EXPIRED: [],
    ApplicationState.HUMAN_REQUIRED: [ApplicationState.READY, ApplicationState.EXECUTING],
    ApplicationState.REJECTED: [],
}


def next_states(state: ApplicationState) -> list[ApplicationState]:
    return list(DEFAULT_TRANSITIONS.get(state, []))


def is_terminal(state: ApplicationState) -> bool:
    return not bool(next_states(state))
