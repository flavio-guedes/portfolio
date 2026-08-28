// --- scoring.config.js ---
  weights: Object.freeze({
    senioridade: 28,
    recencia: 24,
    modalidade: 16,
    aderencia: 12,
    area: 8,
    qualidade: 6,
    empresa: 3,
    candidatura: 3
  }),
  bonus: Object.freeze({
    liveMax: 8,
    freshMax: 5,
    todayMax: 2
  }),
  thresholds: Object.freeze({
    alta: 80,
    media: 60,
    baixa: 40
  }),
  liveMaxAgeMinutes: 10,
  freshMaxAgeMinutes: 60,
  todayMaxAgeHours: 24,
  maxResults: 10,
  minResults: 5
});


// --- src/domain/job.js ---
  return {
    id: String(raw.id ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    source: String(raw.source ?? 'manual'),
    sourceId: String(raw.sourceId ?? raw.id ?? ''),
    title: String(raw.title ?? ''),
    company: String(raw.company ?? ''),
    area: String(raw.area ?? ''),
    seniority: job__normalizeSeniority(raw.seniority),
    modality: job__normalizeModality(raw.modality),
    location: String(raw.location ?? ''),
    salary: String(raw.salary ?? ''),
    url: String(raw.url ?? ''),
    description: String(raw.description ?? ''),
    postedAt: job__normalizeTimestamp(raw.postedAt),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    quality: job__clampNumber(raw.quality, 0, 100, 70),
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

  const now = Date.now();
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).toISOString();
  if (typeof value === 'string' && value.trim().length > 0) return new Date(value.trim()).toISOString();
  return new Date(now - 6 * 60 * 1000).toISOString();
}

  const postedAt = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedAt)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - postedAt) / 60000));
}

  const minutes = job__computeJobAgeMinutes(job);
  if (minutes <= 10) return 'LIVE';
  if (minutes <= 60) return 'FRESH';
  if (minutes <= 24 * 60) return 'TODAY';
  return 'OLDER';
}

  if (modality === 'REMOTO') return 0;
  if (modality === 'HÍBRIDO') return 1;
  return 2;
}

  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

  HEAD: 100,
  DIRETOR: 90,
  LEAD: 80,
  COORDENADOR: 70,
  SENIOR: 60,
  PLENO: 45,
  JUNIOR: 30
});


// --- src/profile/profile.js ---
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

  return { score: profile__clampProfileScore(score), reasons };
}

  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}


// --- src/scoring/engine.js ---

  const senioridade = engine__seniorityScoreMap[job.seniority] ?? 0;
  const recencia = recencyScore(job);
  const modalidade = modalityScore(job);
  const aderencia = engine__matchProfile(job, profile).score;
  const area = areaScore(job);
  const qualidade = Number(job.quality ?? 70);
  const empresa = Number(job.quality ?? 70) >= 85 ? 90 : Number(job.quality ?? 70) >= 75 ? 75 : 55;
  const candidatura = candidaturaScore(job);

  const weights = engine__scoringConfig.weights;
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
  const reasons = engine__matchProfile(job, profile).reasons;

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

function engine__recencyScore(job) {
  const minutes = engine__computeJobAgeMinutes(job);
  if (minutes <= 10) return 100;
  if (minutes <= 60) return 78;
  if (minutes <= 24 * 60) return 55;
  return 28;
}

function engine__modalityScore(job) {
  const rank = engine__priorityModality(job.modality);
  if (rank === 0) return 100;
  if (rank === 1) return 72;
  return 44;
}

function engine__areaScore(job) {
  const title = `${job.title} ${job.area} ${job.tags.join(' ')}`.toLowerCase();
  if (/design|product design/.test(title)) return 100;
  if (/produto|product/.test(title)) return 88;
  if (/marketing|conteúdo|comunicação|comunicacao|copywriter|redator/.test(title)) return 90;
  if (/projetos|project/.test(title)) return 82;
  if (/agile|agil|scrum|sprint|kanban/.test(title)) return 84;
  return 60;
}

function engine__candidaturaScore(job) {
  if (job.applied) return 100;
  if (job.saved) return 74;
  return 50;
}

function engine__computeJobAgeMinutes(job) {
  const postedAt = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedAt)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - postedAt) / 60000));
}


// --- src/filters/engine.js ---

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
    const recency = engine__classifyRecency(job);
    if (filters.recency === 'LIVE' && recency !== 'LIVE') return false;
    if (filters.recency === 'FRESH' && !['LIVE', 'FRESH'].includes(recency)) return false;
    if (filters.recency === 'TODAY' && recency === 'OLDER') return false;
  }

  return true;
}


// --- src/pipeline/stage.js ---
  'RADAR',
  'INTERESSANTE',
  'SALVA',
  'CANDIDATEI',
  'CONTATO',
  'ENTREVISTA',
  'PROCESSO',
  'OFERTA',
  'RECUSADO'
]);

  RADAR: '📡 Radar',
  INTERESSANTE: '🔍 Interessante',
  SALVA: '⭐ Salva',
  CANDIDATEI: '📤 Candidaturei',
  CONTATO: '📞 Contato',
  ENTREVISTA: '🎙 Entrevista',
  PROCESSO: '📋 Processo',
  OFERTA: '💰 Oferta',
  RECUSADO: '❌ Recusado'
});

  const idx = stage__pipelineStages.indexOf(current);
  if (idx < 0) return 'RADAR';
  if (idx >= stage__pipelineStages.length - 1) return 'RECUSADO';
  return stage__pipelineStages[idx + 1];
}

  return stage === 'OFERTA' || stage === 'RECUSADO';
}


