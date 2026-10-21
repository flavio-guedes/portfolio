#!/usr/bin/env python3
import json, os, re
from datetime import datetime
from collections import Counter

HOME = os.path.expanduser("~")
FILA = os.path.join(HOME, "hermes/fila.json")
DISP = os.path.join(HOME, "hermes/disparos.json")
CTX  = os.path.join(HOME, "hermes/contexto.json")

def load(p, d=None):
    try:
        with open(p, encoding="utf-8") as f: return json.load(f)
    except: return d

def digitos(t): return re.sub(r"\D","",str(t or ""))

fila = load(FILA, {}) or {}
disp = load(DISP, []) or []
it = fila.get("itens", [])

por_tel = {}
for x in disp:
    t = digitos(x.get("telefone"))
    if t: por_tel.setdefault(t, []).append(x)

ja_contatados = set(por_tel.keys())
ag = [i for i in it if i["status"]=="AGENDADO"]
ag_novos = [i for i in ag if digitos(i.get("telefone")) not in ja_contatados]
ag_antigos = [i for i in ag if digitos(i.get("telefone")) in ja_contatados]

print("═══ ANÁLISE OFFLINE ═══")
print(f"  fila total:      {len(it)}")
print(f"  disparos:        {len(disp)}")
print(f"  já contatados:   {len(ja_contatados)}")
print()
print(f"  AGENDADOS: {len(ag)}")
print(f"    · nunca contatados: {len(ag_novos)}")
print(f"    · já contatados:    {len(ag_antigos)}")
print()
c = Counter(i["status"] for i in it)
print("  por status:")
for k,v in c.most_common(): print(f"    {k:12s} {v}")
print()
dias = Counter((x.get("quando") or "")[:10] for x in disp if x.get("quando"))
print("  envios por dia:")
for k,v in sorted(dias.items()): print(f"    {k}  {v}")
print()
if ag:
    ag.sort(key=lambda x: x.get("prazo",""))
    print("  próximos 5:")
    for i in ag[:5]:
        t = digitos(i.get("telefone"))
        j = "✓" if t in ja_contatados else "novo"
        print(f"    {i['id']:5s} {i.get('prazo','?')[:16]:20s} {j:5s} {i.get('empresa','')[:30]:30s} {t}")

ctx = {}
for i in it:
    t = digitos(i.get("telefone"))
    if not t: continue
    ctx[t] = {"telefone": t, "nome": i.get("nome",""), "empresa": i.get("empresa",""),
              "ja_contatado": t in ja_contatados,
              "n_envios": len(por_tel.get(t, [])),
              "ultimo_envio": max((x.get("quando") for x in por_tel.get(t, [])), default=None),
              "status_fila": i["status"], "tipo": i.get("tipo","novo"),
              "etapa": i.get("etapa","D0")}
with open(CTX,"w",encoding="utf-8") as f:
    json.dump(ctx, f, ensure_ascii=False, indent=2)
print()
print(f"  ✓ contexto salvo ({len(ctx)} leads)")
