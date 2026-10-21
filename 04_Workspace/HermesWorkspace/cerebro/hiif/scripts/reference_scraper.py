#!/usr/bin/env python3
"""HIIF Reference Scraper & Analyzer v1.0.0"""
import json, os, re, sys
from datetime import datetime
from urllib.parse import urlparse

BASE = "/Users/mac/HermesWorkspace/hiif"
REFS_PATH = os.path.join(BASE, "data", "references.json")

SOURCE_URLS = {
    "awwwards": "https://www.awwwards.com/",
    "fwa": "https://thefwa.com/",
    "webby": "https://www.webbyawards.com/",
    "cssda": "https://www.cssdesignawards.com/",
    "csswinner": "https://www.csswinner.com/",
    "siteinspire": "https://www.siteinspire.com/",
    "behance": "https://www.behance.net/",
    "dribbble": "https://dribbble.com/",
    "muzli": "https://muz.li/",
    "landbook": "https://land-book.com/",
    "lapaninja": "https://www.lapaninja.com/",
    "godly": "https://godly.website/",
    "gsap-showcase": "https://gsap.com/showcase/",
    "adc": "https://www.oneclub.org/"
}

def guess_domain_categories(domain):
    domain = domain.lower()
    if any(x in domain for x in ["dashboard", "analytics", "metric", "insight", "chart", "kpi"]):
        return ["dashboard", "data-driven"]
    if any(x in domain for x in ["crm", "sales", "lead", "pipeline", "contact"]):
        return ["crm", "saas"]
    if any(x in domain for x in ["ai", "gpt", "claude", "llm", "copilot", "assistant"]):
        return ["ai-native", "saas"]
    if any(x in domain for x in ["command", "ops", "center", "control"]):
        return ["command-center", "operational"]
    return ["web"]

def analyze_ref(ref):
    ref.setdefault("analyzed_at", datetime.now().isoformat())
    ref.setdefault("categories", [])
    ref.setdefault("styles", [])
    ref.setdefault("tech_stack", {})
    ref.setdefault("concepts", [])
    ref.setdefault("components_identified", [])
    ref.setdefault("layout", {})
    ref.setdefault("tech_confidence", {})
    
    if not ref.get("categories"):
        ref["categories"] = guess_domain_categories(urlparse(ref.get("url", "")).netloc)
    
    return ref

def scrape_placeholder(source, query=None):
    """Placeholder para integração futura com Browser Use ou ferramentas de coleta."""
    return {
        "message": f"Coleta estruturada para {source} ainda não implementada.",
        "next_step": "Integrar browser_exec ou ferramenta de scraping autorizada para coleta real.",
        "supported_sources": list(SOURCE_URLS.keys())
    }

def analyze_existing():
    if not os.path.exists(REFS_PATH):
        return {"status": "no_references", "message": "Nenhuma referência cadastrada ainda."}
    with open(REFS_PATH, "r") as f:
        data = json.load(f)
    updated = 0
    for ref in data.get("references", []):
        before = json.dumps(ref)
        analyze_ref(ref)
        after = json.dumps(ref)
        if before != after:
            updated += 1
    with open(REFS_PATH, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return {"status": "ok", "analyzed": len(data.get("references", [])), "updated": updated}

if __name__ == "__main__":
    print("HIIF Reference Scraper & Analyzer")
    print("Usage: python3 reference_scraper.py <analyze_existing>")
    sys.exit(0)
