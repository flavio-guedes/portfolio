import { categorias } from '../data/radarConfig';

const hiringTerms = ['vaga', 'vagas', 'oportunidade', 'oportunidades', 'contratando', 'hiring', 'recrutando', 'recrutamento', 'processo seletivo', 'processo de seleção', 'estamos contratando', 'estamos buscando', 'buscamos', 'procuramos', 'vem trabalhar', 'candidate-se', 'envie seu currículo', 'envie currículo', 'currículo', 'contratação'];

function containsHiring(query: string) {
  const q = query.toLowerCase();
  return hiringTerms.some(term => q.includes(term));
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const categoria of categorias) {
  assert(!containsHiring(categoria.jobsQuery), `Jobs query contém termo de contratação em ${categoria.id}: ${categoria.jobsQuery}`);
  assert(containsHiring(categoria.postsQuery), `Posts query NÃO contém termo de contratação em ${categoria.id}: ${categoria.postsQuery}`);
}

console.log('✅ Queries válidas: jobs sem termos de contratação e posts com termos de contratação.');
