#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Importa leads de CSV e adiciona na fila com cadência segura."""
import csv, json, os, re, sys, random
from datetime import datetime, timedelta

HOME = os.path.expanduser("~")
FILA = os.path.join(HOME, "hermes/fila.json")

def digitos(t): return re.sub(r"\D", "", str(t or ""))

def normalizar_tel(t):
    d = digitos(t)
    if len(d) == 11 and not d.startswith("55"):
        return "55" + d
    if len(d) == 13 and d.startswith("55"):
        return d
    if len(d) == 12 and d.startswith("55"):
        return d
    if len(d) == 10:
        return "55" + d[:2] + "9" + d[2:]
    return d

def main(csv_path):
    if not os.path.exists(csv_path):
        print(f"✗ arquivo não existe: {csv_path}")
        sys.exit(1)

    # detecta separador
    with open(csv_path, encoding="utf-8") as f:
        head = f.readline()
        sep = ";" if ";" in head else ("," if "," in head else "\t")

    d = json.load(open(FILA, encoding="utf-8"))
    ja = set(digitos(i.get("telefone")) for i in d["itens"])

    # cadência segura (regras)
    ult = max([datetime.strptime(i["prazo"], "%Y-%m-%d %H:%M:%S")
               for i in d["itens"] if i.get("status")=="AGENDADO" and i.get("prazo")],
              default=datetime.now() + timedelta(minutes=2))

    novos = 0
    pulados = 0
    idx = 0
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=sep)
        for row in reader:
            nome = (row.get("Nome") or "").strip()
            numero = (row.get("Numero") or "").strip()
            if not numero: continue
            tel = normalizar_tel(numero)
            if len(tel) < 12:
                pulados += 1; continue
            if tel in ja:
                pulados += 1; continue
            ja.add(tel)

            empresa = (row.get("Empresa") or "").strip() or nome or "sua empresa"
            cargo = (row.get("Cargo") or "").strip()
            dor = (row.get("Dor_Reclamacoes") or "").strip()
            msg_csv = (row.get("Mensagem_Adaptada") or "").strip()
            prio_txt = (row.get("Prioridade") or "Baixa").strip().lower()

            # próxima janela 9-20h
            if ult.hour >= 20:
                ult = (ult + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)
            elif ult.hour < 9:
                ult = ult.replace(hour=9, minute=0, second=0, microsecond=0)

            # prioridade para ordenação
            prio_num = {"alta": 0, "média": 1, "media": 1, "baixa": 2}.get(prio_txt, 2)

            # mensagem: usa a do CSV, senão gera contextual
            if msg_csv:
                msg = msg_csv
            elif dor and dor != "Não pesquisado":
                dor_curta = dor.split("|")[0].strip() if "|" in dor else dor
                msg = (f"Oi {nome.split()[0] if nome else 'tudo bem'}, tudo bem? "
                       f"Vi que a {empresa} teve algumas reclamações relacionadas a "
                       f"\"{dor_curta[:60]}\". Trabalho com automação comercial no WhatsApp "
                       f"que resolve exatamente isso — resposta imediata, follow-up automático "
                       f"e histórico organizado. Vale 15 min essa semana?")
            else:
                msg = (f"Oi {nome.split()[0] if nome else 'tudo bem'}, tudo bem? "
                       f"Vi que você está à frente da {empresa}. Trabalho com automação "
                       f"comercial no WhatsApp pra empresas que perdem lead por demora no "
                       f"atendimento. Faz sentido conversar 15 min?")

            d["itens"].append({
                "id": f"L{novos+1:03d}",
                "nome": nome,
                "empresa": empresa,
                "telefone": tel,
                "chatId": tel + "@s.whatsapp.net",
                "tipo": "base" if prio_num < 2 else "novo",
                "etapa": "D0",
                "mensagem": msg,
                "prazo": ult.strftime("%Y-%m-%d %H:%M:%S"),
                "status": "AGENDADO",
                "enviado_em": None,
                "erro": None,
                "cargo": cargo,
                "dor": dor[:200] if dor else "",
                "prioridade": row.get("Prioridade", "Baixa"),
                "prioridade_fila": prio_num,
                "origem": "csv_import"
            })
            novos += 1
            idx += 1
            # cadência 5-8min
            ult += timedelta(seconds=random.randint(300, 480))

    d["total"] = len(d["itens"])
    json.dump(d, open(FILA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    from collections import Counter
    c = Counter(i["status"] for i in d["itens"])
    print(f"═══ IMPORTAÇÃO ═══")
    print(f"  arquivo: {csv_path}")
    print(f"  ✓ {novos} novos leads adicionados")
    print(f"  ⊘ {pulados} pulados (sem número, formato inválido ou já existiam)")
    print(f"  fila total: {len(d['itens'])}")
    print(f"  status: {dict(c)}")
    if d["itens"]:
        ag = sorted([i for i in d["itens"] if i["status"]=="AGENDADO"], key=lambda x:x["prazo"])
        if ag:
            print(f"  próximo: {ag[0]['prazo']}  ({ag[0]['id']} {ag[0]['empresa'][:30]})")
            print(f"  último:  {ag[-1]['prazo']}  ({ag[-1]['id']} {ag[-1]['empresa'][:30]})")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("uso: python3 importar_csv.py <arquivo.csv>"); sys.exit(1)
    main(sys.argv[1])
