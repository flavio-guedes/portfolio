#!/usr/bin/env python3
import http.server, socketserver, subprocess, json, pathlib, urllib.request, time, os, traceback

HOME = pathlib.Path.home()
PROXY_LOG  = HOME/'.config/litellm/proxy.log'
AGENT_LOG  = pathlib.Path('/tmp/hermes-agent.log')
BRIDGE_LOG = pathlib.Path('/tmp/hermes-bridge.log')

def sh(c):
    try: return subprocess.run(c, shell=True, capture_output=True, text=True, timeout=5).stdout
    except: return ''
def port(p):
    try:
        L = sh('lsof -nP -iTCP:%d -sTCP:LISTEN 2>/dev/null' % p).strip().splitlines()
        if len(L) < 2: return None
        pid = L[1].split()[1]
        i = sh('ps -o rss=,etimes=,command= -p %s' % pid).strip().split(None, 2)
        return {'pid': pid, 'rss': i[0] if i else '0',
                'up': i[1] if len(i)>1 else '0',
                'cmd': i[2] if len(i)>2 else '?'}
    except: return None
def url(u, t=3):
    try:
        with urllib.request.urlopen(u, timeout=t) as r: return r.read().decode('utf-8','ignore')
    except: return None
def tail(p, n=400):
    try: return p.read_text(errors='ignore').splitlines()[-n:]
    except: return []
def esc(s):
    return (str(s).replace('&','&amp;').replace('<','&lt;')
                   .replace('>','&gt;').replace('"','&quot;').replace("'",'&#39;'))
def mb(b):
    try: return '%.0f MB'%(int(b)/1024)
    except: return '?'
