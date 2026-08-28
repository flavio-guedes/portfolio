import { createNormalizedJob, normalizeSeniority, normalizeModality } from '../domain/job.js';

export function buildManualInput(formValues) {
  return {
    source: 'manual',
    sourceId: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: String(formValues.title || '').trim(),
    company: String(formValues.company || '').trim(),
    area: String(formValues.area || '').trim(),
    seniority: normalizeSeniority(formValues.seniority),
    modality: normalizeModality(formValues.modality),
    location: String(formValues.location || '').trim(),
    salary: String(formValues.salary || '').trim(),
    url: String(formValues.url || '').trim(),
    description: String(formValues.description || '').trim(),
    postedAt: new Date().toISOString(),
    tags: Array.isArray(formValues.tags) ? formValues.tags.map(String) : [],
    quality: Number(formValues.quality) || 70
  };
}

export function parseImportedText(text = '') {
  const blocks = String(text)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return blocks.map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const title = lines[0] || 'Oportunidade importada';
    const company = lines[1] || '';
    const description = lines.slice(2).join(' ');
    return createNormalizedJob({
      source: 'import-text',
      sourceId: `text_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      company,
      description,
      postedAt: new Date().toISOString()
    });
  });
}