// --- src/storage/store.js ---
const store__STORAGE_KEY = 'hermes_job_radar_v1';

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return store__createEmptyStore();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return store__createEmptyStore();
    return {
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      profile: parsed.profile || null,
      meta: parsed.meta || {}
    };
  } catch (error) {
    console.warn('[Store] Falha ao carregar dados locais.', error);
    return store__createEmptyStore();
  }
}

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('[Store] Falha ao salvar dados locais.', error);
  }
}

  return {
    jobs: [],
    profile: null,
    meta: {
      lastRunAt: null,
      runCount: 0
    }
  };
}


// --- src/utils/helpers.js ---
  if (job.seniority === 'HEAD') return '🔥 HEAD';
  if (job.seniority === 'DIRETOR') return '👑 DIRETOR';
  if (job.seniority === 'LEAD') return '⚡ LEAD';
  if (job.seniority === 'COORDENADOR') return '🎯 COORDENADOR';
  if (job.seniority === 'SENIOR') return '🏆 SÊNIOR';
  if (job.seniority === 'PLENO') return '📈 PLENO';
  return '🌱 JÚNIOR';
}

  if (modality === 'REMOTO') return '🌎 REMOTO';
  if (modality === 'HÍBRIDO') return '🏢 HÍBRIDO';
  return '📍 PRESENCIAL';
}

  const minutes = helpers__computeJobAgeMinutes(job);
  if (minutes <= 10) return '⚡ LIVE';
  if (minutes <= 60) return '🟢 FRESH';
  if (minutes <= 24 * 60) return '🔵 TODAY';
  return '⚪ OLDER';
}

  const postedAt = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedAt)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - postedAt) / 60000));
}

  const minutes = helpers__computeJobAgeMinutes(job);
  if (minutes <= 10) return 'há poucos minutos';
  if (minutes === 1) return 'há 1 min';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'há 1h';
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'há 1 dia';
  return `há ${days} dias`;
}

  if (!Array.isArray(reasons)) return '';
  const unique = Array.from(new Set(reasons));
  return unique.slice(0, max).join(' ');
}

  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// --- src/adapters/manual-source.js ---
  constructor() {
    this.type = 'manual';
  }

  async collect(_context = {}) {
    return [];
  }

  supports(_mode) {
    return true;
  }
}


