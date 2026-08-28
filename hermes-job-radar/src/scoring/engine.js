import { scoringConfig } from '../../scoring.config.js';
import { seniorityScoreMap, classifyRecency, priorityModality } from '../domain/job.js';
import { matchProfile } from '../profile/profile.js';

export function buildOpportunityScore(job, profile) {
  const senioridade = seniorityScoreMap[job.seniority] ?? 0;
  const recencia = recencyScore(job);
  const modalidade = modalityScore(job);
  const aderencia = matchProfile(job, profile).score;
  const area = areaScore(job);
  const qualidade = Number(job.quality ?? 70);
  const empresa = Number(job.quality ?? 70) >= 85 ? 90 : Number(job.quality ?? 70) >= 75 ? 75 : 55;
  const candidatura = candidaturaScore(job);

  const weights = scoringConfig.weights;
  const weighted =
    (senioridade * weights.senioridade +
      recencia * weights.recencia +
      modalidade * weights.modalidade +
      aderencia * weights.aderencia +
      area * weights.area +
      qualidade * weights.qualidade +
      empresa * weights.empresa +
      candidatura * weights.candidatura) /
    Object.values(weights).reduce((a, b) => a + b, 0);

  const score = Math.round(Math.max(0, Math.min(100, weighted)));
  const reasons = matchProfile(job, profile).reasons;

  return {
    score,
    matchPercent: score,
    matchReasons: reasons,
    components: {
      senioridade,
      recencia,
      modalidade,
      aderencia,
      area,
      qualidade,
      empresa,
      candidatura
    }
  };
}

function recencyScore(job) {
  const minutes = computeJobAgeMinutes(job);
  if (minutes <= 10) return 100;
  if (minutes <= 60) return 78;
  if (minutes <= 24 * 60) return 55;
  return 28;
}

function modalityScore(job) {
  const rank = priorityModality(job.modality);
  if (rank === 0) return 100;
  if (rank === 1) return 72;
  return 44;
}

function areaScore(job) {
  const title = `${job.title} ${job.area} ${job.tags.join(' ')}`.toLowerCase();
  if (/design|product design/.test(title)) return 100;
  if (/produto|product/.test(title)) return 88;
  if (/marketing|conteúdo|comunicação|comunicacao|copywriter|redator/.test(title)) return 90;
  if (/projetos|project/.test(title)) return 82;
  if (/agile|agil|scrum|sprint|kanban/.test(title)) return 84;
  return 60;
}

function candidaturaScore(job) {
  if (job.applied) return 100;
  if (job.saved) return 74;
  return 50;
}

function computeJobAgeMinutes(job) {
  const postedAt = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedAt)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - postedAt) / 60000));
}
