import sys, subprocess
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from buscar_skill import escolher

def rodar(consulta, vars_):
    score, skill = escolher(consulta)
    if not skill:
        return f"❌ Nenhuma skill encontrada para: {consulta}"
    cmd = skill["executar"]
    for k, v in vars_.items():
        cmd = cmd.replace(f"${k}", v)
    print(f"▶️  {skill['name']} (score {score:.3f})")
    print(f"   {cmd}")
    r = subprocess.run(cmd, shell=True)
    return f"exit={r.returncode}"

if __name__ == "__main__":
    args = sys.argv[1:]
    consulta = "gera um video da apresentacao"
    md = args[0] if args else ""
    out = args[1] if len(args) > 1 else ""
    print(rodar(consulta, {"markdown": md, "saida": out}))