// --- src/adapters/mock-source.js ---
  constructor() {
    this.type = 'manual';
  }

  async collect(_context = {}) {
    return [];
  }

  supports(_mode) {
    return true;
  }
}

  constructor() {
    this.type = 'mock';
  }

  async collect(_context = {}) {
    return mock_source__buildMockJobs();
  }

  supports(_mode) {
    return true;
  }
}

  const now = Date.now();
  const minute = 60 * 1000;

  return [
    {
      source: 'mock',
      sourceId: 'm1',
      title: 'Head de Design',
      company: 'Lumina Studio',
      area: 'Design',
      seniority: 'HEAD',
      modality: 'REMOTO',
      location: 'Brasil',
      salary: 'R$ 22k–28k',
      url: '#mock-m1',
      description: 'Liderar design, arte, marca e experiência em time global de produto.',
      postedAt: new Date(now - 2 * minute).toISOString(),
      tags: ['design','branding','liderança','gestão'],
      quality: 94,
      applicationUrl: '#apply-m1'
    },
    {
      source: 'mock',
      sourceId: 'm2',
      title: 'Diretor de Arte',
      company: 'Boulevard Creative',
      area: 'Design',
      seniority: 'DIRETOR',
      modality: 'HÍBRIDO',
      location: 'Rio de Janeiro',
      salary: 'R$ 18k–24k',
      url: '#mock-m2',
      description: 'Direcionar conceito visual de campanhas e experiências digitais.',
      postedAt: new Date(now - 7 * minute).toISOString(),
      tags: ['arte','design','branding','direção'],
      quality: 88,
      applicationUrl: '#apply-m2'
    },
    {
      source: 'mock',
      sourceId: 'm3',
      title: 'Head of Product Design',
      company: 'Nexa Digital',
      area: 'Product Design',
      seniority: 'HEAD',
      modality: 'REMOTO',
      location: 'Brasil',
      salary: 'R$ 25k–32k',
      url: '#mock-m3',
      description: 'Liderar design system, discovery e squad de produto.',
      postedAt: new Date(now - 4 * minute).toISOString(),
      tags: ['product design','design system','ux','liderança','produto'],
      quality: 91,
      applicationUrl: '#apply-m3'
    },
    {
      source: 'mock',
      sourceId: 'm4',
      title: 'Product Lead',
      company: 'Flow Tech',
      area: 'Produto',
      seniority: 'LEAD',
      modality: 'REMOTO',
      location: 'São Paulo',
      salary: 'R$ 19k–26k',
      url: '#mock-m4',
      description: 'Liderar squad de produto com visão de crescimento e métricas.',
      postedAt: new Date(now - 9 * minute).toISOString(),
      tags: ['produto','growth','métricas','agile','liderança'],
      quality: 87,
      applicationUrl: '#apply-m4'
    },
    {
      source: 'mock',
      sourceId: 'm5',
      title: 'Gerente de Projetos',
      company: 'Atlas Operações',
      area: 'Gestão de Projetos',
      seniority: 'COORDENADOR',
      modality: 'PRESENCIAL',
      location: 'Rio de Janeiro',
      salary: 'R$ 12k–17k',
      url: '#mock-m5',
      description: 'Coordenar portfólio de projetos e times multifuncionais.',
      postedAt: new Date(now - 22 * minute).toISOString(),
      tags: ['projetos','gestão','pmo','portfólio'],
      quality: 78,
      applicationUrl: '#apply-m5'
    },
    {
      source: 'mock',
      sourceId: 'm6',
      title: 'Head de Conteúdo',
      company: 'Rizon Media',
      area: 'Conteúdo',
      seniority: 'HEAD',
      modality: 'REMOTO',
      location: 'Brasil',
      salary: 'R$ 20k–27k',
      url: '#mock-m6',
      description: 'Definir estratégia de conteúdo, SEO e comunicação multicanal.',
      postedAt: new Date(now - 5 * minute).toISOString(),
      tags: ['conteúdo','comunicação','seo','estratégia','liderança'],
      quality: 92,
      applicationUrl: '#apply-m6'
    },
    {
      source: 'mock',
      sourceId: 'm7',
      title: 'Agile Lead',
      company: 'Compass Engineering',
      area: 'Agilidade',
      seniority: 'LEAD',
      modality: 'HÍBRIDO',
      location: 'Curitiba',
      salary: 'R$ 16k–21k',
      url: '#mock-m7',
      description: 'Liderar transformação ágil, ceremonies e métricas de fluxo.',
      postedAt: new Date(now - 35 * minute).toISOString(),
      tags: ['agile','scrum','fluxo','gestão'],
      quality: 83,
      applicationUrl: '#apply-m7'
    },
    {
      source: 'mock',
      sourceId: 'm8',
      title: 'Copywriter',
      company: 'Prisma Studios',
      area: 'Marketing',
      seniority: 'PLENO',
      modality: 'REMOTO',
      location: 'Brasil',
      salary: 'R$ 6k–10k',
      url: '#mock-m8',
      description: 'Criar textos, jornadas e tom de voz para campanhas digitais.',
      postedAt: new Date(now - 48 * minute).toISOString(),
      tags: ['copywriter','conteúdo','digital','criatividade'],
      quality: 80,
      applicationUrl: '#apply-m8'
    },
    {
      source: 'mock',
      sourceId: 'm9',
      title: 'Social Media',
      company: 'Aura Brand',
      area: 'Marketing',
      seniority: 'PLENO',
      modality: 'REMOTO',
      location: 'Brasil',
      salary: 'R$ 5k–8k',
      url: '#mock-m9',
      description: 'Operar calendário editorial e presença digital.',
      postedAt: new Date(now - 3 * minute).toISOString(),
      tags: ['social media','conteúdo','digital'],
      quality: 71,
      applicationUrl: '#apply-m9'
    },
    {
      source: 'mock',
      sourceId: 'm10',
      title: 'Head of Content',
      company: 'Solaris Media',
      area: 'Conteúdo',
      seniority: 'HEAD',
      modality: 'REMOTO',
      location: 'Brasil',
      salary: 'R$ 21k–28k',
      url: '#mock-m10',
      description: 'Liderar conteúdo, narrativa e distribuição em mídias próprias.',
      postedAt: new Date(now - 8 * minute).toISOString(),
      tags: ['conteúdo','liderança','branding','estratégia'],
      quality: 90,
      applicationUrl: '#apply-m10'
    },
    {
      source: 'mock',
      sourceId: 'm11',
      title: 'UX Designer',
      company: 'Blueleaf Tech',
      area: 'Design',
      seniority: 'PLENO',
      modality: 'REMOTO',
      location: 'Brasil',
      salary: 'R$ 8k–13k',
      url: '#mock-m11',
      description: 'Prototipar, pesquisar usuários e entregar design de produto.',
      postedAt: new Date(now - 120 * minute).toISOString(),
      tags: ['ux','design','produto','pesquisa'],
      quality: 76,
      applicationUrl: '#apply-m11'
    },
    {
      source: 'mock',
      sourceId: 'm12',
      title: 'Brand Manager',
      company: 'Fluxo Commerce',
      area: 'Marketing',
      seniority: 'SENIOR',
      modality: 'PRESENCIAL',
      location: 'São Paulo',
      salary: 'R$ 14k–20k',
      url: '#mock-m12',
      description: 'Gerenciar marca, posicionamento e campanhas integradas.',
      postedAt: new Date(now - 300 * minute).toISOString(),
      tags: ['branding','marketing','gestão'],
      quality: 84,
      applicationUrl: '#apply-m12'
    },
    {
      source: 'mock',
      sourceId: 'm13',
      title: 'Product Manager JR',
      company: 'Rocketstart',
      area: 'Produto',
      seniority: 'JUNIOR',
      modality: 'REMOTO',
      location: 'Brasil',
      salary: 'R$ 4k–7k',
      url: '#mock-m13',
      description: 'Apoiar discovery, backlog e acompanhamento de squads.',
      postedAt: new Date(now - 12 * minute).toISOString(),
      tags: ['produto','júnior','agile'],
      quality: 68,
      applicationUrl: '#apply-m13'
    },
    {
      source: 'mock',
      sourceId: 'm14',
      title: 'Agilista',
      company: 'Nexus Labs',
      area: 'Agilidade',
      seniority: 'PLENO',
      modality: 'REMOTO',
      location: 'Brasil',
      salary: 'R$ 10k–16k',
      url: '#mock-m14',
      description: 'Facilitar times, melhorar fluxo e disseminar práticas ágeis.',
      postedAt: new Date(now - 18 * minute).toISOString(),
      tags: ['agile','scrum','fluxo','métricas'],
      quality: 77,
      applicationUrl: '#apply-m14'
    },
    {
      source: 'mock',
      sourceId: 'm15',
      title: 'Gestor de Tráfego',
      company: 'Peak Growth',
      area: 'Marketing',
      seniority: 'PLENO',
      modality: 'REMOTO',
      location: 'Brasil',
      salary: 'R$ 7k–12k',
      url: '#mock-m15',
      description: 'Otimizar mídia paga, funis e experimentos de growth.',
      postedAt: new Date(now - 42 * minute).toISOString(),
      tags: ['trafego','growth','mídia','performance'],
      quality: 79,
      applicationUrl: '#apply-m15'
    },
    {
      source: 'mock',
      sourceId: 'm16',
      title: 'Art Director',
      company: 'Coral Studio',
      area: 'Design',
      seniority: 'SENIOR',
      modality: 'HÍBRIDO',
      location: 'São Paulo',
      salary: 'R$ 13k–19k',
      url: '#mock-m16',
      description: 'Orientar identidade visual, campanhas e peças criativas.',
      postedAt: new Date(now - 7 * minute).toISOString(),
      tags: ['arte','design','direção','branding'],
      quality: 86,
      applicationUrl: '#apply-m16'
    }
  ];
}


