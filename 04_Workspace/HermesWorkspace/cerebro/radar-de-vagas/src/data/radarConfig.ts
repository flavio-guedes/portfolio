import type { SearchMode } from '../types/opportunity.ts';

export interface Categoria {
  id: string;
  titulo: string;
  jobsQuery: string;
  postsQuery: string;
  jobsUrl: string;
  postsUrl: string;
}

export const pesos = {
  senioridade: {
    HEAD: 50,
    DIRETOR: 45,
    LEAD: 40,
    COORDENADOR: 35,
    SÊNIOR: 30,
    PLENO: 20,
    JÚNIOR: 10,
    OUTRO: 0,
  } as Record<string, number>,

  recencia: {
    '0-2': 30,
    '3-5': 25,
    '6-8': 20,
    '9-10': 15,
  },

  modalidade: {
    REMOTO: 25,
    HÍBRIDO: 15,
    PRESENCIAL: 5,
  },

  aderencia: {
    'Muito alta': 20,
    Alta: 15,
    Média: 10,
    Baixa: 0,
  },

  qualidade: {
    descricaoClara: 5,
    empresaIdentificada: 5,
    linkCandidatura: 5,
  },

  intencaoContratacao: {
    forte: 20,
    media: 10,
    fraca: 0,
  },

  contatoDireto: {
    whatsapp: 10,
    email: 5,
    aplicacao: 5,
  },

  empresaIdentificadaBonus: 5,
  janelaMaximaMinutos: 10,
  limiteResultados: 10,
  metaMinima: 5,
};

function jobsUrl(query: string) {
  return 'https://www.linkedin.com/jobs/search/?keywords=' + encodeURIComponent(query);
}

function postsUrl(query: string) {
  return 'https://www.linkedin.com/search/results/content/?keywords=' + encodeURIComponent(query);
}

