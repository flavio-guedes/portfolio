#!/usr/bin/env python3
"""Founder & Opportunity Radar engine."""

from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

RADAR_DIR = Path("/Users/mac/HermesWorkspace/founder-radar")
STATE_DIR = RADAR_DIR / "state"
OUTPUT_DIR = RADAR_DIR / "output"

FOUNDER_STATUSES = {"NOVO", "MONITORANDO", "INTERAGINDO", "CONTATADO", "RESPONDEU", "OPORTUNIDADE"}
OPP_STATUSES = {"NOVO", "EM_ANALISE", "CONTATADO", "RESPONDIDO", "ENTREVISTA", "PROPOSTA", "FECHADO", "ARQUIVADO"}
SOCIAL_STATUSES = {"NOVO", "MONITORANDO", "INTERAGIDO", "CONVERTIDO"}
OUTREACH_STATUSES = {"RASCUNHO", "ENVIADO", "RESPONDIDO", "AGUARDANDO", "ARQUIVADO"}

SEGMENT_PRIORITY = {
    "Alimentos Saudáveis": 1,
    "Educação": 1,
    "Imobiliário": 1,
    "Varejo": 1,
    "Food & Beverage": 1,
    "Saúde": 1,
    "EdTech": 1,
    "PropTech": 1,
    "RetailTech": 1,
    "Healthtech": 1,
    "Fintech": 2,
    "Marketing": 2,
    "Comunicação": 2,
    "Design": 2,
    "Tecnologia": 2,
}

COMPANY_STAGE_ORDER = {"STARTUP": 1, "SCALE_UP": 2, "PME": 3, "MEDIA": 4, "GRANDE_EMPRESA": 5}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp.replace(path)


def ensure_state() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, default in [
        ("founders.json", []),
        ("companies.json", []),
        ("opportunities.json", []),
        ("social_radar.json", []),
        ("outreach.json", []),
        ("companies_enriched.json", []),
    ]:
        p = STATE_DIR / name
        if not p.exists():
            save_json(p, default)


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

REQUIRED_FOUNDER = {"empresa", "segmento"}
REQUIRED_COMPANY = {"empresa", "segmento"}
REQUIRED_OPP = {"empresa", "segmento", "fonte", "status"}
REQUIRED_SOCIAL = {"autor", "tema", "status"}
REQUIRED_OUTREACH = {"tipo", "destinatario", "empresa", "canal", "status"}


def validate_enum(value: Any, allowed: set[str], field: str) -> list[str]:
    errors = []
    if value not in allowed:
        errors.append(f"{field} inválido: {value}. Permitidos: {sorted(allowed)}")
    return errors


