import type { NetworkContact } from '../types/network';

interface NetworkCardProps {
  contact: NetworkContact;
  score: number;
  level: string;
}

export function NetworkCard({ contact, score, level }: NetworkCardProps) {
  return (
    <article className="network-card">
      <div className="network-card__header">
        <div>
          <h3 className="network-card__name">{contact.name}</h3>
          <p className="network-card__role">{contact.role}</p>
          <p className="network-card__company">{contact.company}</p>
        </div>
        <span className="network-badge network-badge--level">{level}</span>
      </div>

      <div className="network-card__body">
        <div className="network-card__row">
          <span className="network-label">Relação</span>
          <span className="network-value">{contact.relationship}</span>
        </div>
        <div className="network-card__row">
          <span className="network-label">Vaga relacionada</span>
          <span className="network-value">{contact.relatedJobId ? 'Sim' : 'Não'}</span>
        </div>
        <div className="network-card__row">
          <span className="network-label">Motivo</span>
          <span className="network-value">{contact.reason}</span>
        </div>
      </div>

      <div className="network-card__footer">
        <span className="network-score">⭐ Score: {score}</span>
        <a className="button button-link" href={contact.contactUrl} target="_blank" rel="noreferrer">
          VER PERFIL
        </a>
      </div>
    </article>
  );
}