export const categorias: Categoria[] = [
  {
    id: 'head',
    titulo: '🔥 HEAD',
    jobsQuery: `("Head of Design" OR "Head de Design" OR "Head of Marketing" OR "Head de Marketing" OR "Design Director" OR "Diretor Criativo" OR "Design Lead")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Head de Design" OR "Head de Design" OR "Design Director" OR "Diretor de Design" OR "Design Lead" OR "Product Lead")`,
    jobsUrl: jobsUrl(`("Head of Design" OR "Head de Design" OR "Head of Marketing" OR "Head de Marketing" OR "Design Director" OR "Diretor Criativo" OR "Design Lead")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Head de Design" OR "Head de Design" OR "Design Director" OR "Diretor de Design" OR "Design Lead" OR "Product Lead")`),
  },
  {
    id: 'designer',
    titulo: '🎨 DESIGNER',
    jobsQuery: `("UX Designer" OR "UI Designer" OR "Product Designer" OR "Motion Designer" OR "Designer Gráfico" OR "Designer" OR "Art Director")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("UX Designer" OR "UI Designer" OR "Product Designer" OR "Motion Designer" OR "Designer Gráfico" OR "Designer" OR "Criação")`,
    jobsUrl: jobsUrl(`("UX Designer" OR "UI Designer" OR "Product Designer" OR "Motion Designer" OR "Designer Gráfico" OR "Designer" OR "Art Director")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("UX Designer" OR "UI Designer" OR "Product Designer" OR "Motion Designer" OR "Designer Gráfico" OR "Designer" OR "Criação")`),
  },
  {
    id: 'product-design',
    titulo: '🧩 PRODUCT DESIGN',
    jobsQuery: `("Product Designer" OR "Product Design" OR "UX Designer" OR "UI Designer" OR "Design Lead" OR "Product Lead")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Product Designer" OR "Product Design")`,
    jobsUrl: jobsUrl(`("Product Designer" OR "Product Design" OR "UX Designer" OR "UI Designer" OR "Design Lead" OR "Product Lead")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Product Designer" OR "Product Design")`),
  },
  {
    id: 'product-manager',
    titulo: '📦 PRODUCT MANAGER',
    jobsQuery: `("Product Manager" OR "Product Owner" OR "Project Owner" OR "Product Lead" OR "Product Analyst" OR "APM")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Product Manager" OR "Product Owner" OR "Project Owner")`,
    jobsUrl: jobsUrl(`("Product Manager" OR "Product Owner" OR "Project Owner" OR "Product Lead" OR "Product Analyst" OR "APM")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Product Manager" OR "Product Owner" OR "Project Owner")`),
  },
  {
    id: 'product-owner',
    titulo: '👤 PRODUCT OWNER',
    jobsQuery: `("Product Owner" OR "Product Manager" OR "Project Owner")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Product Owner" OR "Product Manager" OR "Project Owner")`,
    jobsUrl: jobsUrl(`("Product Owner" OR "Product Manager" OR "Project Owner")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Product Owner" OR "Product Manager" OR "Project Owner")`),
  },
  {
    id: 'project-owner',
    titulo: '🚀 PROJECT OWNER',
    jobsQuery: `("Project Owner" OR "Product Owner" OR "Product Manager")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Project Owner" OR "Product Owner" OR "Product Manager")`,
    jobsUrl: jobsUrl(`("Project Owner" OR "Product Owner" OR "Product Manager")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Project Owner" OR "Product Owner" OR "Product Manager")`),
  },
  {
    id: 'agilista',
    titulo: '⚡ AGILISTA',
    jobsQuery: `("Agilista" OR "Scrum Master" OR "Agile Coach" OR "Agile Lead")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Agilista" OR "Scrum Master" OR "Product Owner")`,
    jobsUrl: jobsUrl(`("Agilista" OR "Scrum Master" OR "Agile Coach" OR "Agile Lead")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Agilista" OR "Scrum Master" OR "Product Owner")`),
  },
  {
    id: 'gestao-projetos',
    titulo: '📋 GESTÃO DE PROJETOS',
    jobsQuery: `("Project Manager" OR "Gestor de Projetos" OR "Gerente de Projetos" OR "Coordenador de Projetos")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Project Manager" OR "Gestor de Projetos" OR "Gerente de Projetos" OR "Coordenador de Projetos")`,
    jobsUrl: jobsUrl(`("Project Manager" OR "Gestor de Projetos" OR "Gerente de Projetos" OR "Coordenador de Projetos")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Project Manager" OR "Gestor de Projetos" OR "Gerente de Projetos" OR "Coordenador de Projetos")`),
  },
  {
    id: 'head-marketing',
    titulo: '📣 HEAD DE MARKETING',
    jobsQuery: `("Head de Marketing" OR "Head of Marketing" OR "Marketing Director" OR "Brand Manager" OR "Content Director" OR "Marketing Manager")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Head de Marketing" OR "Head of Marketing" OR "Marketing Director" OR "Marketing Manager" OR "Content Director" OR "Content Lead")`,
    jobsUrl: jobsUrl(`("Head de Marketing" OR "Head of Marketing" OR "Marketing Director" OR "Brand Manager" OR "Content Director" OR "Marketing Manager")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Head de Marketing" OR "Head of Marketing" OR "Marketing Director" OR "Marketing Manager" OR "Content Director" OR "Content Lead")`),
  },
  {
    id: 'head-conteudo',
    titulo: '✍️ HEAD DE CONTEÚDO',
    jobsQuery: `("Head de Conteúdo" OR "Head of Content" OR "Content Director" OR "Content Lead")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Head de Conteúdo" OR "Head of Content" OR "Content Director" OR "Content Lead")`,
    jobsUrl: jobsUrl(`("Head de Conteúdo" OR "Head of Content" OR "Content Director" OR "Content Lead")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Head de Conteúdo" OR "Head of Content" OR "Content Director" OR "Content Lead")`),
  },
  {
    id: 'marketing',
    titulo: '🎯 MARKETING',
    jobsQuery: `("Marketing Director" OR "Marketing Manager" OR "Content Director" OR "Brand Manager" OR "Social Media" OR "Copywriter" OR "Redator")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Marketing Director" OR "Marketing Manager" OR "Content Director" OR "Brand Manager" OR "Social Media" OR "Copywriter")`,
    jobsUrl: jobsUrl(`("Marketing Director" OR "Marketing Manager" OR "Content Director" OR "Brand Manager" OR "Social Media" OR "Copywriter" OR "Redator")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Marketing Director" OR "Marketing Manager" OR "Content Director" OR "Brand Manager" OR "Social Media" OR "Copywriter")`),
  },
  {
    id: 'art-director',
    titulo: '🎬 ART DIRECTOR',
    jobsQuery: `("Art Director" OR "Diretor de Arte" OR "Diretor Criativo")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Art Director" OR "Diretor de Arte" OR "Diretor Criativo")`,
    jobsUrl: jobsUrl(`("Art Director" OR "Diretor de Arte" OR "Diretor Criativo")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Art Director" OR "Diretor de Arte" OR "Diretor Criativo")`),
  },
  {
    id: 'diretoria-criativa',
    titulo: '💡 DIRETOR CRIATIVO',
    jobsQuery: `("Diretor Criativo" OR "Creative Director" OR "Diretor de Arte" OR "Art Director")`,
    postsQuery: `("vaga" OR "oportunidade") AND ("Diretor Criativo" OR "Creative Director" OR "Diretor de Arte" OR "Art Director")`,
    jobsUrl: jobsUrl(`("Diretor Criativo" OR "Creative Director" OR "Diretor de Arte" OR "Art Director")`),
    postsUrl: postsUrl(`("vaga" OR "oportunidade") AND ("Diretor Criativo" OR "Creative Director" OR "Diretor de Arte" OR "Art Director")`),
  },
];

export const jobsTodasUrl = 'https://www.linkedin.com/jobs/search/?keywords=' + encodeURIComponent(`("Design" OR "Designer" OR "Product Design" OR "Product Manager" OR "Product Owner" OR "Project Owner" OR "Agilista" OR "Project Manager" OR "Marketing" OR "Conteúdo" OR "Comunicação")`);
export const postsTodasUrl = 'https://www.linkedin.com/search/results/content/?keywords=' + encodeURIComponent(`("vaga" OR "oportunidade") AND ("Design" OR "Designer" OR "Product Design" OR "Product Manager" OR "Product Owner" OR "Project Owner" OR "Agilista" OR "Project Manager" OR "Marketing" OR "Conteúdo" OR "Comunicação")`);

export function queryParaModo(categoria: Categoria, modo: SearchMode): string {
  return modo === 'jobs' ? categoria.jobsQuery : categoria.postsQuery;
}

export function urlParaModo(categoria: Categoria, modo: SearchMode): string {
  return modo === 'jobs' ? categoria.jobsUrl : categoria.postsUrl;
}

export function todasQueries(modo: SearchMode): { categoria: string; query: string; url: string }[] {
  return categorias.map(categoria => ({
    categoria: categoria.titulo,
    query: queryParaModo(categoria, modo),
    url: urlParaModo(categoria, modo),
  }));
}
