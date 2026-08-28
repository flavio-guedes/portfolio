export function countQueryTerms(query = '') {
  const terms = [];
  const regex = /"([^"]+)"|([^\s()]+)/g;
  let match;
  while ((match = regex.exec(query)) !== null) {
    const term = (match[1] ?? match[2] ?? '').trim();
    if (!term) continue;
    const upper = term.toUpperCase();
    if (['AND', 'OR', 'NOT'].includes(upper)) continue;
    terms.push(term);
  }
  return terms;
}

export function validateQuery(query = '') {
  const terms = countQueryTerms(query);
  return {
    valid: terms.length <= 6,
    termCount: terms.length,
    terms
  };
}

export function splitIntoValidQueries(queries = [], maxTerms = 6) {
  const out = [];
  for (const raw of queries) {
    const validation = validateQuery(raw);
    if (!validation.valid) {
      const terms = validation.terms;
      let idx = 0;
      while (idx < terms.length) {
        const slice = terms.slice(idx, idx + maxTerms);
        const quoted = slice.map((term) => `"${term}"`).join(' OR ');
        out.push(quoted);
        idx += maxTerms;
      }
      continue;
    }
    out.push(raw);
  }
  return out.filter(Boolean);
}

export function buildQueries(options = {}) {
  const roles = Array.isArray(options.roles) ? options.roles : [];
  const source = String(options.source || 'jobs');
  const maxTerms = Number(options.maxTerms || 6);
  if (!roles.length) return [];

  if (source === 'jobs') {
    const terms = roles.slice(0, maxTerms);
    return [terms.map((term) => `"${term}"`).join(' OR ')];
  }

  if (source === 'posts') {
    const hiring = ['vaga', 'oportunidade', 'contratando', 'hiring', 'recrutando'];
    const hiringTerms = hiring.slice(0, Math.min(3, maxTerms));
    const roleTerms = roles.slice(0, maxTerms - hiringTerms.length);
    const parts = [];
    if (hiringTerms.length) parts.push(hiringTerms.map((term) => `"${term}"`).join(' OR '));
    if (roleTerms.length) parts.push(roleTerms.map((term) => `"${term}"`).join(' OR '));
    return parts.filter(Boolean);
  }

  return [];
}