// --- src/adapters/input-parser.js ---

  return {
    source: 'manual',
    sourceId: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: String(formValues.title || '').trim(),
    company: String(formValues.company || '').trim(),
    area: String(formValues.area || '').trim(),
    seniority: input_parser__normalizeSeniority(formValues.seniority),
    modality: input_parser__normalizeModality(formValues.modality),
    location: String(formValues.location || '').trim(),
    salary: String(formValues.salary || '').trim(),
    url: String(formValues.url || '').trim(),
    description: String(formValues.description || '').trim(),
    postedAt: new Date().toISOString(),
    tags: Array.isArray(formValues.tags) ? formValues.tags.map(String) : [],
    quality: Number(formValues.quality) || 70
  };
}

  const blocks = String(text)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return blocks.map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const title = lines[0] || 'Oportunidade importada';
    const company = lines[1] || '';
    const description = lines.slice(2).join(' ');
    return input_parser__createNormalizedJob({
      source: 'import-text',
      sourceId: `text_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      company,
      description,
      postedAt: new Date().toISOString()
    });
  });
}


// --- src/services/radar.js ---

const radar__FALLBACK_ORDER = [
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD'], modality: 'REMOTO' },
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD', 'COORDENADOR', 'SENIOR'], modality: 'REMOTO' },
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD'], modality: 'HÍBRIDO' },
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD', 'COORDENADOR', 'SENIOR'], modality: 'HÍBRIDO' },
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD'], modality: 'PRESENCIAL' },
  { seniorities: ['HEAD', 'DIRETOR', 'LEAD', 'COORDENADOR', 'SENIOR'], modality: 'PRESENCIAL' }
];

function radar__createSources() {
  return {
    manual: new radar__ManualJobSource(),
    mock: new radar__MockJobSource()
  };
}

  constructor() {
    this.sources = createSources();
    this.store = radar__loadStore();
    this.profile = this.store.profile || radar__defaultProfile;
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
    radar__saveStore(this.store);

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
    const normalized = radar__createNormalizedJob(raw);
    const enriched = enrichJob(normalized, this.profile);
    this.store.jobs = mergeJobs(this.store.jobs, [enriched]);
    radar__saveStore(this.store);
    return enriched;
  }

  importJobs(rawJobs) {
    const normalized = rawJobs.map((item) => radar__createNormalizedJob(item));
    const enriched = enrichedJobs(normalized, this.profile);
    const ranked = rankJobs(enriched);
    this.store.jobs = mergeJobs(this.store.jobs, ranked);
    radar__saveStore(this.store);
    return this.store.jobs;
  }

  updateJobStage(id, stage) {
    const job = this.store.jobs.find((item) => item.id === id);
    if (!job) return null;
    job.stage = stage;
    radar__saveStore(this.store);
    return job;
  }

  setProfile(profile) {
    this.profile = profile;
    this.store.profile = profile;
    radar__saveStore(this.store);
  }

  applyFilters(filters = {}) {
    return this.getTopJobs(filters);
  }
}

function radar__resolveSources(mode) {
  if (mode === 'manual') return [new radar__ManualJobSource()];
  if (mode === 'automático') return [new radar__MockJobSource(), new radar__ManualJobSource()];
  return [new radar__MockJobSource(), new radar__ManualJobSource()];
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

function radar__normalizeJobs(rawJobs) {
  return rawJobs.map((raw) => radar__createNormalizedJob(raw));
}

function radar__enrichedJobs(jobs, profile) {
  return jobs.map((job) => enrichJob(job, profile));
}

function radar__enrichJob(job, profile) {
  const scoring = radar__buildOpportunityScore(job, profile);
  return {
    ...job,
    score: scoring.score,
    matchPercent: scoring.matchPercent,
    matchReasons: scoring.matchReasons,
    components: scoring.components
  };
}

function radar__rankJobs(jobs) {
  return jobs
    .slice()
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ageA = radar__computeJobAgeMinutes(a);
      const ageB = radar__computeJobAgeMinutes(b);
      return ageA - ageB;
    });
}

function radar__applyRankedFilters(rankedJobs, filters = {}) {
  if (!filters || Object.keys(filters).length === 0) return rankedJobs;
  return rankedJobs.filter((job) => radar__passesFilters(job, filters));
}

function radar__prioritizeLive(jobs) {
  const live = [];
  const fresh = [];
  const older = [];
  for (const job of jobs) {
    const recency = radar__classifyRecency(job);
    if (recency === 'LIVE') live.push(job);
    else if (recency === 'FRESH') fresh.push(job);
    else older.push(job);
  }
  return [...live, ...fresh, ...older];
}

function radar__selectTop(jobs) {
  if (jobs.length === 0) return [];
  const max = 10;
  if (jobs.length <= max) return jobs;
  return jobs.slice(0, max);
}

function radar__mergeJobs(baseJobs, incoming) {
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

function radar__dedupeRawJobs(rawJobs) {
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

function radar__computeJobAgeMinutes(job) {
  const postedAt = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedAt)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - postedAt) / 60000));
}


// --- src/services/app.js ---

  const engine = new app__RadarEngine();
  engine.profile = app__defaultProfile;
  engine.setProfile(app__defaultProfile);

  return {
    engine,
    state: {
      filters: { recency: 'ALL', modalities: [], areas: [], seniorities: [] },
      selectedId: null,
      detailJobId: null,
      quickSearch: ''
    }
  };
}


// --- preview/app.js ---
  app__badgeForJob,
  app__modalityBadge,
  app__recencyBadge,
  app__formatJobAge,
  app__shortMatchReasons,
  app__escapeHtml
} from '../src/utils/helpers.js';

const app__app = app__createApp();
const { engine, state } = app;
const app__store = engine.store;

function app__init() {
  seedIfEmpty();
  renderView();
  bindNav();
  bindHunt();
  bindDetail();
  bindReset();
  showRuntimeDiagnostics();
  showOfflineModeNotice();
}

function app__showRuntimeDiagnostics() {
  const el = document.getElementById('runtimeDiagnostics');
  if (!el) return;
  try {
    const top = engine.getTopJobs(state.filters);
    el.textContent = `Módulos OK · ${store.jobs.length} vagas · ${top.length} visíveis`;
    el.style.color = 'var(--success)';
  } catch (error) {
    el.textContent = 'Falha na inicialização: ' + error.message;
    el.style.color = 'var(--danger)';
    console.error('[HermesJobRadar] init failure', error);
  }
}

function app__showOfflineModeNotice() {
  if (typeof window === 'undefined') return;
  const hint = document.createElement('div');
  hint.style.cssText = 'margin:10px 0; padding:10px; border-radius:14px; border:1px dashed var(--border-hover); color:var(--text-2); font-size:12px; background:rgba(255,255,255,0.04);';
  hint.textContent = 'Se o painel estiver vazio, abra pelo servidor local: cd preview && python3 -m http.server 8080 e acesse http://localhost:8080';
  const target = document.getElementById('viewSub')?.parentElement || document.body;
  target.appendChild(hint);
}

function app__seedIfEmpty() {
  if (store.jobs.length === 0) {
    engine.importJobs([
      { source: 'seed', title: 'Head de Design', company: 'Lumina', area: 'Design', seniority: 'HEAD', modality: 'REMOTO', description: 'Liderar design e marca.', tags: ['design'] },
      { source: 'seed', title: 'Art Director', company: 'Boulevard', area: 'Design', seniority: 'DIRETOR', modality: 'HÍBRIDO', description: 'Direção visual.', tags: ['design'] },
      { source: 'seed', title: 'Head of Content', company: 'Rizon', area: 'Conteúdo', seniority: 'HEAD', modality: 'REMOTO', description: 'Estratégia de conteúdo.', tags: ['conteúdo'] }
    ]);
  }
}

function app__renderView(view = 'radar') {
  if (view === 'pipeline') renderPipeline();
  else if (view === 'profile') renderProfile();
  else if (view === 'manual') renderManual();
  else if (view === 'import') renderImport();
  else renderRadar();
}

function app__renderRadar() {
  setActiveNav('radar');
  document.getElementById('viewTitle').textContent = 'RADAR';
  document.getElementById('viewSub').textContent = 'Coleta, filtros, ranking e priorização.';

  const top = engine.getTopJobs(state.filters);
  renderStats(top);
  renderFilterPills();
  renderJobs(top);
}

function app__renderStats(jobs) {
  const heads = jobs.filter((j) => j.seniority === 'HEAD').length;
  const remotes = jobs.filter((j) => j.modality === 'REMOTO').length;
  const live = jobs.filter((j) => app__classifyRecency(j) === 'LIVE').length;
  const pipelineCount = store.jobs.filter((j) => j.stage !== 'RADAR').length;
  const stats = [
    { label: '🔥 Heads', value: heads },
    { label: '🎯 Matches', value: jobs.length },
    { label: '🌎 Remotas', value: remotes },
    { label: '⚡ Live', value: live },
    { label: '📋 Pipeline', value: pipelineCount }
  ];
  document.getElementById('stats').innerHTML = stats
    .map((s) => `<div class="stat"><div class="stat-title">${app__escapeHtml(s.label)}</div><div class="stat-value">${s.value}</div></div>`)
    .join('');
}

function app__renderFilterPills() {
  const pills = [
    { label: 'Todas', key: 'recency', value: 'ALL' },
    { label: '🔥 HEAD', key: 'seniorities', value: 'HEAD' },
    { label: '👑 DIRETOR', key: 'seniorities', value: 'DIRETOR' },
    { label: '⚡ LEAD', key: 'seniorities', value: 'LEAD' },
    { label: '🎯 COORDENADOR', key: 'seniorities', value: 'COORDENADOR' },
    { label: '🏆 SÊNIOR', key: 'seniorities', value: 'SENIOR' },
    { label: '📈 PLENO', key: 'seniorities', value: 'PLENO' },
    { label: '🌱 JÚNIOR', key: 'seniorities', value: 'JUNIOR' },
    { label: 'DESIGN', key: 'areas', value: 'design' },
    { label: 'PRODUCT DESIGN', key: 'areas', value: 'product design' },
    { label: 'PRODUTO', key: 'areas', value: 'produto' },
    { label: 'MARKETING', key: 'areas', value: 'marketing' },
    { label: 'CONTEÚDO', key: 'areas', value: 'conteúdo' },
    { label: 'COMUNICAÇÃO', key: 'areas', value: 'comunicação' },
    { label: 'PROJETOS', key: 'areas', value: 'projetos' },
    { label: 'AGILIDADE', key: 'areas', value: 'agile' },
    { label: '🌎 REMOTO', key: 'modalities', value: 'REMOTO' },
    { label: '🏢 HÍBRIDO', key: 'modalities', value: 'HÍBRIDO' },
    { label: '📍 PRESENCIAL', key: 'modalities', value: 'PRESENCIAL' }
  ];

  document.getElementById('filterPills').innerHTML = pills
    .map((p) => `<button class="pill" data-filter-key="${p.key}" data-filter-value="${app__escapeHtml(p.value)}">${app__escapeHtml(p.label)}</button>`)
    .join('');

  document.getElementById('filterPills').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter-key]');
    if (!button) return;
    const key = button.dataset.filterKey;
    const value = button.dataset.filterValue;
    toggleFilter(key, value);
    renderRadar();
  });
}

function app__toggleFilter(key, value) {
  const list = Array.isArray(state.filters[key]) ? state.filters[key] : [];
  const idx = list.indexOf(value);
  if (key === 'recency') {
    state.filters.recency = state.filters.recency === value ? 'ALL' : value;
    return;
  }
  if (idx >= 0) list.splice(idx, 1);
  else list.push(value);
  state.filters[key] = list;
}

function app__renderJobs(jobs) {
  const container = document.getElementById('contentArea');
  if (!jobs.length) {
    container.innerHTML = `<div class="empty-state">Nenhuma oportunidade para os filtros atuais.</div>`;
    return;
  }

  container.innerHTML = jobs
    .map((job) => {
      const recencia = app__classifyRecency(job);
      return `<article class="job-card" data-id="${job.id}">
        <div class="job-top">
          <div>
            <div class="job-title">${app__escapeHtml(job.title)}</div>
            <div class="job-company">${app__escapeHtml(job.company)}</div>
          </div>
          <div class="job-match">${job.matchPercent ?? '--'}%</div>
        </div>
        <div class="job-meta">
          <span class="badge ${job.seniority === 'HEAD' ? 'head' : ''}">${app__badgeForJob(job)}</span>
          <span class="badge">${app__modalityBadge(job.modality)}</span>
          <span class="badge ${recencia === 'LIVE' ? 'live' : ''}">${app__recencyBadge(job)}</span>
          <span class="badge">🎯 ${app__escapeHtml(job.area || '—')}</span>
          <span class="badge">⏱ ${app__escapeHtml(app__formatJobAge(job))}</span>
        </div>
        <div class="job-desc">${app__escapeHtml(job.description)}</div>
        <div style="margin-top:10px; color:var(--text-2); font-size:12px;">${app__escapeHtml(app__shortMatchReasons(job.matchReasons))}</div>
        <div class="job-actions">
          <button class="btn primary open-detail" data-id="${job.id}">VER</button>
          <button class="btn save-job" data-id="${job.id}">SALVAR</button>
          <button class="btn apply-job" data-id="${job.id}">CANDIDATAR</button>
          <button class="btn ghost ignore-job" data-id="${job.id}">IGNORAR</button>
        </div>
      </article>`;
    })
    .join('');

  container.querySelectorAll('.open-detail').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDetail(btn.dataset.id);
    });
  });

  container.querySelectorAll('.save-job').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); moveToStage(btn.dataset.id, 'SALVA'); }));
  container.querySelectorAll('.apply-job').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); moveToStage(btn.dataset.id, 'CANDIDATEI'); }));
  container.querySelectorAll('.ignore-job').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); moveToStage(btn.dataset.id, 'RECUSADO'); }));
  container.querySelectorAll('.job-card').forEach((card) => card.addEventListener('click', () => openDetail(card.dataset.id)));
}

function app__classifyRecency(job) {
  const minutes = app__computeJobAgeMinutes(job);
  if (minutes <= 10) return 'LIVE';
  if (minutes <= 60) return 'FRESH';
  if (minutes <= 24 * 60) return 'TODAY';
  return 'OLDER';
}

function app__computeJobAgeMinutes(job) {
  const postedAt = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedAt)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - postedAt) / 60000));
}

function app__renderPipeline() {
  setActiveNav('pipeline');
  document.getElementById('viewTitle').textContent = 'PIPELINE';
  document.getElementById('viewSub').textContent = 'Acompanhamento por estágio.';
  document.getElementById('stats').innerHTML = '';
  document.getElementById('filterPills').innerHTML = '';
  const container = document.getElementById('contentArea');
  container.className = '';

  if (!store.jobs.length) {
    container.innerHTML = `<div class="empty-state">Nenhuma oportunidade registrada ainda.</div>`;
    return;
  }

  container.innerHTML = app__pipelineStages
    .map((stage) => {
      const jobs = store.jobs.filter((j) => j.stage === stage);
      const cards = jobs.map((job) => {
        const recencia = app__classifyRecency(job);
        return `<div class="job-card" style="border:1px solid var(--border); background:rgba(255,255,255,0.02);">
          <div style="font-weight:700;">${app__escapeHtml(job.title)}</div>
          <div style="color:var(--text-2); font-size:12px;">${app__escapeHtml(job.company)}</div>
          <div class="job-meta" style="margin-top:8px;">
            <span class="badge">${app__stageLabels[stage]}</span>
            <span class="badge">${app__badgeForJob(job)}</span>
            <span class="badge">${app__modalityBadge(job.modality)}</span>
          </div>
          <div class="job-actions" style="margin-top:10px;">
            <button class="btn primary pipeline-move" data-id="${job.id}" data-to="${app__nextStage(stage)}">${app__nextStage(stage)}</button>
          </div>
        </div>`;
      }).join('');

      return `<div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
        <div class="section-title">${app__stageLabels[stage]} · ${jobs.length}</div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px;">${cards || '<div class="empty-state">Vazio</div>'}</div>
      </div>`;
    })
    .join('');

  container.querySelectorAll('.pipeline-move').forEach((btn) => btn.addEventListener('click', () => moveToStage(btn.dataset.id, btn.dataset.to)));
}

function app__renderProfile() {
  setActiveNav('profile');
  document.getElementById('viewTitle').textContent = 'PERFIL';
  document.getElementById('viewSub').textContent = 'Configuração de preferências profissionais.';
  document.getElementById('stats').innerHTML = '';
  document.getElementById('filterPills').innerHTML = '';
  const container = document.getElementById('contentArea');
  container.className = '';

  container.innerHTML = `<div class="section">
    <div class="section-title">Prefências aplicadas</div>
    <div style="color:var(--text-1); font-size:13px;">Senioridades priorizadas: ${app__defaultProfile.seniorityPriority.join(', ')}</div>
    <div style="color:var(--text-1); font-size:13px;">Áreas prioritárias: ${[...app__defaultProfile.areas.max, ...app__defaultProfile.areas.high].join(', ')}</div>
    <div style="color:var(--text-1); font-size:13px;">Modalidades: ${app__defaultProfile.modalities.join(', ')}</div>
  </div>`;
}

function app__renderManual() {
  setActiveNav('manual');
  document.getElementById('viewTitle').textContent = 'ADICIONAR VAGA';
  document.getElementById('viewSub').textContent = 'Cadastro manual para coleta off-line.';
  document.getElementById('stats').innerHTML = '';
  document.getElementById('filterPills').innerHTML = '';
  const container = document.getElementById('contentArea');
  container.className = '';

  container.innerHTML = `<div class="section">
    <div class="section-title">Inserir oportunidade</div>
    <form class="manual-form" id="manualForm">
      <div class="field"><label>Título</label><input name="title" required></div>
      <div class="field"><label>Empresa</label><input name="company"></div>
      <div class="field"><label>Área</label><input name="area"></div>
      <div class="field"><label>Senioridade</label><select name="seniority">
        <option>HEAD</option><option>DIRETOR</option><option>LEAD</option><option>COORDENADOR</option><option>SÊNIOR</option><option>PLENO</option><option>JÚNIOR</option>
      </select></div>
      <div class="field"><label>Modalidade</label><select name="modality">
        <option>REMOTO</option><option>HÍBRIDO</option><option>PRESENCIAL</option>
      </select></div>
      <div class="field"><label>Localização</label><input name="location"></div>
      <div class="field full"><label>Descrição</label><textarea name="description" rows="4"></textarea></div>
      <div class="field full"><button class="btn primary" type="submit">Salvar vaga</button></div>
    </form>
  </div>`;

  document.getElementById('manualForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target));
    engine.addManualJob(form);
    alert('Vaga adicionada ao Radar.');
    renderRadar();
  });
}

function app__renderImport() {
  setActiveNav('import');
  document.getElementById('viewTitle').textContent = 'IMPORTAR';
  document.getElementById('viewSub').textContent = 'JSON, CSV ou texto livre.';
  document.getElementById('stats').innerHTML = '';
  document.getElementById('filterPills').innerHTML = '';
  const container = document.getElementById('contentArea');
  container.className = '';

  container.innerHTML = `<div class="section">
    <div class="section-title">Importar texto</div>
    <textarea id="importText" rows="8" style="width:100%; background:rgba(255,255,255,0.04); color:var(--text-0); border:1px solid var(--border); border-radius:14px; padding:10px;" placeholder="Cole vagas separadas por linha em branco..."></textarea>
    <div style="margin-top:10px;"><button class="btn primary" id="importSubmit">Importar</button></div>
  </div>`;

  document.getElementById('importSubmit').addEventListener('click', () => {
    const text = document.getElementById('importText').value || '';
    engine.importJobs([{ source: 'import-text', description: text }]);
    alert('Importação concluída.');
    renderRadar();
  });
}

function app__moveToStage(id, stage) {
  const job = engine.updateJobStage(id, stage);
  if (!job) return;
  renderView(document.querySelector('.nav-item.active')?.dataset.view || 'radar');
}

function app__openDetail(id) {
  const job = store.jobs.find((j) => j.id === id) || engine.getTopJobs().find((j) => j.id === id);
  if (!job) return;
  state.detailJobId = id;
  document.getElementById('detailContent').innerHTML = `<h3 class="modal-title">${app__escapeHtml(job.title)} · ${app__escapeHtml(job.company)}</h3>
    <div class="detail-grid">
      <div class="detail-block">
        <h4>Identidade</h4>
        <div>${app__escapeHtml(app__badgeForJob(job))} · ${app__escapeHtml(app__modalityBadge(job.modality))} · ${app__escapeHtml(app__recencyBadge(job))}</div>
        <div style="margin-top:6px;">${app__escapeHtml(app__formatJobAge(job))}</div>
      </div>
      <div class="detail-block">
        <h4>Match</h4>
        <div>${job.matchPercent ?? '--'}%</div>
        <div style="margin-top:6px;">${(job.matchReasons || []).map((r) => `• ${app__escapeHtml(r)}`).join('<br>') || '—'}</div>
      </div>
      <div class="detail-block full">
        <h4>Descrição</h4>
        <div>${app__escapeHtml(job.description)}</div>
      </div>
      <div class="detail-block">
        <h4>Localização / Faixa</h4>
        <div>${app__escapeHtml(job.location || '—')}</div>
        <div style="margin-top:6px;">${app__escapeHtml(job.salary || '—')}</div>
      </div>
      <div class="detail-block">
        <h4>Ações</h4>
        <div class="job-actions">
          <button class="btn primary detail-save" data-id="${job.id}">SALVAR</button>
          <button class="btn primary detail-apply" data-id="${job.id}">CANDIDATAR</button>
          <button class="btn ghost detail-ignore" data-id="${job.id}">IGNORAR</button>
        </div>
      </div>
    </div>`;

  document.getElementById('detailModal').classList.add('open');
  document.getElementById('closeDetail').onclick = closeDetail;
  document.getElementById('detailModal').addEventListener('click', (event) => {
    if (event.target.id === 'detailModal') closeDetail();
  });

  document.getElementById('detailContent').querySelector('.detail-save')?.addEventListener('click', () => { moveToStage(job.id, 'SALVA'); closeDetail(); });
  document.getElementById('detailContent').querySelector('.detail-apply')?.addEventListener('click', () => { moveToStage(job.id, 'CANDIDATEI'); closeDetail(); });
  document.getElementById('detailContent').querySelector('.detail-ignore')?.addEventListener('click', () => { moveToStage(job.id, 'RECUSADO'); closeDetail(); });
}

function app__closeDetail() { document.getElementById('detailModal').classList.remove('open'); state.detailJobId = null; }

function app__setActiveNav(view) {
  document.querySelectorAll('.nav-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
}

function app__bindNav() {
  document.querySelectorAll('.nav-item').forEach((btn) => btn.addEventListener('click', () => renderView(btn.dataset.view)));
}

function app__bindDetail() {
  // Already handled inside openDetail.
}

function app__bindReset() {
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Reiniciar dados locais?')) return;
    app__saveStore(app__createEmptyStore());
    location.reload();
  });
}

function app__bindHunt() {
  const overlay = document.getElementById('huntOverlay');
  const open = document.getElementById('huntBtn');
  const close = document.getElementById('closeHunt');

  open.addEventListener('click', async () => {
    overlay.classList.add('open');
    const log = document.getElementById('huntLog');
    const progress = document.getElementById('huntProgress');
    log.innerHTML = '';
    progress.style.width = '0%';

    const steps = [
      'CONECTANDO FONTES',
      'BUSCANDO',
      'NORMALIZANDO',
      'FILTRANDO',
      'REMOVENDO DUPLICADAS',
      'CALCULANDO MATCH',
      'RANKEANDO',
      'RADAR PRONTO'
    ];

    for (let i = 0; i < steps.length; i++) {
      await delay(280);
      const el = document.createElement('div');
      el.className = 'hunt-step';
      el.textContent = steps[i];
      log.appendChild(el);
      progress.style.width = `${Math.round(((i + 1) / steps.length) * 100)}%`;
      el.classList.add('done');
    }

    await delay(260);
    await engine.runHunt({ mode: 'assistido' });
    renderRadar();
  });

  close.addEventListener('click', () => overlay.classList.remove('open'));
}

function app__delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

init();