def validate_founder(item: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for field in REQUIRED_FOUNDER:
        if not item.get(field):
            errors.append(f"founder.{field} obrigatório")
    errors.extend(validate_enum(item.get("status", ""), FOUNDER_STATUSES, "founder.status"))
    if item.get("aderencia_perfil") is not None:
        v = item["aderencia_perfil"]
        if not isinstance(v, (int, float)) or v < 0 or v > 100:
            errors.append("founder.aderencia_perfil deve estar entre 0 e 100")
    return errors


def validate_company(item: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for field in REQUIRED_COMPANY:
        if not item.get(field):
            errors.append(f"company.{field} obrigatório")
    if item.get("tamanho_estagio") and item["tamanho_estagio"] not in COMPANY_STAGE_ORDER:
        errors.append("company.tamanho_estagio inválido")
    return errors


def validate_opportunity(item: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for field in REQUIRED_OPP:
        if not item.get(field):
            errors.append(f"opportunity.{field} obrigatório")
    errors.extend(validate_enum(item.get("status", ""), OPP_STATUSES, "opportunity.status"))
    errors.extend(validate_enum(item.get("tier", ""), {"S", "A", "B", "C", "D"}, "opportunity.tier"))
    for score_key in [
        "score", "aderencia", "aderencia_segmento", "sinal_crescimento",
        "acessibilidade_decisor", "oportunidade_identificada", "potencial_financeiro",
    ]:
        if score_key in item and item[score_key] is not None:
            v = item[score_key]
            if not isinstance(v, (int, float)) or v < 0 or v > 100:
                errors.append(f"opportunity.{score_key} deve estar entre 0 e 100")
    return errors


def validate_social(item: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for field in REQUIRED_SOCIAL:
        if not item.get(field):
            errors.append(f"social.{field} obrigatório")
    errors.extend(validate_enum(item.get("status", ""), SOCIAL_STATUSES, "social.status"))
    errors.extend(validate_enum(item.get("prioridade", ""), {"ALTA", "MÉDIA", "BAIXA"}, "social.prioridade"))
    return errors


def validate_outreach(item: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for field in REQUIRED_OUTREACH:
        if not item.get(field):
            errors.append(f"outreach.{field} obrigatório")
    errors.extend(validate_enum(item.get("status", ""), OUTREACH_STATUSES, "outreach.status"))
    return errors


def validate_all(records: list[dict[str, Any]], kind: str) -> list[str]:
    errors: list[str] = []
    validator = {
        "founder": validate_founder,
        "company": validate_company,
        "opportunity": validate_opportunity,
        "social": validate_social,
        "outreach": validate_outreach,
    }.get(kind)
    if not validator:
        return errors
    for idx, item in enumerate(records):
        item_errors = validator(item)
        for e in item_errors:
            errors.append(f"[{kind} #{idx}] {e}")
    return errors


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def score_opportunity(item: dict[str, Any]) -> dict[str, Any]:
    aderencia = float(item.get("aderencia", 0))
    aderencia_segmento = float(item.get("aderencia_segmento", 0))
    sinal = float(item.get("sinal_crescimento", 0))
    acess = float(item.get("acessibilidade_decisor", 0))
    oport = float(item.get("oportunidade_identificada", 0))
    financeiro = float(item.get("potencial_financeiro", 0))

    total = aderencia * 0.25 + aderencia_segmento * 0.15 + sinal * 0.20 + acess * 0.15 + oport * 0.15 + financeiro * 0.10
    total = round(total, 2)

    if total >= 90:
        tier = "S"
    elif total >= 80:
        tier = "A"
    elif total >= 70:
        tier = "B"
    elif total >= 50:
        tier = "C"
    else:
        tier = "D"

    return {
        "score": total,
        "tier": tier,
        "aderencia": aderencia,
        "aderencia_segmento": aderencia_segmento,
        "sinal_crescimento": sinal,
        "acessibilidade_decisor": acess,
        "oportunidade_identificada": oport,
        "potencial_financeiro": financeiro,
    }


def score_founder(item: dict[str, Any]) -> dict[str, Any]:
    aderencia = float(item.get("aderencia_perfil", 0))
    segmento = 0.0
    seg = item.get("segmento") or ""
    segmento = 15.0 if SEGMENT_PRIORITY.get(seg) == 1 else 7.5 if SEGMENT_PRIORITY.get(seg) == 2 else 0.0
    sinal = 10.0 if item.get("sinais_crescimento") else 0.0
    acess = 15.0 if item.get("contato_publico") or item.get("linkedin") or item.get("instagram") else 0.0
    oport = 7.5 if item.get("vagas_identificadas") else 0.0
    financeiro = 10.0 if item.get("tamanho_estagio") in {"SCALE_UP", "MEDIA", "GRANDE_EMPRESA"} else 5.0 if item.get("tamanho_estagio") == "PME" else 0.0

    total = aderencia * 0.25 + segmento * 0.15 + sinal * 0.20 + acess * 0.15 + oport * 0.15 + financeiro * 0.10
    total = round(total, 2)

    if total >= 90:
        tier = "S"
    elif total >= 80:
        tier = "A"
    elif total >= 70:
        tier = "B"
    elif total >= 50:
        tier = "C"
    else:
        tier = "D"

    return {"score": total, "tier": tier}


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

def _norm(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip().lower()


def dedupe_founders(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: dict[str, int] = {}
    result: list[dict[str, Any]] = []
    for idx, item in enumerate(records):
        key_parts = [
            _norm(item.get("nome")),
            _norm(item.get("empresa")),
            _norm(item.get("linkedin")),
            _norm(item.get("instagram")),
            _norm(item.get("email_publico")),
            _norm(item.get("telefone_publico")),
        ]
        key = "|".join(key_parts)
        if not key.strip("|"):
            key = f"empty-{idx}"
        if key in seen:
            continue
        seen[key] = idx
        result.append(item)
    return result


def dedupe_companies(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: dict[str, int] = {}
    result: list[dict[str, Any]] = []
    for idx, item in enumerate(records):
        key = "|".join([
            _norm(item.get("empresa")),
            _norm(item.get("site")),
        ])
        if not key.strip("|"):
            key = f"empty-{idx}"
        if key in seen:
            continue
        seen[key] = idx
        result.append(item)
    return result


def dedupe_opportunities(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: dict[str, int] = {}
    result: list[dict[str, Any]] = []
    for idx, item in enumerate(records):
        key = "|".join([
            _norm(item.get("link")),
            _norm(item.get("empresa")),
            _norm(item.get("cargo")),
            _norm(item.get("fonte")),
        ])
        if not key.strip("|"):
            key = f"empty-{idx}"
        if key in seen:
            continue
        seen[key] = idx
        result.append(item)
    return result


def dedupe_social(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: dict[str, int] = {}
    result: list[dict[str, Any]] = []
    for idx, item in enumerate(records):
        key = "|".join([
            _norm(item.get("link_post")),
            _norm(item.get("autor")),
        ])
        if not key.strip("|"):
            key = f"empty-{idx}"
        if key in seen:
            continue
        seen[key] = idx
        result.append(item)
    return result


def dedupe_outreach(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: dict[str, int] = {}
    result: list[dict[str, Any]] = []
    for idx, item in enumerate(records):
        key = "|".join([
            _norm(item.get("destinatario")),
            _norm(item.get("empresa")),
            _norm(item.get("canal")),
            _norm(item.get("tipo")),
        ])
        if not key.strip("|"):
            key = f"empty-{idx}"
        if key in seen:
            continue
        seen[key] = idx
        result.append(item)
    return result


# ---------------------------------------------------------------------------
# Enrichment
# ---------------------------------------------------------------------------

def _first(v: Any) -> Any:
    return v if v else None


def enrich_companies(
    founders: list[dict[str, Any]],
    companies: list[dict[str, Any]],
    opportunities: list[dict[str, Any]],
    socials: list[dict[str, Any]],
    outreaches: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    company_map: dict[str, dict[str, Any]] = {}
    for company in companies:
        key = _norm(company.get("empresa"))
        company_map[key] = {
            "id": company.get("id"),
            "empresa": company.get("empresa") or "",
            "segmento": company.get("segmento") or "",
            "localizacao": company.get("localizacao"),
            "site": company.get("site"),
            "tamanho_estagio": company.get("tamanho_estagio"),
            "sinais_crescimento": company.get("sinais_crescimento") or [],
            "ultima_movimentacao": company.get("ultima_movimentacao"),
            "criado_em": company.get("criado_em"),
            "atualizado_em": company.get("atualizado_em"),
            "founders": [],
            "vagas": [],
            "social_posts": [],
            "outreach": [],
        }

    for founder in founders:
        key = _norm(founder.get("empresa"))
        if key not in company_map:
            company_map[key] = {
                "id": f"company-{len(company_map) + 1:03d}",
                "empresa": founder.get("empresa") or "",
                "segmento": founder.get("segmento") or "",
                "localizacao": founder.get("localizacao"),
                "site": founder.get("empresa_site"),
                "tamanho_estagio": founder.get("tamanho_estagio"),
                "sinais_crescimento": founder.get("sinais_crescimento") or [],
                "ultima_movimentacao": founder.get("atualizado_em"),
                "criado_em": founder.get("criado_em"),
                "atualizado_em": founder.get("atualizado_em"),
                "founders": [],
                "vagas": [],
                "social_posts": [],
                "outreach": [],
            }
        company_map[key]["founders"].append(founder)

    for opp in opportunities:
        key = _norm(opp.get("empresa"))
        if key in company_map:
            company_map[key]["vagas"].append(opp)

    for social in socials:
        key = _norm(social.get("empresa"))
        if key in company_map:
            company_map[key]["social_posts"].append(social)

    for outreach in outreaches:
        key = _norm(outreach.get("empresa"))
        if key in company_map:
            company_map[key]["outreach"].append(outreach)

    enriched = []
    for company in company_map.values():
        company["score"] = score_company(company)
        company["tier"] = company["score"].get("tier", "D")
        enriched.append(company)
    return enriched


def score_company(company: dict[str, Any]) -> dict[str, Any]:
    stage_score = COMPANY_STAGE_ORDER.get(company.get("tamanho_estagio"), 0) * 5
    sinais = min(float(len(company.get("sinais_crescimento") or [])) * 5, 20)
    founders = min(float(len(company.get("founders") or [])) * 4, 16)
    vagas = min(float(len(company.get("vagas") or [])) * 5, 15)
    social = min(float(len(company.get("social_posts") or [])) * 3, 12)
    outreach = min(float(len(company.get("outreach") or [])) * 4, 12)
    total = round(stage_score + sinais + founders + vagas + social + outreach, 2)
    if total >= 90:
        tier = "S"
    elif total >= 80:
        tier = "A"
    elif total >= 70:
        tier = "B"
    elif total >= 50:
        tier = "C"
    else:
        tier = "D"
    return {
        "score": total,
        "tier": tier,
        "stage_score": stage_score,
        "sinais_score": sinais,
        "founders_score": founders,
        "vagas_score": vagas,
        "social_score": social,
        "outreach_score": outreach,
    }


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def _tier_rank(tier: str) -> int:
    return {"S": 0, "A": 1, "B": 2, "C": 3, "D": 4}.get(tier, 5)


def generate_daily_brief(
    founders: list[dict[str, Any]],
    companies: list[dict[str, Any]],
    opportunities: list[dict[str, Any]],
    socials: list[dict[str, Any]],
    outreaches: list[dict[str, Any]],
) -> str:
    now = datetime.now(timezone.utc).astimezone().isoformat()

    # Score items
    for opp in opportunities:
        computed = score_opportunity(opp)
        opp["score"] = computed["score"]
        opp["tier"] = computed["tier"]
        opp.update({k: computed[k] for k in [
            "aderencia", "aderencia_segmento", "sinal_crescimento",
            "acessibilidade_decisor", "oportunidade_identificada", "potencial_financeiro",
        ] if k in computed})

    for founder in founders:
        computed = score_founder(founder)
        founder["score"] = computed["score"]
        founder["tier"] = computed["tier"]

    enriched_companies = enrich_companies(founders, companies, opportunities, socials, outreaches)

    # Sort
    opportunities_sorted = sorted(opportunities, key=lambda x: (_tier_rank(x.get("tier", "D")), -(x.get("score") or 0)))
    founders_sorted = sorted(founders, key=lambda x: (_tier_rank(x.get("tier", "D")), -(x.get("score") or 0)))
    socials_sorted = sorted(socials, key=lambda x: {"ALTA": 0, "MÉDIA": 1, "BAIXA": 2}.get(x.get("prioridade", "BAIXA"), 3))

    # WHAT TO DO NOW
    top_opps = [o for o in opportunities_sorted if o.get("tier") in {"S", "A"}][:3]
    top_social = [s for s in socials_sorted if s.get("prioridade") == "ALTA"][:3]

    lines: list[str] = []
    lines.append("# FOUNDER & OPPORTUNITY RADAR — DAILY BRIEF")
    lines.append("")
    lines.append(f"Gerado em: {now}")
    lines.append("")
    lines.append("## 🔥 WHAT TO DO NOW")
    lines.append("")

    action_idx = 1
    for opp in top_opps:
        lines.append(f"{action_idx}. APLICAR/ABORDAR: {opp.get('cargo')} — {opp.get('empresa')}")
        lines.append(f"   Motivo: Tier {opp.get('tier')} | Score {opp.get('score')} | {opp.get('match_summary') or ''}")
        lines.append(f"   Próxima ação: {opp.get('next_action') or 'Verificar link e preparar abordagem.'}")
        lines.append("")
        action_idx += 1

    for social in top_social:
        lines.append(f"{action_idx}. INTERAGIR COM: {social.get('autor')} — {social.get('empresa')}")
        lines.append(f"   Motivo: {social.get('por_que_interagir') or social.get('tema')}")
        lines.append(f"   Comentário sugerido: {social.get('comentario_v1') or 'Aguardando definição.'}")
        lines.append("")
        action_idx += 1

    lines.append("---")
    lines.append("")
    lines.append("## 🚀 NOVAS OPORTUNIDADES")
    lines.append("")
    lines.append("| Empresa | Decisor | Segmento | Oportunidade | Score | Tier |")
    lines.append("| ------- | ------- | -------- | ------------ | ----- | ---- |")
    for opp in opportunities_sorted[:20]:
        lines.append(
            f"| {opp.get('empresa') or '-'} | {opp.get('decisor') or '-'} | {opp.get('segmento') or '-'} "
            f"| {opp.get('cargo') or '-'} | {opp.get('score') or 0} | {opp.get('tier') or 'D'} |"
        )
    lines.append("")

    lines.append("## 👀 POSTS ESTRATÉGICOS")
    lines.append("")
    lines.append("| Autor | Tema | Link | Ação | Prioridade |")
    lines.append("| ----- | ---- | ---- | ---- | ---------- |")
    for social in socials_sorted[:20]:
        lines.append(
            f"| {social.get('autor') or '-'} | {social.get('tema') or '-'} "
            f"| {social.get('link_post') or '-'} | {', '.join(social.get('acoes') or [])} | {social.get('prioridade') or '-'} |"
        )
    lines.append("")

    lines.append("## 📊 RESUMO")
    lines.append("")
    lines.append(f"Novos founders encontrados: {len(founders)}")
    lines.append(f"Novas empresas: {len(companies)}")
    lines.append(f"Novas vagas: {len(opportunities)}")
    lines.append(f"Posts para interação: {len(socials)}")
    contacts = sum(1 for f in founders if f.get("contato_publico") or f.get("email_publico") or f.get("telefone_publico"))
    lines.append(f"Contatos públicos encontrados: {contacts}")
    lines.append(f"Abordagens recomendadas: {len(outreaches)}")
    lines.append(f"Oportunidades Tier S: {sum(1 for o in opportunities if o.get('tier') == 'S')}")
    lines.append(f"Oportunidades Tier A: {sum(1 for o in opportunities if o.get('tier') == 'A')}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("> Apenas inteligência acionável. Se quiser, depois posso gerar as mensagens personalizadas para os itens priorizados.")

    brief = "\n".join(lines)
    out_path = OUTPUT_DIR / "daily_brief.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(brief, encoding="utf-8")
    return brief


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------

def audit_profile() -> dict[str, Any]:
    base = {
        "nome": "Flávio Guedes",
        "areas": [
            "Marketing", "Comunicação", "Branding", "Direção de Arte", "Design", "Growth",
            "Performance", "Conteúdo", "Estratégia Criativa", "Marketing Digital",
            "Operações de Marketing", "Produto Digital", "UX/UI", "Creative Operations",
            "Liderança de times criativos e marketing",
        ],
        "segmentos_relevantes": [
            "Saúde", "Alimentação", "Educação", "Marketing", "Varejo", "Produtos e serviços digitais",
        ],
        "cargos_objetivo": [
            "Head of Marketing", "Marketing Manager", "Growth Manager", "Creative Director",
            "Brand Manager", "Content Lead", "Creative Lead", "Marketing Operations",
            "Product Marketing", "Coordenador/Gerente de Marketing", "Diretor de Arte Sênior",
            "Estratégia de Marca", "Growth & Marketing",
        ],
        "portfolio": "https://flavio-guedes.github.io/portfolio/",
        "pretensao_clt_brl": "R$ 5.000",
        "pretensao_latam_usd": "US$ 2.500/mês (alvo); US$ 3.500/mês (autonomia)",
        "icp_prioritario": [
            "Alimentos Saudáveis / Food & Beverage",
            "Educação / EdTech",
            "Imobiliário / PropTech",
            "Varejo / RetailTech / D2C",
        ],
    }
    audit_path = OUTPUT_DIR / "profile_audit.json"
    save_json(audit_path, base)
    return base


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def run_audit() -> None:
    audit_profile()
    print("Auditoria do perfil concluída.")


def run_validate() -> None:
    ensure_state()
    founders = load_json(STATE_DIR / "founders.json", [])
    companies = load_json(STATE_DIR / "companies.json", [])
    opportunities = load_json(STATE_DIR / "opportunities.json", [])
    socials = load_json(STATE_DIR / "social_radar.json", [])
    outreach = load_json(STATE_DIR / "outreach.json", [])

    all_errors: list[str] = []
    all_errors.extend(validate_all(founders, "founder"))
    all_errors.extend(validate_all(companies, "company"))
    all_errors.extend(validate_all(opportunities, "opportunity"))
    all_errors.extend(validate_all(socials, "social"))
    all_errors.extend(validate_all(outreach, "outreach"))

    if all_errors:
        print("Erros de validação encontrados:")
        for e in all_errors:
            print(f" - {e}")
        raise SystemExit(1)
    print("Validação OK.")


def run_dedupe() -> None:
    ensure_state()
    founders = load_json(STATE_DIR / "founders.json", [])
    companies = load_json(STATE_DIR / "companies.json", [])
    opportunities = load_json(STATE_DIR / "opportunities.json", [])
    socials = load_json(STATE_DIR / "social_radar.json", [])
    outreach = load_json(STATE_DIR / "outreach.json", [])

    founders = dedupe_founders(founders)
    companies = dedupe_companies(companies)
    opportunities = dedupe_opportunities(opportunities)
    socials = dedupe_social(socials)
    outreach = dedupe_outreach(outreach)

    save_json(STATE_DIR / "founders.json", founders)
    save_json(STATE_DIR / "companies.json", companies)
    save_json(STATE_DIR / "opportunities.json", opportunities)
    save_json(STATE_DIR / "social_radar.json", socials)
    save_json(STATE_DIR / "outreach.json", outreach)
    print("Dedup concluído.")


def run_score() -> None:
    ensure_state()
    opportunities = load_json(STATE_DIR / "opportunities.json", [])
    founders = load_json(STATE_DIR / "founders.json", [])

    for opp in opportunities:
        computed = score_opportunity(opp)
        opp["score"] = computed["score"]
        opp["tier"] = computed["tier"]
        opp.update({k: computed[k] for k in [
            "aderencia", "aderencia_segmento", "sinal_crescimento",
            "acessibilidade_decisor", "oportunidade_identificada", "potencial_financeiro",
        ] if k in computed})
    for founder in founders:
        computed = score_founder(founder)
        founder["score"] = computed["score"]
        founder["tier"] = computed["tier"]

    save_json(STATE_DIR / "opportunities.json", opportunities)
    save_json(STATE_DIR / "founders.json", founders)
    print("Scoring atualizado.")


def run_enrich() -> None:
    ensure_state()
    founders = load_json(STATE_DIR / "founders.json", [])
    companies = load_json(STATE_DIR / "companies.json", [])
    opportunities = load_json(STATE_DIR / "opportunities.json", [])
    socials = load_json(STATE_DIR / "social_radar.json", [])
    outreach = load_json(STATE_DIR / "outreach.json", [])

    enriched = enrich_companies(founders, companies, opportunities, socials, outreach)
    save_json(STATE_DIR / "companies_enriched.json", enriched)
    print("Enriquecimento concluído.")


def run_brief() -> None:
    ensure_state()
    founders = load_json(STATE_DIR / "founders.json", [])
    companies = load_json(STATE_DIR / "companies.json", [])
    opportunities = load_json(STATE_DIR / "opportunities.json", [])
    socials = load_json(STATE_DIR / "social_radar.json", [])
    outreach = load_json(STATE_DIR / "outreach.json", [])

    brief = generate_daily_brief(founders, companies, opportunities, socials, outreach)
    print(brief)


def run_cycle() -> None:
    try:
        run_validate()
    except SystemExit:
        pass
    run_dedupe()
    run_score()
    run_enrich()
    run_brief()


def main() -> None:
    parser = argparse.ArgumentParser(description="Founder & Opportunity Radar")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("audit", help="Audita o perfil base")
    sub.add_parser("validate", help="Valida schemas dos state files")
    sub.add_parser("dedupe", help="Remove duplicatas")
    sub.add_parser("score", help="Recalcula scores")
    sub.add_parser("enrich", help="Enriquece companies com relacionamentos")
    sub.add_parser("brief", help="Gera daily brief")
    sub.add_parser("cycle", help="Executa ciclo completo: validate → dedupe → score → enrich → brief")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        raise SystemExit(0)

    cmd = {
        "audit": run_audit,
        "validate": run_validate,
        "dedupe": run_dedupe,
        "score": run_score,
        "enrich": run_enrich,
        "brief": run_brief,
        "cycle": run_cycle,
    }[args.command]
    cmd()


if __name__ == "__main__":
    main()
