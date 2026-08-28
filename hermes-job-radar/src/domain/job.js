export function createNormalizedJob(raw = {}) {
  return {
    id: String(raw.id ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    source: String(raw.source ?? 'manual'),
    sourceId: String(raw.sourceId ?? raw.id ?? ''),
    title: String(raw.title ?? ''),
    company: String(raw.company ?? ''),
    area: String(raw.area ?? ''),
    seniority: normalizeSeniority(raw.seniority),
    modality: normalizeModality(raw.modality),
    location: String(raw.location ?? ''),
    salary: String(raw.salary ?? ''),
    url: String(raw.url ?? ''),
    description: String(raw.description ?? ''),
    postedAt: normalizeTimestamp(raw.postedAt),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    quality: clampNumber(raw.quality, 0, 100, 70),
    applicationUrl: String(raw.applicationUrl ?? raw.url ?? ''),
    applied: Boolean(raw.applied),
    saved: Boolean(raw.saved),
    ignored: Boolean(raw.ignored),
    stage: String(raw.stage ?? 'RADAR'),
    score: null,
    matchPercent: null,
    matchReasons: [],
    aiSummary: String(raw.aiSummary ?? '')
  };
}

export function normalizeSeniority(value) {
  const map = new Map([
    ['HEAD', 'HEAD'],
    ['HEAD OF', 'HEAD'],
    ['DIRECTOR', 'DIRETOR'],
    ['DIRETOR', 'DIRETOR'],
    ['DIRETORA', 'DIRETOR'],
    ['LEAD', 'LEAD'],
    ['LEADER', 'LEAD'],
    ['LEADERSHIP', 'LEAD'],
    ['EXECUTIVE', 'DIRETOR'],
    ['COORDENADOR', 'COORDENADOR'],
    ['COORDENADORA', 'COORDENADOR'],
    ['COORDINATOR', 'COORDENADOR'],
    ['SENIOR', 'SENIOR'],
    ['SÊNIOR', 'SENIOR'],
    ['SR', 'SENIOR'],
    ['PLENO', 'PLENO'],
    ['MID', 'PLENO'],
    ['INTERMEDIATE', 'PLENO'],
    ['JUNIOR', 'JUNIOR'],
    ['JÚNIOR', 'JUNIOR'],
    ['JR', 'JUNIOR'],
    ['TRAINEE', 'JUNIOR'],
    ['ESTÁGIO', 'JUNIOR'],
    ['ASSOCIATE', 'JUNIOR']
  ]);

  const normalized = String(value ?? '').trim().toUpperCase();
  return map.get(normalized) || normalized || 'JUNIOR';
}

export function normalizeModality(value) {
  const map = new Map([
    ['REMOTO', 'REMOTO'],
    ['REMOTE', 'REMOTO'],
    ['HÍBRIDO', 'HÍBRIDO'],
    ['HYBRID', 'HÍBRIDO'],
    ['PRESENCIAL', 'PRESENCIAL'],
    ['ONSITE', 'PRESENCIAL'],
    ['PRESENTIAL', 'PRESENCIAL']
  ]);

  const normalized = String(value ?? '').trim().toUpperCase();
  return map.get(normalized) || normalized || 'PRESENCIAL';
}

export function normalizeTimestamp(value) {
  const now = Date.now();
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).toISOString();
  if (typeof value === 'string' && value.trim().length > 0) return new Date(value.trim()).toISOString();
  return new Date(now - 6 * 60 * 1000).toISOString();
}

export function computeJobAgeMinutes(job) {
  const postedAt = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedAt)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - postedAt) / 60000));
}

export function classifyRecency(job) {
  const minutes = computeJobAgeMinutes(job);
  if (minutes <= 10) return 'LIVE';
  if (minutes <= 60) return 'FRESH';
  if (minutes <= 24 * 60) return 'TODAY';
  return 'OLDER';
}

export function priorityModality(modality) {
  if (modality === 'REMOTO') return 0;
  if (modality === 'HÍBRIDO') return 1;
  return 2;
}

export function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export const seniorityScoreMap = Object.freeze({
  HEAD: 100,
  DIRETOR: 90,
  LEAD: 80,
  COORDENADOR: 70,
  SENIOR: 60,
  PLENO: 45,
  JUNIOR: 30
});
