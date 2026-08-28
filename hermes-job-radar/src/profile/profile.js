export const defaultProfile = {
  targetRoles: [
    'Head de Design','Head of Marketing','Head de Conteúdo','Head of Content',
    'Head de Produto','Head of Product','Product Director','Product Lead',
    'Product Manager','Product Owner','Project Owner','Head de Projetos',
    'Project Director','Project Lead','Project Manager','Gerente de Projetos',
    'Agile Lead','Agile Manager','Agilista','Scrum Master','Art Director',
    'Diretor Criativo','Diretor de Arte','Brand Manager','Gestor de Tráfego',
    'Copywriter','Redator','Social Media','Design Lead','Product Analyst'
  ],
  seniorityPriority: ['HEAD','DIRETOR','LEAD','COORDENADOR','SENIOR','PLENO','JUNIOR'],
  areas: Object.freeze({
    max: ['Design','Product Design','Marketing','Conteúdo','Comunicação'],
    high: ['Produto','Gestão de Projetos','Agilidade']
  }),
  modalities: ['REMOTO','HÍBRIDO','PRESENCIAL'],
  salaryRange: null,
  keywords: ['liderança','estratégia','branding','conteúdo','produto','agile','design','gestão','growth'],
  avoid: ['b2b only','vendas pura','cold calls obrigatórios']
};

export function matchProfile(job, profile) {
  const title = `${job.title} ${job.company} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
  let score = 0;
  const reasons = [];

  if (profile.keywords.some((kw) => title.includes(kw.toLowerCase()))) {
    score += 18;
    reasons.push('Alinhamento com palavras-chave do perfil.');
  }

  if (profile.areas.max.some((area) => title.includes(area.toLowerCase()))) {
    score += 20;
    reasons.push('Área prioritária máxima.');
  } else if (profile.areas.high.some((area) => title.includes(area.toLowerCase()))) {
    score += 12;
    reasons.push('Área prioritária alta.');
  }

  if (profile.avoid.some((kw) => title.includes(kw.toLowerCase()))) {
    score -= 18;
    reasons.push('Sinal de desalinhamento com restrições do perfil.');
  }

  return { score: clampProfileScore(score), reasons };
}

export function clampProfileScore(score) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}
