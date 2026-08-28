import { ManualJobSource } from '../adapters/manual-source.js';
import { MockJobSource } from '../adapters/mock-source.js';
import { buildOpportunityScore } from '../scoring/engine.js';
import { createNormalizedJob, classifyRecency } from '../domain/job.js';
import { passesFilters } from '../filters/engine.js';
import { loadStore, saveStore, createEmptyStore } from '../storage/store.js';
import { defaultProfile } from '../profile/profile.js';

const FALLBACK_ORDER = [
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD'], modality: 'REMOTO' },
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD', 'COORDENADOR', 'SENIOR'], modality: 'REMOTO' },
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD'], modality: 'HÍBRIDO' },
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD', 'COORDENADOR', 'SENIOR'], modality: 'HÍBRIDO' },
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD'], modality: 'PRESENCIAL' },
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD', 'COORDENADOR', 'SENIOR'], modality: 'PRESENCIAL' }
];

function createSources() {
  return {
    manual: new ManualJobSource(),
    mock: new MockJobSource()
  };
}

export class RadarEngine {
  constructor() {
    this.sources = createSources();
    this.store = loadStore();
    this.profile = this.store.profile || defaultProfile;
  }

  async runHunt(options = {}) {
    const mode = options.mode || 'assistido';
    const sources = resolveSources(mode);
    const rawJobs = await collectRawJobs(sources, options);
    const normalized = normalizeJobs(rawJobs);
    const enriched = enrichedJobs(normalized, this.profile);
    const ranked = rankJobs(enriched);
    const filtered = applyRankedFilters(ranked, options.filters);
    const live = prioritizeLive(filtered);

    const selected = selectTop(live);

    this.store.jobs = mergeJobs(this.store.jobs, selected);
    this.store.meta = {
      lastRunAt: new Date().toISOString(),
      runCount: (this.store.meta?.runCount || 0) + 1,
      mode,
      analyzed: rawJobs.length,
      selected: selected.length
    };
    saveStore(this.store);

    return {
      mode,
      analyzed: rawJobs.length,
      selected,
      store: this.store
    };
  }

  getTopJobs(filters = {}) {
    const ranked = rankJobs(enrichedJobs(this.store.jobs, this.profile));
    const filtered = applyRankedFilters(ranked, filters);
    return selectTop(prioritizeLive(filtered));
  }

  addManualJob(raw) {
    const normalized = createNormalizedJob(raw);
    const enriched = enrichJob(normalized, this.profile);
    this.store.jobs = mergeJobs(this.store.jobs, [enriched]);
    saveStore(this.store);
    return enriched;
  }

  importJobs(rawJobs) {
    const normalized = rawJobs.map((item) => createNormalizedJob(item));
    const enriched = enrichedJobs(normalized, this.profile);
    const ranked = rankJobs(enriched);
    this.store.jobs = mergeJobs(this.store.jobs, ranked);
    saveStore(this.store);
    return this.store.jobs;
  }

  updateJobStage(id, stage) {
    const job = this.store.jobs.find((item) => item.id === id);
    if (!job) return null;
    job.stage = stage;
    saveStore(this.store);
    return job;
  }

  setProfile(profile) {
    this.profile = profile;
    this.store.profile = profile;
    saveStore(this.store);
  }

  applyFilters(filters = {}) {
    return this.getTopJobs(filters);
  }
}

function resolveSources(mode) {
  if (mode === 'manual') return [new ManualJobSource()];
  if (mode === 'automático') return [new MockJobSource(), new ManualJobSource()];
  return [new MockJobSource(), new ManualJobSource()];
}

async function collectRawJobs(sources, options = {}) {
  const results = [];
  for (const source of sources) {
    if (!source.supports(options.mode)) continue;
    const items = await source.collect(options);
    if (Array.isArray(items)) results.push(...items);
  }
  return dedupeRawJobs(results);
}

function normalizeJobs(rawJobs) {
  return rawJobs.map((raw) => createNormalizedJob(raw));
}

function enrichedJobs(jobs, profile) {
  return jobs.map((job) => enrichJob(job, profile));
}

function enrichJob(job, profile) {
  const scoring = buildOpportunityScore(job, profile);
  return {
    ...job,
    score: scoring.score,
    matchPercent: scoring.matchPercent,
    matchReasons: scoring.matchReasons,
    components: scoring.components
  };
}

function rankJobs(jobs) {
  return jobs
    .slice()
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ageA = computeJobAgeMinutes(a);
      const ageB = computeJobAgeMinutes(b);
      return ageA - ageB;
    });
}

function applyRankedFilters(rankedJobs, filters = {}) {
  if (!filters || Object.keys(filters).length === 0) return rankedJobs;
  return rankedJobs.filter((job) => passesFilters(job, filters));
}

function prioritizeLive(jobs) {
  const live = [];
  const fresh = [];
  const older = [];
  for (const job of jobs) {
    const recency = classifyRecency(job);
    if (recency === 'LIVE') live.push(job);
    else if (recency === 'FRESH') fresh.push(job);
    else older.push(job);
  }
  return [...live, ...fresh, ...older];
}

function selectTop(jobs) {
  if (jobs.length === 0) return [];
  const max = 10;
  if (jobs.length <= max) return jobs;
  return jobs.slice(0, max);
}

function mergeJobs(baseJobs, incoming) {
  const map = new Map(baseJobs.map((job) => [job.id, job]));
  for (const job of incoming) {
    const existing = map.get(job.id);
    if (!existing) {
      map.set(job.id, job);
      continue;
    }
    map.set(job.id, { ...existing, ...job });
  }
  return Array.from(map.values());
}

function dedupeRawJobs(rawJobs) {
  const seen = new Set();
  const out = [];
  for (const item of rawJobs) {
    const key = `${String(item.source ?? '')}_${String(item.sourceId ?? item.title ?? '')}`.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function computeJobAgeMinutes(job) {
  const postedAt = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedAt)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - postedAt) / 60000));
}
