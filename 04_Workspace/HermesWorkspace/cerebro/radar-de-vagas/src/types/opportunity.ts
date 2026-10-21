export type Source = 'linkedin_jobs' | 'linkedin_posts' | 'manual';

export type Senioridade = 'HEAD' | 'DIRETOR' | 'LEAD' | 'COORDENADOR' | 'SÊNIOR' | 'PLENO' | 'JÚNIOR' | 'OUTRO';

export type Modalidade = 'REMOTO' | 'HÍBRIDO' | 'PRESENCIAL';

export type Aderencia = 'Muito alta' | 'Alta' | 'Média' | 'Baixa';

export type Priority = 'Muito alta' | 'Alta' | 'Média' | 'Baixa' | 'Descartar';

export type StatusCandidatura = 'Nova' | 'Avaliar' | 'Interessante' | 'Candidatar' | 'Candidatado' | 'Entrevista' | 'Processo encerrado' | 'Ignorada';

export type SearchMode = 'jobs' | 'posts' | 'todos';

export interface Criterio {
  cargo: number;
  responsabilidades: number;
  competencias: number;
  senioridade: number;
  modalidadeLocalizacao: number;
  atualidade: number;
}

export interface JobOpportunity {
  id: string;
  source: Source;
  title: string;
  company: string;
  author: string;
  url: string;
  description: string;
  publishedAt: string;
  ageMinutes: number;
  seniority: Senioridade;
  category: string;
  workMode: Modalidade;
  location: string;
  contact: string;
  whatsapp: string;
  email: string;
  applicationUrl: string;
  score: number;
  matchScore: number;
  status: string;
  candidaturaStatus?: StatusCandidatura;
  prioridade?: Priority;
  criterios?: Criterio;
  motivos?: string[];
  lacunas?: string[];
  recomendacao?: string;
  descobertaEm?: string;
  estrategiasEncontradas?: string[];
}

export interface RadarStats {
  encontradas: number;
  qualificadas: number;
  heads: number;
  remotas: number;
  hibridas: number;
  presenciais: number;
  ultimaAtualizacao: string;
  fontesUnicas: number;
  contatosDiretos: number;
  vagasAnalisadas: number;
  publicacoesAnalisadas: number;
  topMatches: number;
  muitoAlta: number;
  alta: number;
  media: number;
  baixa: number;
  descartar: number;
  novas: number;
  acompanhamento: Record<StatusCandidatura, number>;
}

export interface EstrategiaBusca {
  id: string;
  nome: string;
  terms: string[];
  url: string;
  resultados: number;
  relevantes: number;
  ultimaExecucao: string;
}
