import os, sys, glob, json, yaml, urllib.request
from pathlib import Path

SKILLS_DIR = Path(__file__).parent

def embed(texto):
    payload = json.dumps({"model":"nomic-embed-text","prompt":texto}).encode()
    req = urllib.request.Request("http://localhost:11434/api/embeddings",
                                 data=payload, headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["embedding"]

def cosseno(a, b):
    import math
    dot = sum(x*y for x,y in zip(a,b))
    na = math.sqrt(sum(x*x for x in a)); nb = math.sqrt(sum(x*x for x in b))
    return dot/(na*nb) if na and nb else 0

def carregar():
    skills = []
    for f in glob.glob(str(SKILLS_DIR/"*.yaml")):
        with open(f) as fh:
            s = yaml.safe_load(fh); s["_arquivo"] = f; skills.append(s)
    return skills

def escolher(consulta):
    try:
        q = embed(consulta)
    except Exception:
        # Fallback por palavras-chave se Ollama off
        q = None
    ranking = []
    for s in carregar():
        if q:
            texto = f"{s['name']} {s.get('description','')} {s.get('quando_usar','')}"
            ranking.append((cosseno(q, embed(texto)), s))
        else:
            c = sum(1 for p in consulta.lower().split()
                    if p in (s.get("name","")+s.get("description","")+s.get("quando_usar","")).lower())
            ranking.append((c, s))
    ranking.sort(key=lambda x: -x[0])
    return ranking[0] if ranking and ranking[0][0] > 0.4 else (None, None)

if __name__ == "__main__":
    consulta = " ".join(sys.argv[1:]) or "gera um video da apresentacao"
    score, skill = escolher(consulta)
    if skill:
        print(f"SKILL={skill['name']}")
        print(f"SCORE={score:.3f}")
        print(f"EXEC={skill['executar'].strip()}")
    else:
        print("NENHUMA")
