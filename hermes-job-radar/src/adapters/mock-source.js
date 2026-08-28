export class ManualJobSource {
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

export class MockJobSource {
  constructor() {
    this.type = 'mock';
  }

  async collect(_context = {}) {
    return buildMockJobs();
  }

  supports(_mode) {
    return true;
  }
}

export function buildMockJobs() {
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
