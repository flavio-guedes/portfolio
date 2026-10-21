import type { JobOpportunity, RadarStats, StatusCandidatura } from '../types/opportunity';
import type { NetworkContact, JobRelationship } from '../types/network';
import { pesos } from '../data/radarConfig';
import { scoreNetworkContact } from '../types/network';

const now = Date.now();
const minutesAgo = (minutes: number): string => new Date(now - minutes * 60 * 1000).toISOString();

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Produto: ['product manager', 'product owner', 'project owner', 'product analyst', 'apm', 'pm '],
  Design: ['ux', 'ui', 'product designer', 'designer', 'art director', 'motion designer'],
  Marketing: ['marketing', 'brand', 'copywriter', 'redator', 'content director', 'head de marketing', 'head of marketing'],
  'Product Design': ['product designer', 'product design', 'ux designer', 'ui designer', 'design lead', 'product lead'],
  Agilidade: ['agilista', 'scrum master', 'agile coach', 'agile lead'],
  'Gestão de Projetos': ['project manager', 'gestor de projetos', 'gerente de projetos', 'coordenador de projetos'],
};

const SKILL_KEYWORDS = [
  'automation',
  'workflow',
  'agent',
  'agents',
  'agentic',
  'creative technologist',
  'creative operations',
  'design',
  'figma',
  'adobe',
  'marketing',
  'content',
  'product',
  'UX',
  'UI',
  'orchestration',
  'integration',
  'tooling',
  'no-code',
  'low-code',
  'LLM',
  'chatbot',
  'conversational',
  'brand',
  'strategy',
  'project',
  'agile',
  'scrum',
];

const AVOID_TOKENS = [
  'ML Engineer',
  'Data Scientist',
  'Backend Engineer',
  'machine learning research',
  'deep learning research',
  'relocation required',
  'on-site only',
  'presencial obrigatório',
  'phd',
  'postdoc',
];

function classifyCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword)) || category.toLowerCase() === text.trim()) {
      return category;
    }
  }
  return 'Outros';
}

function classifySeniority(title: string): JobOpportunity['seniority'] {
  const text = title.toLowerCase();
  if (/(head|diretor|director|executivo)/.test(text)) return 'HEAD';
  if (/(lead|coord)/.test(text)) return 'LEAD';
  if (/(coordenador)/.test(text)) return 'COORDENADOR';
  if (/(senior|sênior)/.test(text)) return 'SÊNIOR';
  if (/(pleno)/.test(text)) return 'PLENO';
  if (/(júnior|jr|junior|trainee|estágio|estagio)/.test(text)) return 'JÚNIOR';
  return 'OUTRO';
}

function classifyWorkMode(location: string, description: string): JobOpportunity['workMode'] {
  const text = `${location} ${description}`.toLowerCase();
  if (text.includes('remoto') || text.includes('remote') || text.includes('anywhere') || text.includes('worldwide')) {
    return 'REMOTO';
  }
  if (text.includes('híbrido') || text.includes('hibrido') || text.includes('hybrid')) {
    return 'HÍBRIDO';
  }
  return 'PRESENCIAL';
}

function classifyAderencia(matchScore: number): JobOpportunity['matchScore'] extends number ? 'Muito alta' | 'Alta' | 'Média' | 'Baixa' : 'Média' {
  if (matchScore >= 80) return 'Muito alta';
  if (matchScore >= 65) return 'Alta';
  if (matchScore >= 45) return 'Média';
  return 'Baixa';
}

function classifyPriority(fitScore: number): 'Muito alta' | 'Alta' | 'Média' | 'Baixa' | 'Descartar' {
  if (fitScore >= 90) return 'Muito alta';
  if (fitScore >= 80) return 'Alta';
  if (fitScore >= 70) return 'Média';
  if (fitScore >= 60) return 'Baixa';
  return 'Descartar';
}

function classifyStatus(fitScore: number): StatusCandidatura {
  if (fitScore >= 90) return 'Candidatar';
  if (fitScore >= 75) return 'Interessante';
  if (fitScore >= 60) return 'Avaliar';
  return 'Ignorada';
}

