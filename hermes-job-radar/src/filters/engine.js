import { classifyRecency } from '../domain/job.js';

export function passesFilters(job, filters = {}) {
  if (!job) return false;

  if (filters.modalities?.length && !filters.modalities.includes(job.modality)) {
    return false;
  }

  if (filters.areas?.length) {
    const normalized = (job.title + ' ' + job.area + ' ' + job.tags.join(' ')).toLowerCase();
    const matchesArea = filters.areas.some((area) => normalized.includes(area.toLowerCase()));
    if (!matchesArea) return false;
  }

  if (filters.seniorities?.length && !filters.seniorities.includes(job.seniority)) {
    return false;
  }

  if (filters.recency && filters.recency !== 'ALL') {
    const recency = classifyRecency(job);
    if (filters.recency === 'LIVE' && recency !== 'LIVE') return false;
    if (filters.recency === 'FRESH' && !['LIVE', 'FRESH'].includes(recency)) return false;
    if (filters.recency === 'TODAY' && recency === 'OLDER') return false;
  }

  return true;
}
