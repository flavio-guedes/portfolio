const fs = require('fs');
const path = require('path');

const hiringTerms = ['vaga', 'vagas', 'oportunidade', 'oportunidades', 'contratando', 'hiring', 'recrutando', 'recrutamento', 'processo seletivo', 'processo de seleção', 'estamos contratando', 'estamos buscando', 'buscamos', 'procuramos', 'vem trabalhar', 'candidate-se', 'envie seu currículo', 'envie currículo', 'currículo', 'contratação'];
const categoryTerms = ['Head de Design','Head of Design','Design Director','Diretor de Design','Design Lead','Product Lead','Head de Marketing','Head of Marketing','Head de Conteúdo','Head of Content','Product Manager','Product Designer','Product Owner','Project Owner','Agilista','UX Designer','UI Designer','Product Design','Product Design JR','Motion Designer','Visual Designer','Designer Gráfico','Designer','Art Director','Diretor de Arte','Diretor Criativo','Product Manager JR','Product Manager Pleno','Analista de Produto','Product Analyst','APM','Agilista JR','Agilista Pleno','Agile','Agile Lead','Agile Manager','Scrum Master','Project Manager','Project Owner','Gestor de Projetos','Gerente de Projetos','Coordenador de Projetos','Project Lead','Project Director','Marketing Director','Marketing Manager','Head de Comunicação','Content Director','Content Lead','Brand Manager','Social Media','Copywriter','Criação','Redator'];

function safeLower(query) {
  return typeof query === 'string' ? query.toLowerCase() : '';
}

function containsHiring(query) {
  const q = safeLower(query);
  return hiringTerms.some(term => q.includes(term));
}

function countCategoryTerms(query) {
  const q = safeLower(query);
  return categoryTerms.filter(term => q.includes(term)).length;
}

function countHiringTerms(query) {
  const q = safeLower(query);
  return hiringTerms.filter(term => q.includes(term)).length;
}

const filePath = path.join(__dirname, '..', 'src', 'data', 'radarConfig.ts');
const content = fs.readFileSync(filePath, 'utf8');

const jobsMatches = [...content.matchAll(/jobsQuery:\s*`([^`]+)`/g)].map(m => m[1]).filter(Boolean);
const postsMatches = [...content.matchAll(/postsQuery:\s*`([^`]+)`/g)].map(m => m[1]).filter(Boolean);

if (jobsMatches.length !== postsMatches.length) {
  console.error(`❌ Quantidade de jobsQuery e postsQuery divergentes: ${jobsMatches.length} vs ${postsMatches.length}`);
  process.exit(1);
}

let errors = 0;
for (let i = 0; i < jobsMatches.length; i++) {
  const jobsQuery = jobsMatches[i];
  const postsQuery = postsMatches[i];
  
  if (containsHiring(jobsQuery)) {
    console.error(`Jobs query contém termo de contratação: ${jobsQuery}`);
    errors++;
  }
  
  if (!containsHiring(postsQuery)) {
    console.error(`Posts query NÃO contém termo de contratação: ${postsQuery}`);
    errors++;
  }
  
  const hiringCount = countHiringTerms(postsQuery);
  if (hiringCount > 2) {
    console.error(`Posts query ultrapassa 2 termos de contratação (encontrados: ${hiringCount}): ${postsQuery}`);
    errors++;
  }
  
  if (countCategoryTerms(postsQuery) > 7) {
    console.error(`Posts query ultrapassa 7 termos principais: ${postsQuery}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`❌ ${errors} erro(s) nas queries.`);
  process.exit(1);
}

console.log('✅ Queries válidas: jobs sem termos de contratação, posts com até 2 termos de contratação e até 7 termos principais.');