function scoreOpportunity(opp: JobOpportunity): number {
  const seniority = opp.seniority ?? classifySeniority(opp.title);
  const workMode = opp.workMode ?? classifyWorkMode(opp.location, opp.description);
  const aderencia = classifyAderencia(opp.matchScore) as JobOpportunity['matchScore'] extends number ? 'Muito alta' | 'Alta' | 'Média' | 'Baixa' : 'Média';
  const scoreSenioridade = pesos.senioridade[seniority] ?? 0;

  const minutos = Math.max(0, opp.ageMinutes);
  const scoreRecencia =
    minutos <= 2
      ? pesos.recencia['0-2']
      : minutos <= 5
        ? pesos.recencia['3-5']
        : minutos <= 8
          ? pesos.recencia['6-8']
          : minutos <= 10
            ? pesos.recencia['9-10']
            : 0;

  const scoreModalidade = pesos.modalidade[workMode] ?? 0;
  const scoreAderencia = pesos.aderencia[aderencia] ?? 0;

  let scoreQualidade = 0;
  if (opp.description) scoreQualidade += pesos.qualidade.descricaoClara;
  if (opp.company) scoreQualidade += pesos.qualidade.empresaIdentificada;
  if (opp.applicationUrl || opp.url) scoreQualidade += pesos.qualidade.linkCandidatura;

  let scoreIntencao = 0;
  if (opp.source === 'linkedin_posts') {
    scoreIntencao = pesos.intencaoContratacao['forte'];
  }

  let scoreContato = 0;
  if (opp.whatsapp) scoreContato += pesos.contatoDireto.whatsapp;
  if (opp.email) scoreContato += pesos.contatoDireto.email;
  if (opp.applicationUrl) scoreContato += pesos.contatoDireto.aplicacao;

  return scoreSenioridade + scoreRecencia + scoreModalidade + scoreAderencia + scoreQualidade + scoreIntencao + scoreContato;
}

function buildCriterios(opp: JobOpportunity): JobOpportunity['criterios'] {
  const text = `${opp.title} ${opp.description}`.toLowerCase();
  const seniority = opp.seniority ?? classifySeniority(opp.title);
  const workMode = opp.workMode ?? classifyWorkMode(opp.location, opp.description);
  const cargoMatch = Math.min(100, 60 + (SKILL_KEYWORDS.filter(keyword => text.includes(keyword)).length) * 6);
  const responsabilidadesMatch = text.includes('gestão') || text.includes('gestao') || text.includes('estratégia') || text.includes('estrategia') || text.includes('produto') || text.includes('conteúdo') || text.includes('content') ? 88 : 55;
  const competenciasMatch = SKILL_KEYWORDS.some(keyword => text.includes(keyword)) ? 82 : 40;
  const senioridadeScore = pesos.senioridade[seniority] ?? 0;
  const senioridadeMatch = Math.min(100, 55 + senioridadeScore);
  const modalidadeLocalizacaoMatch = workMode === 'REMOTO' ? 92 : workMode === 'HÍBRIDO' ? 72 : 45;
  const atualidadeMatch = Math.min(100, 70 + Math.max(0, (10 - Math.max(0, opp.ageMinutes))) * 3);

  return {
    cargo: Math.min(100, cargoMatch),
    responsabilidades: Math.min(100, responsabilidadesMatch),
    competencias: Math.min(100, competenciasMatch),
    senioridade: Math.min(100, senioridadeMatch),
    modalidadeLocalizacao: Math.min(100, modalidadeLocalizacaoMatch),
    atualidade: Math.min(100, atualidadeMatch),
  };
}

function buildGaps(opp: JobOpportunity): string[] {
  const text = `${opp.title} ${opp.description}`.toLowerCase();
  const gaps: string[] = [];
  if (!text.includes('remote') && !text.includes('remoto') && !text.includes('anywhere') && !text.includes('worldwide')) {
    gaps.push('Modalidade remota não explícita');
  }
  if (opp.ageMinutes > 120) gaps.push('Publicação não recente');
  if (!opp.applicationUrl && !opp.email && !opp.whatsapp) gaps.push('Sem contato ou link direto');
  if (AVOID_TOKENS.some(token => text.includes(token.toLowerCase()))) gaps.push('Termo evitado presente');
  return gaps;
}

