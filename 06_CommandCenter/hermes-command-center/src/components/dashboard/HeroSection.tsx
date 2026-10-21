'use client';


const sections = [
  { id: 'VISÃO GERAL', eyebrow: 'HERMES · AI OPERATIONS', headline: 'Inteligência para coordenar. Automação para executar.', supporting: 'Centralize agentes, missões, tarefas e operações em um único sistema inteligente.', cta: 'Ver operações' },
  { id: 'MISSÕES', eyebrow: 'OPERATIONS', headline: 'Transforme objetivos em execução.', supporting: 'Monitore missões, progresso e dependências em tempo real.', cta: 'Abrir missões' },
  { id: 'TAREFAS', eyebrow: 'EXECUTION', headline: 'Do planejamento à entrega.', supporting: 'Visualize tarefas por status, bloqueios e próxima ação.', cta: 'Abrir tarefas' },
  { id: 'PROJETOS', eyebrow: 'PROJECTS', headline: 'Tudo conectado. Nada perdido.', supporting: 'Acompanhe projetos, agentes, ferramentas e resultados.', cta: 'Abrir projetos' },
  { id: 'AGENTES', eyebrow: 'AGENTS', headline: 'Uma inteligência. Múltiplos agentes.', supporting: 'Gerencie execução, status e governança de cada agente.', cta: 'Abrir agentes' },
  { id: 'EVENTOS', eyebrow: 'TELEMETMETRY', headline: 'Cada ação. Um sinal de inteligência.', supporting: 'Log operacional, auditoria e rastreabilidade.', cta: 'Abrir eventos' },
];

export function HeroSection() {
  const active = sections[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-command-border bg-white p-6">
      <div className="relative z-10 max-w-2xl">
        <div className="text-[11px] font-semibold tracking-wide text-command-muted">{active.eyebrow}</div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-command-text">
          <span className="block">Inteligência para</span>
          <span className="block bg-clip-text text-transparent hero-gradient">coordenar.</span>
        </h1>
        <p className="mt-3 text-sm text-command-muted">{active.supporting}</p>
        <div className="mt-4 flex items-center gap-3">
          <button className="rounded-lg bg-command-text px-4 py-2 text-xs font-semibold text-white transition hover:bg-command-graphite">
            {active.cta}
          </button>
          <span className="inline-flex items-center gap-2 text-[11px] text-command-muted">
            <span className="status-dot status-dot-running" />
            SYSTEM ONLINE · 05 AGENTS ACTIVE
          </span>
        </div>
      </div>
      <div className="absolute right-4 top-4 hidden h-48 w-48 items-center justify-center md:flex">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-accent-violet/20 via-accent-blue/20 to-accent-cyan/20 blur-xl" />
          <img
            src="/hero-portrait.jpg"
            alt="Hermes portrait"
            className="relative h-48 w-48 rounded-full border border-command-border object-cover"
          />
        </div>
      </div>
    </div>
  );
}
