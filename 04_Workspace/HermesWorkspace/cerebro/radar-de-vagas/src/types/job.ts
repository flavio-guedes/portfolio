export type Senioridade = 'HEAD' | 'DIRETOR' | 'LEAD' | 'COORDENADOR' | 'SÊNIOR' | 'PLENO' | 'JÚNIOR' | 'OUTRO';

export type Modalidade = 'REMOTO' | 'HÍBRIDO' | 'PRESENCIAL';

export type Aderencia = 'Muito alta' | 'Alta' | 'Média' | 'Baixa';

export interface Job {
  id: string;
  titulo: string;
  empresa: string;
  senioridade: Senioridade;
  modalidade: Modalidade;
  area: string;
  aderencia: Aderencia;
  descricaoClara: boolean;
  empresaIdentificada: boolean;
  linkCandidatura: boolean;
  publicadoEm: string;
  url: string;
}

export interface RadarStats {
  encontradas: number;
  qualificadas: number;
  heads: number;
  remotas: number;
  hibridas: number;
  presenciais: number;
  ultimaAtualizacao: string;
}