function buildMotivos(opp: JobOpportunity): string[] {
  const motivos: string[] = [];
  const seniority = opp.seniority ?? classifySeniority(opp.title);
  const criterios = opp.criterios;
  if (seniority === 'HEAD' || seniority === 'DIRETOR') motivos.push('cargo de liderança compatível');
  if (criterios && criterios.cargo >= 80) motivos.push('cargo altamente aderente');
  if (criterios && criterios.responsabilidades >= 80) motivos.push('responsabilidades aderentes');
  if (opp.source === 'linkedin_posts') motivos.push('intenção de contratação explícita');
  if (opp.matchScore >= 80) motivos.push('alta aderência estimada');
  if (opp.ageMinutes <= 5) motivos.push('publicação muito recente');
  return motivos;
}

function buildRecomendacao(opp: JobOpportunity, fitScore: number): string {
  const title = opp.title.trim();
  if (fitScore >= 85) return `Recomendo candidatar para "${title}". Alta aderência e potencial estratégico.`;
  if (fitScore >= 70) return `Avaliar antes de candidatar em "${title}". Boa aderência, mas vale checar responsabilidades.`;
  if (fitScore >= 55) return `Baixa prioridade em "${title}". Interesse parcial; só candidate se houver fit complementar.`;
  return `Não recomendo agora para "${title}". Fora do foco atual.`;
}

export function enrichOpportunity(opp: JobOpportunity): JobOpportunity {
  const enriched = { ...opp };
  enriched.category = enriched.category || classifyCategory(enriched.title, enriched.description);
  enriched.seniority = enriched.seniority ?? classifySeniority(enriched.title);
  enriched.workMode = enriched.workMode ?? classifyWorkMode(enriched.location, enriched.description);
  enriched.ageMinutes = Math.max(0, enriched.ageMinutes ?? Math.floor((Date.now() - new Date(enriched.publishedAt).getTime()) / 60000));
  enriched.matchScore = enriched.matchScore ?? classifyAderencia(enriched.matchScore) === 'Muito alta' ? 90 : enriched.matchScore;

  const score = scoreOpportunity(enriched);
  const priority = classifyPriority(score);
  const candidaturaStatus = classifyStatus(score);

  return {
    ...enriched,
    score,
    prioridade: priority,
    candidaturaStatus: candidaturaStatus,
    criterios: buildCriterios(enriched),
    motivos: buildMotivos(enriched),
    lacunas: buildGaps(enriched),
    recomendacao: buildRecomendacao(enriched, score),
    descobertaEm: enriched.descobertaEm || new Date().toISOString(),
    estrategiasEncontradas: enriched.estrategiasEncontradas?.length ? enriched.estrategiasEncontradas : enriched.source ? [enriched.source] : [],
  };
}

export function deduplicar(jobs: JobOpportunity[]): JobOpportunity[] {
  const vistos = new Set<string>();
  const resultado: JobOpportunity[] = [];

  for (const job of jobs) {
    const chave1 = `${job.company}||${job.title}||${job.url}`.toLowerCase();
    const chave2 = `${job.company}||${job.title}`.toLowerCase();

    if (vistos.has(chave1) || vistos.has(chave2)) {
      continue;
    }

    vistos.add(chave1);
    vistos.add(chave2);
    resultado.push(job);
  }

  return resultado;
}

export function aplicarJanela(jobs: JobOpportunity[]): JobOpportunity[] {
  return jobs.filter(job => job.ageMinutes <= pesos.janelaMaximaMinutos);
}

export function aplicarOrdemPrioridade(items: JobOpportunity[]): JobOpportunity[] {
  const mapa = new Map<string, number>([
    ['HEAD', 0],
    ['DIRETOR', 1],
    ['LEAD', 2],
    ['COORDENADOR', 3],
    ['SÊNIOR', 4],
    ['PLENO', 5],
    ['JÚNIOR', 6],
    ['OUTRO', 7],
  ]);

  return [...items].sort((a, b) => {
    const scoreA = scoreOpportunity(a);
    const scoreB = scoreOpportunity(b);

    if (scoreA !== scoreB) return scoreB - scoreA;

    const posA = mapa.get(a.seniority) ?? 999;
    const posB = mapa.get(b.seniority) ?? 999;

    return posA - posB;
  });
}

