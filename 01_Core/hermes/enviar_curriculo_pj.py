import csv, os, smtplib, ssl, time, sys, getpass
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
CSV = os.path.expanduser("~/hermes/curriculo_pj_mestre.csv")
LOG = os.path.expanduser("~/hermes/enviados_curriculo_pj.log")
REM = "flavioguedesmkt@gmail.com"
INT = 60
def enviado(e):
    return os.path.exists(LOG) and any(l.startswith(e+",") for l in open(LOG))
def logar(e,s):
    open(LOG,"a").write(f"{e},{datetime.now().isoformat()},{s}\n")
rows = list(csv.DictReader(open(CSV, encoding="utf-8")))
pend = [r for r in rows if r["email"] and not enviado(r["email"])]
print(f"Total: {len(rows)} | Ja enviados: {len(rows)-len(pend)} | Pendentes: {len(pend)}")
print(f"Cadencia: {INT}s (~{len(pend)*INT//60} min)")
if not pend: sys.exit(0)
senha = getpass.getpass("Senha de app Gmail: ").replace(" ","")
ctx = ssl.create_default_context()
srv = smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx)
srv.login(REM, senha)
print("SMTP ok. Iniciando...\n")
okc=errc=0
for i,r in enumerate(pend,1):
    try:
        m=MIMEMultipart(); m["From"]=f"Flavio Guedes <{REM}>"; m["To"]=r["email"]; m["Subject"]=r["assunto"]
        m.attach(MIMEText(r["corpo"],"plain","utf-8"))
        srv.send_message(m); logar(r["email"],"OK"); okc+=1
        print(f"[{i}/{len(pend)}] OK -> {r[\"email\"]}")
    except Exception as e:
        logar(r["email"],f"ERRO:{e}"); errc+=1
        print(f"[{i}/{len(pend)}] ERRO -> {r[\"email\"]}: {e}")
    if i < len(pend): time.sleep(INT)
srv.quit()
print(f"\nFIM: {okc} ok, {errc} erros. Log: {LOG}")
