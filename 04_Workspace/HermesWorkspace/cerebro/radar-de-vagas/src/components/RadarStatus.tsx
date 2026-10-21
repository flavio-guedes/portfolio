import type { RadarStats } from '../types/opportunity';

interface RadarStatusProps {
  stats: RadarStats;
}

export function RadarStatus({ stats }: RadarStatusProps) {
  return (
    <div className="status-panel">
      <div className="status-header">RADAR ATIVO</div>
      <div className="status-grid">
        <div className="status-item">
          <span className="status-label">Vagas analisadas</span>
          <span className="status-value">{stats.vagasAnalisadas}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Publicações analisadas</span>
          <span className="status-value">{stats.publicacoesAnalisadas}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Oportunidades únicas</span>
          <span className="status-value">{stats.encontradas}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Qualificadas</span>
          <span className="status-value">{stats.qualificadas}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Heads</span>
          <span className="status-value">{stats.heads}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Remotas</span>
          <span className="status-value">{stats.remotas}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Híbridas</span>
          <span className="status-value">{stats.hibridas}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Presenciais</span>
          <span className="status-value">{stats.presenciais}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Contatos diretos</span>
          <span className="status-value">{stats.contatosDiretos}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Top matches</span>
          <span className="status-value">{stats.topMatches}</span>
        </div>
      </div>
    </div>
  );
}