export function limite(jobs: JobOpportunity[]): JobOpportunity[] {
  if (jobs.length <= pesos.metaMinima) return jobs;
  return jobs.slice(0, pesos.limiteResultados);
}

export function buildStats(opps: JobOpportunity[], ultimaAtualizacao = ''): RadarStats {
  return {
    ultimaAtualizacao,
    encontradas: opps.length,
    qualificadas: opps.filter(opp => scoreOpportunity(opp) >= 55).length,
    heads: opps.filter(opp => opp.seniority === 'HEAD' || opp.seniority === 'DIRETOR').length,
    remotas: opps.filter(opp => opp.workMode === 'REMOTO').length,
    hibridas: opps.filter(opp => opp.workMode === 'HÍBRIDO').length,
    presenciais: opps.filter(opp => opp.workMode === 'PRESENCIAL').length,
    fontesUnicas: new Set(opps.map(opp => opp.source)).size,
    contatosDiretos: opps.filter(opp => !!opp.whatsapp || !!opp.email).length,
    vagasAnalisadas: opps.filter(opp => opp.source === 'linkedin_jobs').length,
    publicacoesAnalisadas: opps.filter(opp => opp.source === 'linkedin_posts').length,
    topMatches: opps.filter(opp => opp.matchScore >= 80).length,
    muitoAlta: opps.filter(opp => (opp.prioridade ?? classifyPriority(scoreOpportunity(opp))) === 'Muito alta').length,
    alta: opps.filter(opp => (opp.prioridade ?? classifyPriority(scoreOpportunity(opp))) === 'Alta').length,
    media: opps.filter(opp => (opp.prioridade ?? classifyPriority(scoreOpportunity(opp))) === 'Média').length,
    baixa: opps.filter(opp => (opp.prioridade ?? classifyPriority(scoreOpportunity(opp))) === 'Baixa').length,
    descartar: opps.filter(opp => (opp.prioridade ?? classifyPriority(scoreOpportunity(opp))) === 'Descartar').length,
    novas: opps.filter(opp => (opp.ageMinutes ?? 0) <= 5).length,
    acompanhamento: opps.reduce<Record<StatusCandidatura, number>>((acc, opp) => {
      const status: StatusCandidatura = opp.candidaturaStatus ?? classifyStatus(scoreOpportunity(opp));
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {
      Nova: 0,
      Avaliar: 0,
      Interessante: 0,
      Candidatar: 0,
      Candidatado: 0,
      Entrevista: 0,
      'Processo encerrado': 0,
      Ignorada: 0,
    }),
  };
}

export function recomputeScores(items: JobOpportunity[]): JobOpportunity[] {
  return items.map(item => {
    const enriched = enrichOpportunity(item);
    const finalScore = scoreOpportunity(enriched);
    return { ...enriched, score: finalScore };
  });
}

export const mockOpportunities: JobOpportunity[] = [
  {
    id: 'job-1',
    source: 'linkedin_jobs',
    title: 'Head of Product',
    company: 'Vela Health',
    author: 'LinkedIn Jobs',
    url: 'https://linkedin.com/jobs/view/1',
    description: 'Vaga estruturada para Head of Product.',
    publishedAt: minutesAgo(2),
    ageMinutes: 2,
    seniority: 'HEAD',
    category: 'Produto',
    workMode: 'REMOTO',
    location: 'Brasil',
    contact: '',
    whatsapp: '',
    email: '',
    applicationUrl: 'https://linkedin.com/jobs/view/1',
    score: 0,
    matchScore: 95,
    status: 'active',
  },
  {
    id: 'post-1',
    source: 'linkedin_posts',
    title: 'Head de Marketing — contratação imediata',
    company: 'Monteiro Brand',
    author: 'Ana Souza',
    url: 'https://linkedin.com/posts/1',
    description: 'Estamos contratando Head de Marketing. Candidate-se enviando seu currículo.',
    publishedAt: minutesAgo(4),
    ageMinutes: 4,
    seniority: 'HEAD',
    category: 'Marketing',
    workMode: 'REMOTO',
    location: 'Rio de Janeiro',
    contact: 'WhatsApp disponível nos comentários',
    whatsapp: 'https://wa.me/5500000000001',
    email: '',
    applicationUrl: '',
    score: 0,
    matchScore: 90,
    status: 'active',
  },
  {
    id: 'job-2',
    source: 'linkedin_jobs',
    title: 'Product Manager Pleno',
    company: 'Boreal Tech',
    author: 'LinkedIn Jobs',
    url: 'https://linkedin.com/jobs/view/2',
    description: 'Product Manager Pleno com foco em growth.',
    publishedAt: minutesAgo(6),
    ageMinutes: 6,
    seniority: 'PLENO',
    category: 'Produto',
    workMode: 'REMOTO',
    location: 'Brasil',
    contact: '',
    whatsapp: '',
    email: 'gente@boreal.tech',
    applicationUrl: 'https://linkedin.com/jobs/view/2',
    score: 0,
    matchScore: 85,
    status: 'active',
  },
  {
    id: 'post-2',
    source: 'linkedin_posts',
    title: 'UX Designer JR',
    company: 'Koda App',
    author: 'Lucas Lima',
    url: 'https://linkedin.com/posts/2',
    description: 'Buscamos UX Designer JR. Processo seletivo aberto.',
    publishedAt: minutesAgo(8),
    ageMinutes: 8,
    seniority: 'JÚNIOR',
    category: 'Design',
    workMode: 'HÍBRIDO',
    location: 'São Paulo',
    contact: '',
    whatsapp: '',
    email: 'jobs@koda.app',
    applicationUrl: '',
    score: 0,
    matchScore: 70,
    status: 'active',
  },
  {
    id: 'job-3',
    source: 'linkedin_jobs',
    title: 'Product Owner',
    company: 'Mosaico Digital',
    author: 'LinkedIn Jobs',
    url: 'https://linkedin.com/jobs/view/3',
    description: 'Product Owner para time de plataforma.',
    publishedAt: minutesAgo(10),
    ageMinutes: 10,
    seniority: 'COORDENADOR',
    category: 'Produto',
    workMode: 'REMOTO',
    location: 'Brasil',
    contact: '',
    whatsapp: '',
    email: '',
    applicationUrl: 'https://linkedin.com/jobs/view/3',
    score: 0,
    matchScore: 75,
    status: 'active',
  },
  {
    id: 'job-4',
    source: 'linkedin_jobs',
    title: 'Product Designer JR',
    company: 'Koda App',
    author: 'LinkedIn Jobs',
    url: 'https://linkedin.com/jobs/view/4',
    description: 'Vaga de Product Designer JR.',
    publishedAt: minutesAgo(11),
    ageMinutes: 11,
    seniority: 'JÚNIOR',
    category: 'Product Design',
    workMode: 'HÍBRIDO',
    location: 'São Paulo',
    contact: '',
    whatsapp: '',
    email: '',
    applicationUrl: 'https://linkedin.com/jobs/view/4',
    score: 0,
    matchScore: 65,
    status: 'active',
  },
  {
    id: 'post-3',
    source: 'linkedin_posts',
    title: 'Agilista Pleno',
    company: 'Orbe PMO',
    author: 'Recrutamento Orbe',
    url: 'https://linkedin.com/posts/3',
    description: 'Estamos buscando Agilista Pleno. Candidate-se pelo link ou envie currículo.',
    publishedAt: minutesAgo(9),
    ageMinutes: 9,
    seniority: 'PLENO',
    category: 'Agilidade',
    workMode: 'PRESENCIAL',
    location: 'Curitiba',
    contact: '',
    whatsapp: 'https://wa.me/5500000000003',
    email: 'gente@orbepmo.com',
    applicationUrl: 'https://linkedin.com/posts/3',
    score: 0,
    matchScore: 78,
    status: 'active',
  },
  {
    id: 'job-5',
    source: 'linkedin_jobs',
    title: 'Head of Marketing',
    company: 'Lume Tech',
    author: 'LinkedIn Jobs',
    url: 'https://linkedin.com/jobs/view/5',
    description: 'Head of Marketing para growth e performance.',
    publishedAt: minutesAgo(1),
    ageMinutes: 1,
    seniority: 'HEAD',
    category: 'Marketing',
    workMode: 'HÍBRIDO',
    location: 'Brasil',
    contact: '',
    whatsapp: '',
    email: '',
    applicationUrl: 'https://linkedin.com/jobs/view/5',
    score: 0,
    matchScore: 98,
    status: 'active',
  },
  {
    id: 'post-4',
    source: 'linkedin_posts',
    title: 'Head de Conteúdo',
    company: 'Ritmo Agency',
    author: 'Marina Costa',
    url: 'https://linkedin.com/posts/4',
    description: 'Oportunidade: Head de Conteúdo. Interessados enviar currículo.',
    publishedAt: minutesAgo(5),
    ageMinutes: 5,
    seniority: 'HEAD',
    category: 'Marketing',
    workMode: 'REMOTO',
    location: 'Brasil',
    contact: 'Link nos comentários',
    whatsapp: '',
    email: 'jobs@ritmo.agency',
    applicationUrl: '',
    score: 0,
    matchScore: 92,
    status: 'active',
  },
  {
    id: 'job-6',
    source: 'linkedin_jobs',
    title: 'Diretor Criativo',
    company: 'Kosmos Agency',
    author: 'LinkedIn Jobs',
    url: 'https://linkedin.com/jobs/view/6',
    description: 'Diretor Criativo para contas premium.',
    publishedAt: minutesAgo(3),
    ageMinutes: 3,
    seniority: 'DIRETOR',
    category: 'Design',
    workMode: 'REMOTO',
    location: 'Brasil',
    contact: '',
    whatsapp: '',
    email: '',
    applicationUrl: 'https://linkedin.com/jobs/view/6',
    score: 0,
    matchScore: 94,
    status: 'active',
  },
];

export const mockContacts: NetworkContact[] = [
  {
    id: 'net-1',
    name: 'Maria Souza',
    role: 'Talent Acquisition',
    company: 'Monteiro Brand',
    relationship: 'Conexão direta',
    connectionDegree: 1,
    relatedJobId: 'post-1',
    contactUrl: 'https://linkedin.com/in/maria-souza',
    approachType: 'recruiter',
    reason: 'Possível recrutadora da vaga.',
  },
  {
    id: 'net-2',
    name: 'João Silva',
    role: 'Head of Marketing',
    company: 'Monteiro Brand',
    relationship: 'Conexão direta',
    connectionDegree: 1,
    relatedJobId: 'post-1',
    contactUrl: 'https://linkedin.com/in/joao-silva',
    approachType: 'hiring_manager',
    reason: 'Possível gestor da área.',
  },
  {
    id: 'net-3',
    name: 'Pedro Lima',
    role: 'Design Manager',
    company: 'Kosmos Agency',
    relationship: 'Conexão indireta',
    connectionDegree: 2,
    relatedJobId: 'job-6',
    contactUrl: 'https://linkedin.com/in/pedro-lima',
    approachType: 'leadership',
    reason: 'Liderança relacionada à vaga.',
  },
];

export function scoreContacts(contacts: NetworkContact[]) {
  return contacts.map(contact => {
    const { score, level } = scoreNetworkContact(contact);
    return { ...contact, networkScore: score, networkLevel: level };
  });
}

export function relateContacts(contacts: NetworkContact[], jobs: JobOpportunity[]): JobRelationship[] {
  const jobMap = new Map(jobs.map(job => [job.id, job]));
  return contacts
    .filter(c => c.relatedJobId && jobMap.has(c.relatedJobId))
    .map(c => ({
      jobId: c.relatedJobId!,
      contactId: c.id,
      relationshipType: c.approachType === 'recruiter' ? 'RECRUITER' : c.approachType === 'hiring_manager' ? 'HIRING_MANAGER' : c.connectionDegree === 1 ? 'DIRECT_CONNECTION' : 'INDIRECT_CONNECTION',
      confidenceScore: c.connectionDegree === 1 ? 90 : 70,
      reason: c.reason,
    }));
}
