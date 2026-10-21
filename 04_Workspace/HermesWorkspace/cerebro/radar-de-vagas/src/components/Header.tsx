import { jobsTodasUrl, postsTodasUrl } from '../data/radarConfig';
import type { SearchMode } from '../types/opportunity';

interface HeaderProps {
  mode: SearchMode;
  ultimaAtualizacao: string;
}

export function Header({ mode, ultimaAtualizacao }: HeaderProps) {
  const allUrl = mode === 'jobs' ? jobsTodasUrl : postsTodasUrl;
  const allLabel = mode === 'jobs' ? 'TODAS AS VAGAS' : 'TODAS AS PUBLICAÇÕES';

  return (
    <header className="header">
      <div className="header-top">
        <div className="brand">
          <div className="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div>
            <h1>RADAR DE VAGAS</h1>
            <p className="subtitle">Oportunidades profissionais em tempo real</p>
          </div>
        </div>

        <a className="button button-ghost" href={allUrl} target="_blank" rel="noreferrer">
          {allLabel}
        </a>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">🔥 HEADS</span>
          <span className="stat-value">{/* placeholder */}</span>
        </div>
        <div className="stat">
          <span className="stat-label">🎯 OPORTUNIDADES</span>
          <span className="stat-value">{/* placeholder */}</span>
        </div>
        <div className="stat">
          <span className="stat-label">🌎 REMOTAS</span>
          <span className="stat-value">{/* placeholder */}</span>
        </div>
        <div className="stat">
          <span className="stat-label">⚡ ATUALIZAÇÃO</span>
          <span className="stat-value">{ultimaAtualizacao}</span>
        </div>
      </div>
    </header>
  );
}
