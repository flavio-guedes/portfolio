#!/usr/bin/env python3
"""
Browser Autonomy Framework — Platform playbook: Upwork
Known flows, selectors, common states, fallback rules.
"""
from __future__ import annotations

from typing import Any


class UpworkPlaybook:
    platform = "upwork"
    best_executor = "Playwright / Stagehand / Browser Use fallback"

    known_flows = [
        "search_jobs",
        "open_job",
        "submit_proposal",
        "upload_attachment",
        "answer_freelancer_questions",
    ]

    common_errors = [
        "login_wall",
        "captcha",
        "two_factor_auth",
        "search_404",
        "proposal_limit",
    ]

    auth_method = "manual_session_or_oauth_equivalent"
    fallback = "Browser Use"
    qa_checks = ["success_banner", "proposal_status", "job_id"]

    @staticmethod
    def to_dict() -> dict[str, Any]:
        return {
            "platform": UpworkPlaybook.platform,
            "known_flows": UpworkPlaybook.known_flows,
            "common_errors": UpworkPlaybook.common_errors,
            "auth_method": UpworkPlaybook.auth_method,
            "best_executor": UpworkPlaybook.best_executor,
            "fallback": UpworkPlaybook.fallback,
            "qa_checks": UpworkPlaybook.qa_checks,
        }
