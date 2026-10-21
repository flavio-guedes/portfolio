import csv
from pathlib import Path
from datetime import datetime
from collections import Counter

SRC = Path('/Users/mac/repo-b2b/data/leads.csv')
DST = Path('/Users/mac/HermesWorkspace/central-prospeccao-whatsapp/data/leads.csv')
LIMIT = 50
LOG = Path('/Users/mac/HermesWorkspace/automacoes/logs/importacao_leads.log')

def normalizar_telefone(tel):
    tel = str(tel or '').strip()
    tel = tel.replace(' ','').replace('-','').replace('(','').replace(')','')
    if tel.startswith('+'):
        tel = tel[1:]
    return tel

def main():
    LIMIT = 50
    today = datetime.now().strftime('%Y-%m-%d')
    
    # leitura origem
    with SRC.open('r', encoding='utf-8', errors='ignore', newline='') as f:
        reader = csv.DictReader(f)
        src_rows = list(reader)

    # leitura destino
    dst_phones = set()
    if DST.exists():
        with DST.open('r', encoding='utf-8', errors='ignore', newline='') as f:
            reader = csv.reader(f)
            next(reader, None)
            for r in reader:
                if len(r) > 1:
                    dst_phones.add(normalizar_telefone(r[1]))

    importados = []
    vistos = Counter()
    
    for row in src_rows:
        if len(importados) >= LIMIT:
            break
        nome = (row.get('nome') or '').strip()
        contato = normalizar_telefone(row.get('contato'))
        if not nome or nome == '(não identificado)' or contato in dst_phones:
            continue
        if '99999' in contato or len(contato) < 8:
            continue
        if vistos[contato] > 0:
            continue
        vistos[contato] += 1
        
        importados.append({
          'nome': nome,
          'telefone': contato,
          'cargo': (row.get('cargo') or '').strip(),
          'empresa': (row.get('empresa') or '').strip(),
          'fonte': (row.get('fonte') or '').strip() or 'repo-b2b',
          'score': (row.get('qualidade') or '').strip(),
          'id_v2': '',
          'trecho': '',
          'terceiro': 'False',
          'data': today,
          'url': (row.get('data') or '').strip() if 'data' in row else ''
        })
    
    if not importados:
        LOG.parent.mkdir(parents=True, exist_ok=True)
        with LOG.open('a', encoding='utf-8') as f:
            f.write(f"{today} | nenhum lead novo para importar\n")
        print('nenhum lead novo')
        return

    # garantir header
    header = ['Nome','Telefone','Cargo','Empresa','Fonte','Score','ID_V2','trecho','terceiro','data','url','FLUXO','ETIQUETA','STATUS']
    if not DST.exists() or DST.read_text(encoding='utf-8', errors='ignore').strip() == '':
        with DST.open('w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(header)

    with DST.open('a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        for item in importados:
            writer.writerow([
              item['nome'], item['telefone'], item['cargo'], item['empresa'],
              item['fonte'], item['score'], item['id_v2'], item['trecho'],
              item['terceiro'], item['data'], item['url'],
              'FLUXO • CAPTAÇÃO', '🟢 01 • NOVO LEAD', 'NOVO LEAD'
            ])

    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open('a', encoding='utf-8') as f:
        f.write(f"{today} | importados: {len(importados)}\n")

    print('importados:', len(importados))
    for item in importados[:10]:
        print(item['nome'], '|', item['telefone'])

if __name__ == '__main__':
    main()
