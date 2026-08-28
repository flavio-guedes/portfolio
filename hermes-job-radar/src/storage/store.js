const STORAGE_KEY = 'hermes_job_radar_v1';

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createEmptyStore();
    return {
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      profile: parsed.profile || null,
      meta: parsed.meta || {}
    };
  } catch (error) {
    console.warn('[Store] Falha ao carregar dados locais.', error);
    return createEmptyStore();
  }
}

export function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('[Store] Falha ao salvar dados locais.', error);
  }
}

export function createEmptyStore() {
  return {
    jobs: [],
    profile: null,
    meta: {
      lastRunAt: null,
      runCount: 0
    }
  };
}