def up_fmt(s):
    try: s=int(s)
    except: return '?'
    if s<60: return '%ds'%s
    if s<3600: return '%dm'%(s//60)
    return '%dh%dm'%(s//3600,(s%3600)//60)

SERVICOS = [
    ('litellm','LiteLLM','Maître',4000,'Proxy OpenAI-compat','Recebe pedido do salão',PROXY_LOG,'server'),
    ('agent','Agent','Chef',8422,'Orquestrador WhatsApp→LLM','Lê pedido · decide prato',AGENT_LOG,'bolt'),
    ('bridge','Bridge','Garçom',8421,'Snapshot/envio WhatsApp','Leva prato pra mesa',BRIDGE_LOG,'arrow'),
    ('wahook','WA-Hook','Porta-voz',8787,'Baileys sender','Canal WhatsApp',None,'msg'),
    ('ollama','Ollama','Fogão',11434,'Runtime local de modelos','Cozinha sem internet',None,'flame'),
]
FORNECEDORES = [
    ('groq','Groq','Groq · rápido','GROQ_API_KEY','Mercado rápido','bolt'),
    ('nvidia','NVIDIA NIM','NVIDIA · pesado','NVIDIA_API_KEY','Mercado pesado','mountain'),
    ('openrouter','OpenRouter','OpenRouter · reserva','OPENROUTER_API_KEY','Mercado reserva','dice'),
    ('openai','OpenAI','OpenAI','OPENAI_API_KEY','Mercado OpenAI','circle'),
    ('google','Google','Google','GOOGLE_API_KEY','Mercado Google','hexagon'),
    ('anthropic','Anthropic','Anthropic','ANTHROPIC_API_KEY','Mercado Anthropic','diamond'),
]

def build():
    now = time.strftime('%H:%M:%S')
    ativos = 0; sv_map = {}
    for sid,t,cz,p,dt,dc,logp,ic in SERVICOS:
        info = port(p); ok = info is not None
        if ok: ativos += 1
        sv_map[sid] = {'id':sid,'nome_tec':t,'nome_cz':cz,'porta':p,'icone':ic,
            'desc_tec':dt,'desc_cz':dc,'online':ok,
            'pid':info['pid'] if info else '—',
            'rss':mb(info['rss']) if info else '—',
            'uptime':up_fmt(info['up']) if info else '—',
            'cmd':info['cmd'] if info else '—',
            'log_path':str(logp) if logp else None}

    ml = []
    if url('http://127.0.0.1:4000/health/liveliness'):
        t = url('http://127.0.0.1:4000/v1/models')
        if t:
            try: ml = [m['id'] for m in json.loads(t).get('data',[])]
            except: pass

    env_map = {}
    f = HOME/'.hermes_env'
    if f.exists():
        for l in f.read_text(errors='ignore').splitlines():
            if l.startswith('export ') and '=' in l:
                k,v = l[7:].split('=',1)
                env_map[k.strip()] = v.strip().strip('"').strip("'")
    prov_map = {}
    for pid_,tec,coz,key,desc_cz,ic in FORNECEDORES:
        v = os.environ.get(key) or env_map.get(key,'')
        prov_map[pid_] = {'id':pid_,'nome_tec':tec,'nome_cz':coz,'icone':ic,
            'env':key,'online':bool(v),
            'chave':(v[:10]+'…'+v[-4:]) if v else '—','tamanho':len(v),'desc_cz':desc_cz}

    pl = tail(PROXY_LOG, 500)
    S = {'posts':sum(1 for l in pl if 'POST /v1/chat/completions' in l),
         'ok200':sum(1 for l in pl if ' 200 OK' in l),
         'e400': sum(1 for l in pl if ' 400 ' in l and 'HTTP/1.1' in l),
         'e401': sum(1 for l in pl if ' 401 ' in l and 'HTTP/1.1' in l),
         'e429': sum(1 for l in pl if ' 429 ' in l and 'HTTP/1.1' in l),
         'e500': sum(1 for l in pl if ' 500 ' in l and 'HTTP/1.1' in l)}
    total = len(SERVICOS)
    if ativos == total and len(ml) >= 10:
        ac='#6ee7a5'; t_tec='OPERACIONAL'; t_cz='COZINHA RODANDO'
    elif ativos >= 3:
        ac='#f2c94c'; t_tec='DEGRADADO'; t_cz='PARCIAL'
    else:
        ac='#f27a7a'; t_tec='CRÍTICO'; t_cz='COZINHA PARADA'
    s_tec = '%d/%d · %d modelos · %d POSTs' % (ativos, total, len(ml), S['posts'])
    if S['e429']: s_tec += ' · %d×429' % S['e429']
    if S['e500']: s_tec += ' · %d×500' % S['e500']

    dados = json.dumps({'sv':sv_map,'pv':prov_map,'ml':ml,'stats':S,
        'servicos':[{'id':s[0],'nome_tec':s[1],'nome_cz':s[2],'porta':s[3],'icone':s[7]} for s in SERVICOS],
        'ativos':ativos,'total':total,'ml_n':len(ml),'now':now,
        't_tec':t_tec,'t_cz':t_cz,'s_tec':s_tec,'ac':ac}, ensure_ascii=False)

    CSS = r"""
:root{
 --bg:#0b0c0e;
 --s1:rgba(26,28,32,.55);
 --s2:rgba(36,39,44,.6);
 --st:rgba(255,255,255,.05);
 --st2:rgba(255,255,255,.11);
 --t1:#cfd3da; --t2:#90959f; --t3:#61656e; --t4:#3e4149;
 --ok:#6ee7a5; --warn:#f2c94c; --err:#f27a7a;
 --g1:linear-gradient(135deg,#b6bcc6 0%,#8b909a 50%,#6c7079 100%);
 --g2:linear-gradient(90deg,rgba(140,145,155,.4),rgba(90,95,105,.4),rgba(70,74,82,.4));
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',system-ui,sans-serif;
 background:var(--bg); color:var(--t1); font-size:15px; line-height:1.5;
 -webkit-font-smoothing:antialiased; font-feature-settings:"ss01","cv11";}
#bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.bl{position:absolute;inset:-25%;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.bl1{background:
 radial-gradient(circle at 22% 18%,rgba(130,136,148,.10),transparent 48%),
 radial-gradient(circle at 78% 82%,rgba(80,86,96,.10),transparent 52%),
 radial-gradient(circle at 55% 45%,rgba(110,116,128,.06),transparent 55%);}
.bl2{background-image:
 linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),
 linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);
 background-size:60px 60px;
 mask-image:radial-gradient(ellipse at center,black 20%,transparent 82%);
 -webkit-mask-image:radial-gradient(ellipse at center,black 20%,transparent 82%);}
.nz{position:absolute;inset:0;opacity:.028;
 background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");}
main{position:relative;z-index:1;height:100vh;display:flex;flex-direction:column;padding:14px 18px;gap:11px}

/* HEADER */
.hd{display:flex;align-items:center;gap:16px;padding:11px 20px;border-radius:14px;
 background:var(--s1);backdrop-filter:blur(24px) saturate(150%);
 border:1px solid var(--st);position:relative;flex-shrink:0;overflow:hidden}
.hd::before{content:'';position:absolute;inset:0;border-radius:14px;padding:1px;
 background:var(--g2);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
 -webkit-mask-composite:xor;mask-composite:exclude;opacity:.4;pointer-events:none}
.hd::after{content:'';position:absolute;top:0;left:-40%;width:40%;height:100%;
 background:linear-gradient(90deg,transparent,rgba(180,190,205,.07),transparent);
 animation:shimmer 8s ease-in-out infinite;pointer-events:none}
@keyframes shimmer{0%,100%{left:-40%}50%{left:120%}}
.hd .brand{display:flex;align-items:center;gap:12px}
.hd .logo{width:32px;height:32px;border-radius:9px;
 background:linear-gradient(135deg,#3a3e46,#22252a);
 border:1px solid var(--st2);display:flex;align-items:center;justify-content:center;
 color:var(--t2);transition:transform .3s}
.hd .logo:hover{transform:rotate(-6deg) scale(1.05)}
.hd h1{font-size:18px;font-weight:800;letter-spacing:.6px;
 background:linear-gradient(135deg,#e4e8ee 0%,#8c919c 100%);
 -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.hd .tag{font-size:10.5px;font-weight:700;letter-spacing:1.6px;color:var(--t3);text-transform:uppercase}
.hd .pill{margin-left:auto;display:flex;align-items:center;gap:10px;padding:6px 15px;border-radius:999px;
 background:var(--s2);border:1px solid var(--st2);font-size:12px}
.hd .dot{width:8px;height:8px;border-radius:50%;box-shadow:0 0 10px currentColor;
 animation:pulse 2.2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.9)}}
.tg{display:flex;gap:3px;padding:3px;border-radius:999px;background:rgba(0,0,0,.4);border:1px solid var(--st)}
.tg button{background:transparent;color:var(--t2);border:0;padding:6px 13px;border-radius:999px;
 font-size:11px;font-weight:700;letter-spacing:.5px;cursor:pointer;text-transform:uppercase;
 transition:.25s;font-family:inherit;display:inline-flex;align-items:center;gap:6px}
.tg button:hover{color:var(--t1)}
.tg button.on{background:linear-gradient(135deg,#c8d0db,#9aa3b0);color:#14161a;
 box-shadow:0 2px 12px rgba(160,170,190,.2)}

/* TABS */
.tabs{display:flex;gap:3px;padding:6px;border-radius:12px;background:var(--s1);
 backdrop-filter:blur(24px) saturate(150%);border:1px solid var(--st);
 flex-shrink:0;overflow-x:auto;position:relative}
.tabs::before{content:'';position:absolute;inset:0;border-radius:12px;padding:1px;
 background:var(--g2);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
 -webkit-mask-composite:xor;mask-composite:exclude;opacity:.3;pointer-events:none}
.tabs::-webkit-scrollbar{height:0}
.tb{display:flex;align-items:center;gap:8px;padding:9px 16px;border-radius:9px;
 font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;
 color:var(--t2);cursor:pointer;white-space:nowrap;transition:.2s;
 background:transparent;border:1px solid transparent;font-family:inherit;position:relative}
.tb:hover{color:var(--t1);background:rgba(255,255,255,.04)}
.tb.on{color:#14161a;background:linear-gradient(135deg,#c8d0db 0%,#9aa3b0 100%);
 box-shadow:0 2px 14px rgba(160,170,190,.18)}
.tb .bd{background:rgba(255,255,255,.16);color:inherit;font-size:10px;
 padding:2px 7px;border-radius:8px;font-weight:800;letter-spacing:0;min-width:18px;text-align:center}
.tb.on .bd{background:rgba(0,0,0,.22)}
.tb .ico{color:currentColor;opacity:.85}

/* PANEL */
.pn{flex:1;min-height:0;border-radius:14px;background:var(--s1);
 backdrop-filter:blur(24px) saturate(150%);border:1px solid var(--st);
 padding:16px 18px;display:flex;flex-direction:column;min-height:0;position:relative;overflow:hidden}
.pn::before{content:'';position:absolute;inset:0;border-radius:14px;padding:1px;
 background:var(--g2);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
 -webkit-mask-composite:xor;mask-composite:exclude;opacity:.3;pointer-events:none}
.pn h2{font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;
 color:var(--t3);margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-shrink:0}
.pn h2::before{content:'';width:3px;height:14px;border-radius:2px;background:var(--g1)}
.pb{flex:1;min-height:0;overflow-y:auto;padding-right:8px;scroll-behavior:smooth}
.pb::-webkit-scrollbar{width:8px}
.pb::-webkit-scrollbar-track{background:transparent}
.pb::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:4px}
.pb::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.18)}

/* ANIMAÇÕES */
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.anim{animation:fadeUp .35s ease both}
.anim-1{animation-delay:.04s}
.anim-2{animation-delay:.08s}
.anim-3{animation-delay:.12s}
.anim-4{animation-delay:.16s}
.anim-5{animation-delay:.20s}

/* HINT (explicação do modo cozinha) */
.hint{background:rgba(255,255,255,.02);border:1px solid var(--st);
 border-radius:12px;padding:14px 16px;margin-bottom:14px;display:flex;gap:14px;
 align-items:flex-start}
.hint .hi{width:28px;height:28px;flex-shrink:0;border-radius:8px;
 background:rgba(255,255,255,.05);border:1px solid var(--st2);
 display:flex;align-items:center;justify-content:center;color:var(--t2)}
.hint .hb{flex:1;min-width:0}
.hint .ht{font-size:13px;font-weight:800;color:var(--t1);margin-bottom:4px;letter-spacing:.3px}
.hint .hd{font-size:13px;color:var(--t2);line-height:1.55;margin-bottom:8px}
.hint .htips{display:flex;flex-direction:column;gap:5px}
.hint .tip{font-size:12.5px;color:var(--t3);display:flex;gap:8px;align-items:flex-start}
.hint .tip::before{content:'';width:4px;height:4px;border-radius:50%;
 background:var(--t3);margin-top:8px;flex-shrink:0}

/* OVERVIEW */
.ov{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;min-height:100%}
.ovc{display:flex;flex-direction:column;gap:12px;min-height:0}
.ovk{background:rgba(255,255,255,.02);border:1px solid var(--st);
 border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:7px;
 transition:transform .3s cubic-bezier(.2,.8,.2,1),border-color .3s,background .3s;
 will-change:transform;position:relative;overflow:hidden}
.ovk:hover{border-color:var(--st2);background:rgba(255,255,255,.035)}
.ovk .t{font-size:11px;font-weight:800;letter-spacing:1.3px;color:var(--t3);
 text-transform:uppercase;display:flex;align-items:center;gap:8px}
.ovk .t .ico{color:var(--t2)}
.ovk .v{font-size:30px;font-weight:800;font-family:ui-monospace,'SF Mono',Menlo,monospace;
 letter-spacing:-1px;color:var(--t1);line-height:1}
.ovk .s{font-size:12.5px;color:var(--t3)}
.ovk.ok .v{color:var(--ok)} .ovk.warn .v{color:var(--warn)} .ovk.err .v{color:var(--err)}
.ms{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.msi{background:rgba(255,255,255,.02);border:1px solid var(--st);
 border-radius:9px;padding:9px 11px;text-align:center;transition:.2s}
.msi:hover{background:rgba(255,255,255,.05);border-color:var(--st2)}
.msi .n{font-size:18px;font-weight:800;font-family:ui-monospace,monospace;color:var(--t1);line-height:1.1}
.msi .l{font-size:10px;font-weight:700;letter-spacing:1px;color:var(--t3);
 text-transform:uppercase;margin-top:3px}
.msi.ok .n{color:var(--ok)} .msi.warn .n{color:var(--warn)} .msi.err .n{color:var(--err)}

/* TABELAS */
.tbl{width:100%;border-collapse:collapse;font-size:14px}
.tbl th{text-align:left;font-size:11px;font-weight:800;letter-spacing:1.2px;
 text-transform:uppercase;color:var(--t3);padding:0 14px 11px 0;border-bottom:1px solid var(--st)}
.tbl td{padding:13px 14px 13px 0;border-bottom:1px solid var(--st);vertical-align:middle;color:var(--t1)}
.tbl tr:last-child td{border-bottom:0}
.tbl tr.cl{cursor:pointer;transition:.2s}
.tbl tr.cl:hover{background:rgba(255,255,255,.03)}
.tbl .nm{font-weight:700;color:var(--t1);display:flex;align-items:center;gap:11px;font-size:14.5px}
.tbl .nm .ico{color:var(--t2);flex-shrink:0}
.tbl .sb{font-size:12px;color:var(--t3);margin-top:3px;padding-left:31px}
.tbl .mo{font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:12.5px;color:var(--t2)}
.sts{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;
 font-size:10.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase}
.sts.on{background:rgba(110,231,165,.1);color:#a6f0c6;border:1px solid rgba(110,231,165,.24)}
.sts.off{background:rgba(242,122,122,.1);color:#f8a8a8;border:1px solid rgba(242,122,122,.24)}
.sts .dot{width:6px;height:6px;border-radius:50%;background:currentColor;
 box-shadow:0 0 6px currentColor;animation:pulse 2.2s ease-in-out infinite}
.tbl .ch{color:var(--t3);text-align:right;transition:.2s}
.tbl tr.cl:hover .ch{color:var(--t1);transform:translateX(3px)}

/* TILES */
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:11px}
.tl{background:rgba(255,255,255,.02);border:1px solid var(--st);
 border-radius:12px;padding:14px 15px;transition:transform .3s cubic-bezier(.2,.8,.2,1),
 border-color .3s,background .3s;cursor:pointer;position:relative;overflow:hidden;
 will-change:transform}
.tl:hover{background:rgba(255,255,255,.045);border-color:var(--st2)}
.tl .ico{position:absolute;top:13px;right:14px;color:var(--t3);opacity:.7;transition:.25s}
.tl:hover .ico{color:var(--t2);opacity:1;transform:scale(1.08)}
.tl .n{font-size:13.5px;font-weight:700;color:var(--t1);margin-bottom:5px;
 font-family:ui-monospace,'SF Mono',Menlo,monospace;word-break:break-all;padding-right:26px;line-height:1.4}
.tl .sb{font-size:12px;color:var(--t3)}
.tl.on{border-left:3px solid var(--ok)}
.tl.off{border-left:3px solid var(--err);opacity:.55}

/* LOG */
.lb{background:rgba(0,0,0,.35);border:1px solid var(--st);border-radius:11px;
 padding:14px;font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:12px;
 line-height:1.65;overflow-y:auto;height:100%;color:var(--t2);
 scroll-behavior:smooth}
.lb::-webkit-scrollbar{width:8px}
.lb::-webkit-scrollbar-track{background:transparent}
.lb::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:4px}
.lb::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.18)}
.ll{padding:1.5px 0;white-space:pre-wrap;word-break:break-all;animation:fadeIn .3s both}
.ll.ok{color:#a6f0c6} .ll.err{color:#f8a8a8} .ll.warn{color:#f5db8a}

/* DETALHE */
.dt{display:flex;flex-direction:column;gap:16px;min-height:100%}
.dth{display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid var(--st)}
.dtb{background:rgba(255,255,255,.04);border:1px solid var(--st);color:var(--t2);
 width:36px;height:36px;border-radius:10px;cursor:pointer;
 display:flex;align-items:center;justify-content:center;transition:.2s;font-family:inherit}
.dtb:hover{background:rgba(255,255,255,.09);color:var(--t1);border-color:var(--st2);transform:translateX(-2px)}
.dtt{flex:1;min-width:0;display:flex;align-items:center;gap:13px}
.dtt .ico{color:var(--t2);flex-shrink:0}
.dtt .k{font-size:10.5px;font-weight:800;letter-spacing:1.3px;color:var(--t3);text-transform:uppercase}
.dtt .v{font-size:19px;font-weight:800;color:var(--t1);margin-top:2px;word-break:break-all}
.dg{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:11px}
.dr{background:rgba(255,255,255,.02);border:1px solid var(--st);
 border-radius:11px;padding:12px 14px;transition:.2s}
.dr:hover{background:rgba(255,255,255,.035);border-color:var(--st2)}
.dr .k{font-size:10.5px;font-weight:800;letter-spacing:1.2px;color:var(--t3);
 text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:7px}
.dr .k .ico{color:var(--t3)}
.dr .v{font-size:13.5px;color:var(--t1);font-family:ui-monospace,'SF Mono',Menlo,monospace;
 word-break:break-all;line-height:1.55}
.dr .v.big{font-size:16px;font-weight:700}
.da{display:flex;gap:9px;flex-wrap:wrap}
.bt{padding:9px 16px;border-radius:9px;border:1px solid var(--st);
 background:rgba(255,255,255,.035);color:var(--t2);font-size:11.5px;font-weight:700;
 letter-spacing:.5px;text-transform:uppercase;cursor:pointer;transition:.2s;
 font-family:inherit;display:inline-flex;align-items:center;gap:8px}
.bt:hover{background:rgba(255,255,255,.08);color:var(--t1);border-color:var(--st2);transform:translateY(-1px)}
.bt.pr{background:linear-gradient(135deg,#c8d0db,#9aa3b0);color:#14161a;border:0}
.bt.pr:hover{background:linear-gradient(135deg,#d8e0eb,#aab3c0);box-shadow:0 4px 16px rgba(160,170,190,.2)}

/* FOOTER */
.ft{display:flex;align-items:center;gap:14px;padding:9px 20px;border-radius:12px;
 background:var(--s1);backdrop-filter:blur(24px) saturate(150%);
 border:1px solid var(--st);flex-shrink:0;font-size:12px;color:var(--t3);position:relative}
.ft::before{content:'';position:absolute;inset:0;border-radius:12px;padding:1px;
 background:var(--g2);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
 -webkit-mask-composite:xor;mask-composite:exclude;opacity:.3;pointer-events:none}
.ft .it{display:flex;align-items:center;gap:7px}
.ft .dot{width:7px;height:7px;border-radius:50%;background:var(--t3);transition:.3s}
.ft .dot.ok{background:var(--ok);box-shadow:0 0 8px var(--ok)}
.ft .dot.off{background:var(--err);box-shadow:0 0 8px var(--err)}
.ft .sep{color:var(--t4)}
.ft .mo{font-family:ui-monospace,'SF Mono',Menlo,monospace;color:var(--t2)}
.ft .rt{margin-left:auto;display:flex;gap:14px;align-items:center}

.empty{color:var(--t3);font-style:italic;padding:24px;text-align:center;font-size:13.5px}
"""

    JS = r"""
;(function(){
  var D = __DADOS__;

  // ---- ICONS (SVG minimalistas) ----
  var ICO = {
    eye:'<circle cx="12" cy="12" r="3"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    stack:'<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
    plug:'<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5"/>',
    doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    server:'<rect x="2" y="3" width="20" height="7" rx="2"/><rect x="2" y="14" width="20" height="7" rx="2"/><path d="M6 6.5h.01M6 17.5h.01"/>',
    bolt:'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    mountain:'<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    dice:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="8" r="1"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="12" cy="12" r="1"/>',
    circle:'<circle cx="12" cy="12" r="9"/>',
    diamond:'<path d="M12 2 22 12 12 22 2 12z"/>',
    hexagon:'<path d="M12 2 21 7v10l-9 5-9-5V7z"/>',
    msg:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    back:'<path d="M19 12H5M11 18l-6-6 6-6"/>',
    refresh:'<path d="M21 2v6h-6M3 22v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L21 8M21 15a9 9 0 0 1-14.85 3.36L3 16"/>',
    play:'<path d="m6 3 14 9-14 9z"/>',
    info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    chev:'<path d="m9 18 6-6-6-6"/>',
    clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    mem:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9zM2 9h2M2 12h2M2 15h2M20 9h2M20 12h2M20 15h2M9 2v2M12 2v2M15 2v2M9 20v2M12 20v2M15 20v2"/>',
    key:'<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    ruler:'<path d="M21.3 8.7 15.3 2.7a1 1 0 0 0-1.4 0L2.7 13.9a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0L21.3 10a1 1 0 0 0 0-1.4z"/><path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2"/>',
    route:'<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    warn:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'
  };
  function ICO_(name, size){
    var p = ICO[name] || ICO.circle;
    size = size || 16;
    return '<svg class="ico" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" '+
      'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '+
      'stroke-linejoin="round">'+p+'</svg>';
  }

  var TABS = {
    tec:[
      {id:'geral',    ic:'eye',    l:'Visão Geral'},
      {id:'servicos', ic:'gear',   l:'Serviços',   fn:function(){return D.ativos;}},
      {id:'modelos',  ic:'stack',  l:'Modelos',    fn:function(){return D.ml_n;}},
      {id:'provs',    ic:'plug',   l:'Provedores'},
      {id:'logs',     ic:'doc',    l:'Logs'},
      {id:'testes',   ic:'target', l:'Testes'}
    ],
    cz:[
      {id:'geral',    ic:'eye',    l:'Salão'},
      {id:'servicos', ic:'gear',   l:'Postos',   fn:function(){return D.ativos;}},
      {id:'modelos',  ic:'stack',  l:'Cardápio', fn:function(){return D.ml_n;}},
      {id:'provs',    ic:'plug',   l:'Mercados'},
      {id:'logs',     ic:'doc',    l:'Diários'},
      {id:'testes',   ic:'target', l:'Provar'}
    ]
  };
  var KIND = {
    tec:{sv:'SERVIÇO', pv:'PROVEDOR', md:'MODELO', lg:'LOG'},
    cz: {sv:'POSTO',   pv:'MERCADO',  md:'CHEF',   lg:'DIÁRIO'}
  };

  // ---- HINTS (explicação no modo cozinha) ----
  var HINT_CZ = {
    geral: {
      t: 'O que você está vendo',
      d: 'Esta é a visão de salão. Mostra em um relance quantos postos estão de pé, quantos chefs estão disponíveis no cardápio e como foi o movimento recente.',
      tips: [
        'Se "Postos de pé" estiver baixo, vá em Postos para ver quem caiu.',
        'Se "Cardápio" estiver vazio, o Maître não consegue atender pedidos.',
        'A coluna da direita mostra as últimas movimentações do Maître.'
      ]
    },
    servicos: {
      t: 'Os postos da cozinha',
      d: 'Cada linha é um posto que precisa estar funcionando para o fluxo andar. O ponto colorido diz se está de pé ou parado agora mesmo.',
      tips: [
        'Clique em qualquer linha para ver comandos, RAM, uptime e o diário.',
        'Posto parado não trava tudo — o resto da cadeia continua rodando.',
        'Dica: se o Chef estiver parado, os pedidos do WhatsApp param.'
      ]
    },
    modelos: {
      t: 'Os chefs do cardápio',
      d: 'Cada card é um "chef" (modelo de IA) que pode preparar um pedido. O Maître escolhe entre eles automaticamente conforme o perfil do pedido.',
      tips: [
        'Clique num card para testar na hora e ver a resposta ao vivo.',
        'Se um chef estiver lento, o Maître chama outro (isso é o fallback).',
        'Cardápio cheio = mais opções e maior resiliência.'
      ]
    },
    provs: {
      t: 'Os mercados fornecedores',
      d: 'São os fornecedores externos de IA. A cozinha recorre a eles quando precisa de um ingrediente que não tem em casa (ex: modelos pesados, modelos rápidos).',
      tips: [
        'Verde = mercado com chave configurada e pronto pra usar.',
        'Cinza = sem chave — os pedidos caem para outro automaticamente.',
        'Você não precisa fazer nada: o fallback cuida disso.'
      ]
    },
    logs: {
      t: 'Os diários de cada posto',
      d: 'Cada posto escreve o que fez nas últimas horas. É onde você acompanha o que está acontecendo em tempo real.',
      tips: [
        'Linha verde = operação bem-sucedida (pedido entregue).',
        'Linha vermelha = erro (pedido inválido, sem chave).',
        'Linha amarela = pausa temporária (mercado pediu pra esperar).',
        'Clique no título de um diário para ver tudo expandido.'
      ]
    },
    testes: {
      t: 'Provar um chef agora',
      d: 'Faça um pedido de teste para um chef específico e veja a resposta em tempo real. Útil para conferir se um modelo está respondendo antes de confiar nele.',
      tips: [
        'Escolha o chef no menu e clique em "Provar".',
        'O resultado mostra status, rota efetiva e a resposta.',
        'Se der erro, a rota pode ter caído para um chef alternativo.'
      ]
    }
  };

  var modo='tec', aba='geral', det=null;

  function isCoz(){ return modo === 'cz'; }
  function nome(o){ return isCoz() ? (o.nome_cz||o.nome_tec) : (o.nome_tec||o.nome_cz); }
  function E(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }
  function $(id){ return document.getElementById(id); }
  function setTxt(id, v){ var el=$(id); if (el) el.textContent = v; }
  function setHTML(id, v){ var el=$(id); if (el) el.innerHTML = v; }

  function renderHint(){
    if (!isCoz()) return '';
    var h = HINT_CZ[aba];
    if (!h) return '';
    var tips = '';
    for (var i=0;i<h.tips.length;i++) tips += '<div class="tip">'+E(h.tips[i])+'</div>';
    return '<div class="hint anim">'
      + '<div class="hi">'+ICO_('info', 16)+'</div>'
      + '<div class="hb">'
      +   '<div class="ht">'+E(h.t)+'</div>'
      +   '<div class="hd">'+E(h.d)+'</div>'
      +   '<div class="htips">'+tips+'</div>'
      + '</div></div>';
  }

  // ---- RENDER TABS ----
  function renderTabs(){
    var t = $('tabs'); if (!t) return;
    var lista = TABS[modo] || TABS.tec;
    var html = '';
    for (var i=0; i<lista.length; i++){
      var tab = lista[i];
      var on = tab.id === aba ? ' on' : '';
      var bd = '';
      try { if (tab.fn) bd = '<span class="bd">' + tab.fn() + '</span>'; } catch(e){}
      html += '<div class="tb'+on+'" data-tab="'+tab.id+'">'
            + ICO_(tab.ic, 15)
            + '<span>'+E(tab.l)+'</span>'+bd
            + '</div>';
    }
    t.innerHTML = html;
    var els = t.querySelectorAll('[data-tab]');
    for (var j=0; j<els.length; j++){
      els[j].onclick = (function(id){
        return function(){ aba = id; det = null; renderTabs(); render(); };
      })(els[j].getAttribute('data-tab'));
    }
  }

  // ---- RENDER MAIN ----
  function render(){
    var pt = $('ptitle'), pb = $('pbody');
    if (!pt || !pb) return;
    try {
      if (det){
        pt.innerHTML = ICO_(det.ic, 15) + ' ' + E(det.kind);
        pb.innerHTML = renderDetalhe();
      } else {
        var lista = TABS[modo] || TABS.tec;
        var tab = null;
        for (var i=0; i<lista.length; i++) if (lista[i].id===aba) tab = lista[i];
        if (!tab) { tab = lista[0]; aba = tab.id; }
        pt.innerHTML = ICO_(tab.ic, 15) + ' ' + E(tab.l);
        var hint = renderHint();
        var content = '';
        if (aba==='geral')          content = viewGeral();
        else if (aba==='servicos')  content = viewServicos();
        else if (aba==='modelos')   content = viewModelos();
        else if (aba==='provs')     content = viewProvs();
        else if (aba==='logs')      content = viewLogs();
        else if (aba==='testes')    content = viewTestes();
        pb.innerHTML = hint + content;
        animarCards();
      }
      setTimeout(carregarLogs, 40);
      setTimeout(parallaxCards, 80);
    } catch(err){
      pb.innerHTML = '<div class="empty">Erro no render: '+E(err && err.message || err)+'</div>';
      console.error(err);
    }
  }

  function animarCards(){
    var els = document.querySelectorAll('.ovk, .msi, .dr, .tl');
    for (var i=0;i<els.length;i++){
      els[i].classList.add('anim');
      els[i].style.animationDelay = (0.03*i).toFixed(2)+'s';
    }
  }

  // ---- VIEWS ----
  function viewGeral(){
    var S = D.stats;
    var svOn = 0;
    for (var i=0;i<D.servicos.length;i++) if (D.sv[D.servicos[i].id].online) svOn++;
    var svTot = D.servicos.length;
    var pOn=0, pTot=0;
    for (var k in D.pv){ pTot++; if (D.pv[k].online) pOn++; }
    var c1 = svOn===svTot ? 'ok' : (svOn>=3 ? 'warn' : 'err');
    var c3 = pOn===pTot ? 'ok' : 'warn';
    return '<div class="ov">'
      + '<div class="ovc">'
      +   '<div class="ovk '+c1+'"><div class="t">'+ICO_('gear',14)+(isCoz()?'Postos de pé':'Serviços ativos')+'</div>'
      +     '<div class="v">'+svOn+'<span style="font-size:16px;color:var(--t3)">/'+svTot+'</span></div>'
      +     '<div class="s">'+(isCoz()?'cozinha operando':'infraestrutura viva')+'</div></div>'
      +   '<div class="ovk"><div class="t">'+ICO_('stack',14)+(isCoz()?'Chefs no cardápio':'Modelos disponíveis')+'</div>'
      +     '<div class="v">'+D.ml_n+'</div>'
      +     '<div class="s">'+(isCoz()?'prontos pra preparar':'fallback em cascata')+'</div></div>'
      +   '<div class="ovk '+c3+'"><div class="t">'+ICO_('plug',14)+(isCoz()?'Mercados ativos':'Provedores')+'</div>'
      +     '<div class="v">'+pOn+'<span style="font-size:16px;color:var(--t3)">/'+pTot+'</span></div>'
      +     '<div class="s">'+(isCoz()?'com chave':'chaves em ambiente')+'</div></div>'
      + '</div>'
      + '<div class="ovc">'
      +   '<div class="ovk" style="flex:1"><div class="t">'+ICO_('grid',14)+(isCoz()?'Movimento recente':'Requisições')+'</div>'
      +     '<div class="ms">'
      +       '<div class="msi"><div class="n">'+S.posts+'</div><div class="l">'+(isCoz()?'Pedidos':'POSTs')+'</div></div>'
      +       '<div class="msi ok"><div class="n">'+S.ok200+'</div><div class="l">'+(isCoz()?'Entregues':'200')+'</div></div>'
      +       '<div class="msi warn"><div class="n">'+S.e429+'</div><div class="l">'+(isCoz()?'Pausas':'429')+'</div></div>'
      +       '<div class="msi err"><div class="n">'+S.e400+'</div><div class="l">400</div></div>'
      +       '<div class="msi err"><div class="n">'+S.e401+'</div><div class="l">401</div></div>'
      +       '<div class="msi err"><div class="n">'+S.e500+'</div><div class="l">500</div></div>'
      +     '</div></div>'
      +   '<div class="ovk"><div class="t">'+ICO_('route',14)+(isCoz()?'Fluxo':'Pipeline')+'</div>'
      +     '<div class="s" style="font-family:ui-monospace,monospace;font-size:12px;line-height:1.85;color:var(--t2)">'
      +       'WhatsApp → Bridge :8421<br>'
      +       'Agent :8422 → LiteLLM :4000<br>'
      +       'Groq · NVIDIA · OpenRouter · Ollama'
      +     '</div></div>'
      + '</div>'
      + '<div class="ovc">'
      +   '<div class="ovk" style="flex:1"><div class="t">'+ICO_('doc',14)+(isCoz()?'Últimos eventos':'Últimas do proxy')+'</div>'
      +     '<div class="lb" style="max-height:none;height:100%;padding:10px;margin-top:8px">'
      +       '<div class="ll" data-lf="litellm" data-ln="8">carregando…</div>'
      +     '</div></div>'
      + '</div>'
      + '</div>';
  }

  function viewServicos(){
    var r = '';
    for (var i=0;i<D.servicos.length;i++){
      var s = D.servicos[i];
      var inf = D.sv[s.id];
      var cls = inf.online ? 'on' : 'off';
      var txt = inf.online ? (isCoz()?'de pé':'online') : (isCoz()?'parado':'offline');
      r += '<tr class="cl" data-det="sv" data-key="'+s.id+'">'
        + '<td><div class="nm">'+ICO_(inf.icone,18)+E(nome(inf))+'</div>'
        +     '<div class="sb">'+E(isCoz()?inf.desc_cz:inf.desc_tec)+'</div></td>'
        + '<td><span class="mo">:'+s.porta+'</span></td>'
        + '<td><span class="sts '+cls+'"><span class="dot"></span>'+txt+'</span></td>'
        + '<td><span class="mo">'+E(inf.pid)+'</span></td>'
        + '<td><span class="mo">'+E(inf.rss)+'</span></td>'
        + '<td><span class="mo">'+E(inf.uptime)+'</span></td>'
        + '<td class="ch">'+ICO_('chev',16)+'</td></tr>';
    }
    return '<table class="tbl">'
      + '<tr><th>'+(isCoz()?'Posto':'Serviço')+'</th><th>Porta</th><th>Estado</th>'
      + '<th>PID</th><th>RAM</th><th>Uptime</th><th></th></tr>'
      + r + '</table>';
  }

  function viewModelos(){
    if (!D.ml.length) return '<div class="empty">'+(isCoz()?'cardápio vazio':'nenhum modelo')+'</div>';
    var h = '<div class="tiles">';
    for (var i=0;i<D.ml.length;i++){
      var m = D.ml[i];
      h += '<div class="tl on" data-det="md" data-key="'+E(m)+'">'
        + ICO_('stack',18)
        + '<div class="n">'+E(m)+'</div>'
        + '<div class="sb">'+(isCoz()?'chef disponível':'model group')+'</div>'
        + '</div>';
    }
    return h + '</div>';
  }

  function viewProvs(){
    var h = '<div class="tiles">';
    for (var k in D.pv){
      var p = D.pv[k];
      h += '<div class="tl '+(p.online?'on':'off')+'" data-det="pv" data-key="'+p.id+'">'
        + ICO_(p.icone,18)
        + '<div class="n">'+E(nome(p))+'</div>'
        + '<div class="sb">'+(p.online?E(p.chave):(isCoz()?'sem chave':'não configurado'))+'</div>'
        + '</div>';
    }
    return h + '</div>';
  }

  function viewLogs(){
    var svs = [
      {id:'litellm', tec:'LiteLLM :4000', cz:'Maître :4000', ic:'server'},
      {id:'agent',   tec:'Agent :8422',   cz:'Chef :8422',   ic:'bolt'},
      {id:'bridge',  tec:'Bridge :8421',  cz:'Garçom :8421', ic:'arrow'}
    ];
    var h = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px;height:100%;min-height:0">';
    for (var i=0;i<svs.length;i++){
      var s = svs[i];
      var nm = isCoz()?s.cz:s.tec;
      h += '<div style="display:flex;flex-direction:column;min-height:0">'
        + '<div style="font-size:11.5px;font-weight:800;letter-spacing:1.2px;color:var(--t3);'
        + 'text-transform:uppercase;margin-bottom:9px;cursor:pointer;display:flex;align-items:center;gap:8px" '
        + 'data-det="lg" data-key="'+s.id+'">'
        + ICO_(s.ic,15) + E(nm)
        + '<span style="margin-left:auto;color:var(--t4)">'+ICO_('chev',14)+'</span></div>'
        + '<div class="lb" style="flex:1"><div class="ll" data-lf="'+s.id+'" data-ln="60">carregando…</div></div>'
        + '</div>';
    }
    return h + '</div>';
  }

  function viewTestes(){
    var o = '';
    for (var i=0;i<D.ml.length;i++) o += '<option value="'+E(D.ml[i])+'">'+E(D.ml[i])+'</option>';
    if (!o) o = '<option value="perfil-principal">perfil-principal</option>';
    return '<div style="display:flex;flex-direction:column;gap:16px;max-width:820px">'
      + '<div class="dr"><div class="k">'+ICO_('target',14)+(isCoz()?'Provar um prato':'Testar modelo')+'</div>'
      +   '<div style="display:flex;gap:11px;margin-top:12px;flex-wrap:wrap">'
      +   '<select id="t-model" style="flex:1;min-width:240px;padding:11px 14px;border-radius:10px;'
      +   'background:rgba(0,0,0,.32);border:1px solid var(--st);color:var(--t1);'
      +   'font-family:ui-monospace,monospace;font-size:13.5px;outline:none">'+o+'</select>'
      +   '<button class="bt pr" data-act="testar">'+ICO_('play',14)
      +   (isCoz()?'Provar':'Executar')+'</button>'
      +   '</div></div>'
      + '<div class="dr" style="flex:1;display:flex;flex-direction:column;min-height:0">'
      +   '<div class="k">'+ICO_('upload',14)+'Resultado</div>'
      +   '<div class="lb" id="t-result" style="margin-top:10px;flex:1;min-height:200px">aguardando…</div>'
      + '</div></div>';
  }

  function renderDetalhe(){
    var t = det.tipo, k = det.key, body = '';
    if (t==='sv'){
      var s = D.sv[k]; if (!s) return '<div class="empty">serviço '+E(k)+' não encontrado</div>';
      var cls = s.online?'on':'off';
      var txt = s.online?(isCoz()?'de pé':'online'):(isCoz()?'parado':'offline');
      body = '<div class="dt">'
        + '<div class="dth">'
        +   '<button class="dtb" data-act="voltar">'+ICO_('back',16)+'</button>'
        +   '<div class="dtt">'+ICO_(s.icone,26)
        +     '<div><div class="k">'+E(det.kind)+'</div><div class="v">'+E(nome(s))+'</div></div></div>'
        +   '<span class="sts '+cls+'"><span class="dot"></span>'+txt+'</span>'
        + '</div>'
        + '<div class="dg">'
        +   '<div class="dr"><div class="k">'+ICO_('plug',12)+'Porta</div><div class="v big">:'+s.porta+'</div></div>'
        +   '<div class="dr"><div class="k">'+ICO_('grid',12)+'PID</div><div class="v">'+E(s.pid)+'</div></div>'
        +   '<div class="dr"><div class="k">'+ICO_('mem',12)+'RAM</div><div class="v">'+E(s.rss)+'</div></div>'
        +   '<div class="dr"><div class="k">'+ICO_('clock',12)+(isCoz()?'Ligado há':'Uptime')+'</div><div class="v">'+E(s.uptime)+'</div></div>'
        +   '<div class="dr" style="grid-column:1/-1"><div class="k">'+ICO_('info',12)
        +     (isCoz()?'Função':'Descrição')+'</div><div class="v">'+E(isCoz()?s.desc_cz:s.desc_tec)+'</div></div>'
        +   '<div class="dr" style="grid-column:1/-1"><div class="k">'+ICO_('gear',12)+'Comando</div>'
        +     '<div class="v">'+E(s.cmd||'—')+'</div></div>'
        + '</div>'
        + '<div class="da">'
        +   '<button class="bt" data-act="voltar">'+ICO_('back',14)+'Voltar</button>'
        +   (s.log_path ? '<button class="bt" data-det="lg" data-key="'+k+'">'+ICO_('doc',14)+'Ver log</button>' : '')
        + '</div>'
        + '<div class="dr" style="flex:1;display:flex;flex-direction:column;min-height:0">'
        +   '<div class="k">'+ICO_('doc',12)+(isCoz()?'Diário recente':'Últimas linhas')+'</div>'
        +   '<div class="lb" style="margin-top:10px;flex:1;min-height:200px">'
        +     '<div class="ll" data-lf="'+k+'" data-ln="40">carregando…</div>'
        +   '</div></div>'
        + '</div>';
    }
    else if (t==='pv'){
      var p = D.pv[k]; if (!p) return '<div class="empty">provedor '+E(k)+' não encontrado</div>';
      body = '<div class="dt">'
        + '<div class="dth">'
        +   '<button class="dtb" data-act="voltar">'+ICO_('back',16)+'</button>'
        +   '<div class="dtt">'+ICO_(p.icone,26)
        +     '<div><div class="k">'+E(det.kind)+'</div><div class="v">'+E(nome(p))+'</div></div></div>'
        +   '<span class="sts '+(p.online?'on':'off')+'"><span class="dot"></span>'
        +     (p.online?(isCoz()?'ativo':'configurado'):(isCoz()?'sem chave':'não configurado'))+'</span>'
        + '</div>'
        + '<div class="dg">'
        +   '<div class="dr" style="grid-column:1/-1"><div class="k">'+ICO_('key',12)+'Variável</div>'
        +     '<div class="v">'+E(p.env)+'</div></div>'
        +   '<div class="dr"><div class="k">'+ICO_('lock',12)+'Chave</div><div class="v">'+E(p.chave)+'</div></div>'
        +   '<div class="dr"><div class="k">'+ICO_('ruler',12)+'Tamanho</div><div class="v">'+p.tamanho+' chars</div></div>'
        +   (isCoz()?'<div class="dr" style="grid-column:1/-1"><div class="k">'+ICO_('target',12)+'Papel</div>'
        +     '<div class="v">'+E(p.desc_cz)+'</div></div>':'')
        + '</div>'
        + '<div class="da"><button class="bt" data-act="voltar">'+ICO_('back',14)+'Voltar</button></div>'
        + '</div>';
    }
    else if (t==='md'){
      body = '<div class="dt">'
        + '<div class="dth">'
        +   '<button class="dtb" data-act="voltar">'+ICO_('back',16)+'</button>'
        +   '<div class="dtt">'+ICO_('stack',26)
        +     '<div><div class="k">'+E(det.kind)+'</div><div class="v">'+E(k)+'</div></div></div>'
        +   '<span class="sts on"><span class="dot"></span>'+(isCoz()?'disponível':'registrado')+'</span>'
        + '</div>'
        + '<div class="dg">'
        +   '<div class="dr" style="grid-column:1/-1"><div class="k">'+ICO_('plug',12)
        +     (isCoz()?'Como pedir':'Endpoint')+'</div><div class="v">POST /v1/chat/completions</div></div>'
        +   '<div class="dr" style="grid-column:1/-1"><div class="k">'+ICO_('ruler',12)
        +     (isCoz()?'Campo chef':'Campo model')+'</div><div class="v">'+E(k)+'</div></div>'
        +   '<div class="dr" style="grid-column:1/-1"><div class="k">'+ICO_('route',12)+'Fallback</div>'
        +     '<div class="v">router_settings.fallbacks</div></div>'
        + '</div>'
        + '<div class="da">'
        +   '<button class="bt pr" data-act="testarDet" data-key="'+E(k)+'">'+ICO_('play',14)
        +     (isCoz()?'Provar agora':'Testar agora')+'</button>'
        +   '<button class="bt" data-act="voltar">'+ICO_('back',14)+'Voltar</button>'
        + '</div>'
        + '<div class="dr" style="flex:1;display:flex;flex-direction:column;min-height:0">'
        +   '<div class="k">'+ICO_('upload',12)+'Resultado</div>'
        +   '<div class="lb" id="md-result" style="margin-top:10px;flex:1;min-height:170px">'
        +     'clique em provar / testar</div></div>'
        + '</div>';
    }
    else if (t==='lg'){
      var s2 = D.sv[k]; if (!s2) return '<div class="empty">log '+E(k)+' não encontrado</div>';
      body = '<div class="dt">'
        + '<div class="dth">'
        +   '<button class="dtb" data-act="voltar">'+ICO_('back',16)+'</button>'
        +   '<div class="dtt">'+ICO_('doc',26)
        +     '<div><div class="k">'+E(det.kind)+'</div><div class="v">'+E(nome(s2))+'</div></div></div>'
        + '</div>'
        + '<div class="lb" style="flex:1;min-height:400px">'
        +   '<div class="ll" data-lf="'+k+'" data-ln="150">carregando…</div>'
        + '</div>'
        + '<div class="da">'
        +   '<button class="bt" data-act="voltar">'+ICO_('back',14)+'Voltar</button>'
        +   '<button class="bt" data-act="recarregar">'+ICO_('refresh',14)+'Atualizar</button>'
        + '</div></div>';
    }
    return body;
  }

  // ---- LOG FETCH ----
  function carregarLogs(){
    var els = document.querySelectorAll('[data-lf]');
    for (var i=0; i<els.length; i++){
      (function(el){
        var sid = el.getAttribute('data-lf');
        var n = el.getAttribute('data-ln') || 40;
        var sv = D.sv[sid];
        var path = sv && sv.log_path;
        if (!path){ el.textContent = '— sem log'; return; }
        var q = '/log?path=' + encodeURIComponent(path) + '&n=' + n + '&pretty=' + (isCoz()?'1':'0');
        fetch(q).then(function(r){ return r.text(); }).then(function(t){
          var lines = t.split('\n').filter(function(x){return x.length;});
          if (!lines.length){ el.textContent = '— vazio'; return; }
          var html = '';
          for (var j=0;j<lines.length;j++){
            var l = lines[j], c = '';
            if (l.indexOf('200 OK')>=0 || l.indexOf('entregue')>=0) c='ok';
            else if (l.indexOf(' 400 ')>=0 || l.indexOf(' 401 ')>=0 || l.indexOf(' 500 ')>=0) c='err';
            else if (l.indexOf(' 429 ')>=0) c='warn';
            html += '<div class="ll '+c+'">'+E(l)+'</div>';
          }
          if (el.parentNode) el.parentNode.innerHTML = html;
        }).catch(function(){ el.textContent = '— erro ao ler'; });
      })(els[i]);
    }
  }

  // ---- ACTIONS ----
  function abrir(tipo, key){
    var ic = 'circle';
    if (tipo==='sv' && D.sv[key]) ic = D.sv[key].icone;
    if (tipo==='pv' && D.pv[key]) ic = D.pv[key].icone;
    if (tipo==='md') ic = 'stack';
    if (tipo==='lg') ic = 'doc';
    var kk = (KIND[modo] && KIND[modo][tipo]) || tipo;
    det = {tipo:tipo, key:key, kind:kk, ic:ic};
    render();
  }
  function voltar(){ det = null; render(); }
  function recarregar(){ if (det){ var d = det; det = null; abrir(d.tipo, d.key); } }

  function testar(){
    var sel = $('t-model'); if (!sel) return;
    var m = sel.value;
    var el = $('t-result'); if (!el) return;
    el.textContent = 'enviando para ' + m + '…';
    fetch('/test?model=' + encodeURIComponent(m))
      .then(function(r){ return r.json(); })
      .then(function(j){
        el.innerHTML = '<b style="color:#a6f0c6">status:</b> ' + E(j.status||'?') +
          '<br><b style="color:#a6f0c6">rota:</b> ' + E(j.model||'?') +
          '<br><b style="color:#a6f0c6">resposta:</b><br>' + E((j.text||'').slice(0,500));
      }).catch(function(e){ el.textContent = 'erro: ' + e; });
  }
  function testarDet(m){
    var el = $('md-result'); if (!el) return;
    el.textContent = 'enviando para ' + m + '…';
    fetch('/test?model=' + encodeURIComponent(m))
      .then(function(r){ return r.json(); })
      .then(function(j){
        el.innerHTML = '<b style="color:#a6f0c6">status:</b> ' + E(j.status||'?') +
          '<br><b style="color:#a6f0c6">rota:</b> ' + E(j.model||'?') +
          '<br><b style="color:#a6f0c6">resposta:</b><br>' + E((j.text||'').slice(0,500));
      }).catch(function(e){ el.textContent = 'erro: ' + e; });
  }

  // ---- MODE ----
  function setModo(m){
    if (m !== 'tec' && m !== 'cz') m = 'tec';
    modo = m;
    document.body.className = m;
    setTxt('ti', m==='cz' ? 'COZINHA' : 'HERMES OS');
    setTxt('tg', (m==='cz'?'PAINEL · ':'DASHBOARD · ') + D.now);
    setTxt('pt', m==='cz' ? D.t_cz : D.t_tec);
    setTxt('ps', D.s_tec);
    var pd = $('pd'); if (pd){ pd.style.background = D.ac; pd.style.color = D.ac; }
    var bt = $('bt'); if (bt) bt.className = m==='tec' ? 'on' : '';
    var bc = $('bc'); if (bc) bc.className = m==='cz'  ? 'on' : '';
    try { localStorage.setItem('hermes-modo-v3', m); } catch(e){}
    det = null;
    renderTabs();
    render();
    rodape();
  }

  function rodape(){
    function up(id, ok){ var el=$(id); if (el) el.className = 'dot ' + (ok?'ok':'off'); }
    up('fd-l', D.sv.litellm && D.sv.litellm.online);
    up('fd-a', D.sv.agent   && D.sv.agent.online);
    up('fd-b', D.sv.bridge  && D.sv.bridge.online);
    up('fd-o', D.sv.ollama  && D.sv.ollama.online);
    setTxt('fsv', D.ativos + '/' + D.total + (modo==='cz'?' postos':' serviços'));
    setTxt('fml', D.ml_n + (modo==='cz'?' chefs':' modelos'));
  }

  // ---- EVENT DELEGATION ----
  document.addEventListener('click', function(ev){
    var el = ev.target;
    while (el && el !== document.body){
      if (el.getAttribute){
        var act = el.getAttribute('data-act');
        if (act){
          ev.preventDefault();
          if (act==='voltar') voltar();
          else if (act==='recarregar') recarregar();
          else if (act==='testar') testar();
          else if (act==='testarDet') testarDet(el.getAttribute('data-key'));
          return;
        }
        var dt = el.getAttribute('data-det');
        if (dt){
          ev.preventDefault();
          abrir(dt, el.getAttribute('data-key'));
          return;
        }
      }
      el = el.parentNode;
    }
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && det) voltar();
  });

  var bt = $('bt'); if (bt) bt.onclick = function(){ setModo('tec'); };
  var bc = $('bc'); if (bc) bc.onclick = function(){ setModo('cz'); };

  // ---- BOOT ----
  var m = 'tec';
  try { m = localStorage.getItem('hermes-modo-v3') || 'tec'; } catch(e){}
  setModo(m);

  // ---- PARALLAX: bg layers ----
  var layers = document.querySelectorAll('[data-d]');
  var mx=.5,my=.5,cx=.5,cy=.5;
  document.addEventListener('mousemove', function(e){ mx=e.clientX/innerWidth; my=e.clientY/innerHeight; });
  function tick(){
    cx+=(mx-cx)*.055; cy+=(my-cy)*.055;
    var dx=cx-.5, dy=cy-.5;
    for (var i=0;i<layers.length;i++){
      var d = parseFloat(layers[i].getAttribute('data-d')) || 0;
      layers[i].style.transform = 'translate(' + (dx*-d) + 'px,' + (dy*-d) + 'px)';
    }
    requestAnimationFrame(tick);
  }
  tick();

  // ---- PARALLAX: cards (tilt 3D) ----
  function parallaxCards(){
    var cards = document.querySelectorAll('.ovk, .tl, .dr');
    for (var i=0;i<cards.length;i++){
      (function(c){
        c.onmousemove = function(e){
          var r = c.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width  - .5;
          var y = (e.clientY - r.top)  / r.height - .5;
          c.style.transform = 'perspective(700px) rotateX(' + (-y*2.5) + 'deg) rotateY(' + (x*2.5) + 'deg) translateZ(0)';
        };
        c.onmouseleave = function(){ c.style.transform = ''; };
      })(cards[i]);
    }
  }
})();
""".replace('__DADOS__', dados)

    return ('<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">\n'
            '<title>Hermes OS</title><meta http-equiv="refresh" content="60">\n'
            '<style>' + CSS + '</style></head>\n'
            '<body id="body">\n'
            '<div id="bg"><div class="bl bl1" data-d="14"></div>'
            '<div class="bl bl2" data-d="24"></div><div class="nz"></div></div>\n'
            '<main>\n'
            ' <div class="hd">\n'
            '   <div class="brand">\n'
            '     <div class="logo" id="logo"></div>\n'
            '     <h1 id="ti">HERMES OS</h1>\n'
            '     <span class="tag" id="tg">DASHBOARD · ' + now + '</span>\n'
            '   </div>\n'
            '   <div class="pill">\n'
            '     <span class="dot" id="pd" style="background:' + ac + ';color:' + ac + '"></span>\n'
            '     <span id="pt">' + esc(t_tec) + '</span>\n'
            '     <span style="color:var(--t3);font-size:11px" id="ps">' + esc(s_tec) + '</span>\n'
            '   </div>\n'
            '   <div class="tg">\n'
            '     <button id="bt" class="on">TÉCNICO</button>\n'
            '     <button id="bc">COZINHA</button>\n'
            '   </div>\n'
            ' </div>\n'
            ' <div class="tabs" id="tabs"></div>\n'
            ' <div class="pn">\n'
            '   <h2 id="ptitle"></h2>\n'
            '   <div class="pb" id="pbody"></div>\n'
            ' </div>\n'
            ' <div class="ft">\n'
            '   <div class="it"><span class="dot" id="fd-l"></span> LiteLLM <span class="mo">:4000</span></div>\n'
            '   <span class="sep">│</span>\n'
            '   <div class="it"><span class="dot" id="fd-a"></span> Agent <span class="mo">:8422</span></div>\n'
            '   <span class="sep">│</span>\n'
            '   <div class="it"><span class="dot" id="fd-b"></span> Bridge <span class="mo">:8421</span></div>\n'
            '   <span class="sep">│</span>\n'
            '   <div class="it"><span class="dot" id="fd-o"></span> Ollama <span class="mo">:11434</span></div>\n'
            '   <div class="rt">\n'
            '     <span id="fsv">—</span><span class="sep">│</span>\n'
            '     <span id="fml">—</span><span class="sep">│</span>\n'
            '     <span class="mo" id="fhr">' + now + '</span>\n'
            '   </div>\n'
            ' </div>\n'
            '</main>\n'
            '<script>' + JS + '</script>\n'
            '</body></html>')

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        from urllib.parse import urlparse, parse_qs
        u = urlparse(self.path)
        try:
            if u.path == '/log':
                q = parse_qs(u.query)
                p = pathlib.Path(q.get('path',[''])[0])
                n = int(q.get('n',['60'])[0])
                pretty = q.get('pretty',['0'])[0] == '1'
                try:
                    p = p.resolve(); assert str(p).startswith(str(HOME))
                except Exception:
                    self.send_response(403); self.end_headers(); return
                lines = p.read_text(errors='ignore').splitlines()[-n:] if p.exists() else []
                if pretty:
                    TR = [('POST /v1/chat/completions','pedido → prato'),
                          ('GET /v1/models','cardápio'),('GET /health','checagem'),
                          (' 200 OK',' ✓ entregue'),(' 400 ',' ✗ inválido '),
                          (' 401 ',' ✗ sem chave '),(' 429 ',' ⏸ pausa '),
                          (' 500 ',' ✗ erro ')]
                    def tr(l):
                        for a,b in TR: l = l.replace(a,b)
                        return l
                    lines = [tr(l) for l in lines]
                txt = '\n'.join(lines)
                b = txt.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type','text/plain; charset=utf-8')
                self.send_header('Content-Length',str(len(b)))
                self.end_headers(); self.wfile.write(b); return
            if u.path == '/test':
                q = parse_qs(u.query)
                m = q.get('model',['perfil-principal'])[0]
                req = urllib.request.Request(
                    'http://127.0.0.1:4000/v1/chat/completions',
                    data=json.dumps({'model':m,'messages':[{'role':'user','content':'diga OK'}],'max_tokens':80}).encode(),
                    headers={'Content-Type':'application/json'})
                try:
                    with urllib.request.urlopen(req, timeout=30) as r:
                        d = json.loads(r.read())
                        msg = d.get('choices',[{}])[0].get('message',{})
                        txt = msg.get('content') or msg.get('reasoning_content') or ''
                        out = {'status':'200','model':d.get('model','?'),'text':txt[:400]}
                except Exception as e:
                    out = {'status':'erro','model':m,'text':str(e)[:300]}
                b = json.dumps(out, ensure_ascii=False).encode()
                self.send_response(200)
                self.send_header('Content-Type','application/json; charset=utf-8')
                self.send_header('Content-Length',str(len(b)))
                self.end_headers(); self.wfile.write(b); return
            b = build().encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type','text/html; charset=utf-8')
            self.send_header('Cache-Control','no-store')
            self.send_header('Content-Length',str(len(b)))
            self.end_headers(); self.wfile.write(b)
        except Exception:
            tb = traceback.format_exc()
            with open('/tmp/dashboard-err.log','a') as f: f.write(tb + '\n---\n')
            self.send_response(500)
            self.send_header('Content-Type','text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(('ERR\n'+tb).encode('utf-8'))
    def log_message(self,*a): pass

if __name__ == '__main__':
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(('127.0.0.1',9100),H) as s:
        print('Hermes OS · http://127.0.0.1:9100'); s.serve_forever()
