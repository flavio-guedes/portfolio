#!/usr/bin/env python3
"""HIIF Reference Collector v1.0.0"""
import json, os, sys
from datetime import datetime

BASE = "/Users/mac/HermesWorkspace/hiif/data"
REFS_PATH = os.path.join(BASE, "references.json")
PATS_PATH = os.path.join(BASE, "patterns.json")

def load_json(path, default):
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return default

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def add_reference(source, ref_data):
    data = load_json(REFS_PATH, {"references": [], "stats": {"total": 0, "by_source": {}, "by_category": {}, "by_style": {}, "by_tech": {}}})
    ref_data["id"] = f"{source}-{data['stats']['total']}"
    ref_data["source"] = source
    ref_data["added_at"] = datetime.now().isoformat()
    data["references"].append(ref_data)
    data["stats"]["total"] += 1
    data["stats"]["by_source"][source] = data["stats"]["by_source"].get(source, 0) + 1
    for cat in ref_data.get("categories", []):
        data["stats"]["by_category"][cat] = data["stats"]["by_category"].get(cat, 0) + 1
    for style in ref_data.get("styles", []):
        data["stats"]["by_style"][style] = data["stats"]["by_style"].get(style, 0) + 1
    save_json(REFS_PATH, data)
    return ref_data["id"]

def add_pattern(category, pattern_data):
    data = load_json(PATS_PATH, {"patterns": {}, "meta": {"version": "1.0.0", "last_updated": datetime.now().isoformat(), "total_patterns": 0}})
    pattern_data["id"] = f"{category}-{len(data['patterns'].get(category, []))}"
    pattern_data["added_at"] = datetime.now().isoformat()
    data["patterns"].setdefault(category, []).append(pattern_data)
    data["meta"]["total_patterns"] = sum(len(v) for v in data["patterns"].values())
    save_json(PATS_PATH, data)
    return pattern_data["id"]

if __name__ == "__main__":
    print("HIIF Reference Collector")
    print("Usage: python3 reference_collector.py <add_reference|add_pattern> <json_data_or_file>")
    sys.exit(0)
