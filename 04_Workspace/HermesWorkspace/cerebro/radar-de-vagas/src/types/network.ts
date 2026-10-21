

export interface NetworkContact {
  id: string;
  name: string;
  role: string;
  company: string;
  relationship: string;
  connectionDegree: number;
  relatedJobId?: string;
  networkScore?: number;
  networkLevel?: string;
  contactUrl: string;
  approachType: 'recruiter' | 'hiring_manager' | 'direct_connection' | 'employee' | 'leadership';
  reason: string;
}

export interface JobRelationship {
  jobId: string;
  contactId: string;
  relationshipType: 'RECRUITER' | 'HIRING_MANAGER' | 'TEAM_MEMBER' | 'COMPANY_EMPLOYEE' | 'DIRECT_CONNECTION' | 'INDIRECT_CONNECTION';
  confidenceScore: number;
  reason: string;
}

export const MIN_EASY_APPLY_RESULTS = 5;
export const NETWORK_FALLBACK = 'network_fallback';
export const LIVE_MODE = 'job_radar_live';
export const NETWORK_MODE = 'network_intelligence';

export const networkPesos = {
  CONEXAO_DIRETA: 30,
  TRABALHA_NA_EMPRESA: 25,
  GESTOR_DA_AREA: 30,
  RECRUTADOR: 25,
  TALENT_ACQUISITION: 25,
  RH: 15,
  MESMA_AREA: 20,
  CARGO_LIDERANCA: 20,
  EMPRESA_DA_VAGA: 25,
};

export function networkLevel(score: number): string {
  if (score >= 90) return '🔥 CONTATO PRIORITÁRIO';
  if (score >= 70) return '🎯 CONTATO ESTRATÉGICO';
  if (score >= 50) return '🤝 CONTATO RELEVANTE';
  return 'CONEXÃO SECUNDÁRIA';
}

export function scoreNetworkContact(contact: Omit<NetworkContact, 'networkScore' | 'networkLevel'>): { score: number; level: string } {
  let score = 0;
  if (contact.connectionDegree === 1) score += networkPesos.CONEXAO_DIRETA;
  if (contact.relationship.toLowerCase().includes('gestor') || contact.relationship.toLowerCase().includes('head')) score += networkPesos.GESTOR_DA_AREA;
  if (contact.relationship.toLowerCase().includes('recrutador')) score += networkPesos.RECRUTADOR;
  if (contact.relationship.toLowerCase().includes('talent acquisition')) score += networkPesos.TALENT_ACQUISITION;
  if (contact.relationship.toLowerCase().includes('rh')) score += networkPesos.RH;
  if (contact.relatedJobId) score += networkPesos.EMPRESA_DA_VAGA;
  if (contact.approachType === 'hiring_manager' || contact.approachType === 'leadership') score += networkPesos.CARGO_LIDERANCA;

  const level = networkLevel(score);
  return { score, level };
}
