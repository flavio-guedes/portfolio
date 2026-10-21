import type { JobOpportunity } from '../types/opportunity';

interface JobCardProps {
  job: JobOpportunity;
  score: number;
}

export function JobCard({ job, score }: JobCardProps) {
  const badgeNova = job.ageMinutes <= 5;
  const isHead = job.seniority === 'HEAD' || job.seniority === 'DIRETOR';
  const sourceLabel = job.source === 'linkedin_jobs' ? '💼 VAGA' : '📣 PUBLICAÇÃO';

  return (
    <article className={`job-card ${isHead ? 'job-card--head' : ''}`}>
      <div className="job-card__header">
        <div>
          <h3 className="job-card__title">{job.title}</h3>
          <p className="job-card__company">{job.company}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {badgeNova && <span className="badge badge--new">🔥 NOVA</span>}
          <span className="badge">{sourceLabel}</span>
        </div>
      </div>

      <div className="job-card__meta">
        <span className={`badge badge--${job.workMode.toLowerCase()}`}>{job.workMode}</span>
        <span className="job-card__time">⏱ Publicada há {job.ageMinutes} min</span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="job-card__status">{job.seniority}</span>
        <span className="job-card__status">{job.category}</span>
        <span className="job-card__status">{job.prioridade ?? '--'}</span>
      </div>

      {job.contact && (
        <div className="job-card__contact">📲 CONTATO DIRETO — {job.contact}</div>
      )}

      <div className="job-card__body">
        <div className="job-card__score">⭐ Score: {score}</div>
        <div className="job-card__recommendation">{job.recomendacao}</div>
        {!!job.motivos?.length && (
          <div className="job-card__motivos">
            <strong>Motivos:</strong> {job.motivos.join('; ')}
          </div>
        )}
        {!!job.lacunas?.length && (
          <div className="job-card__gaps">
            <strong>Lacunas:</strong> {job.lacunas.join('; ')}
          </div>
        )}
        {!!job.criterios && (
          <div className="job-card__criteria">
            <strong>Critérios:</strong> cargo {job.criterios.cargo} | responsabilidades {job.criterios.responsabilidades} | competências {job.criterios.competencias} | senioridade {job.criterios.senioridade} | modalidade/localização {job.criterios.modalidadeLocalizacao} | atualidade {job.criterios.atualidade}
          </div>
        )}
        {!!job.estrategiasEncontradas?.length && (
          <div className="job-card__strategies">
            <strong>Estratégias:</strong> {job.estrategiasEncontradas.join(', ')}
          </div>
        )}
      </div>

      <div className="job-card__footer">
        <span className="job-card__area">🎯 {job.category}</span>
        <a className="button button-link" href={job.url} target="_blank" rel="noreferrer">
          VER OPORTUNIDADE
        </a>
      </div>
    </article>
  );
}
