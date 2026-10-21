const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error('❌', message);
    process.exitCode = 1;
    return;
  }
  console.log('✅', message);
}

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');

// 1. Jobs queries must not contain forbidden terms
const forbidden = ['vaga', 'vagas', 'oportunidade', 'oportunidades', 'contratando', 'hiring', 'recrutando'];
const radarConfig = fs.readFileSync(path.join(src, 'data', 'radarConfig.ts'), 'utf8');
const jobsQueries = [...radarConfig.matchAll(/jobsQuery:\s*`([^`]+)`/g)].map(m => m[1]);
jobsQueries.forEach((query, idx) => {
  const q = query.toLowerCase();
  assert(!forbidden.some(term => q.includes(term)), `jobs query ${idx + 1} não contém termos proibidos`);
});

// 2. Posts queries must contain at least one hiring term
const postsQueries = [...radarConfig.matchAll(/postsQuery:\s*`([^`]+)`/g)].map(m => m[1]);
postsQueries.forEach((query, idx) => {
  const q = query.toLowerCase();
  assert(forbidden.some(term => q.includes(term)), `posts query ${idx + 1} contém pelo menos um termo de contratação`);
});

// 3. Different jobs vs posts strategies
assert(JSON.stringify(jobsQueries) !== JSON.stringify(postsQueries), 'jobs e posts possuem estratégias diferentes');

// 4. Opportunity type exists
assert(fs.existsSync(path.join(src, 'types', 'opportunity.ts')), 'type JobOpportunity existe');

// 5. Source field exists
const oppType = fs.readFileSync(path.join(src, 'types', 'opportunity.ts'), 'utf8');
assert(oppType.includes('linkedin_jobs') && oppType.includes('linkedin_posts'), 'source identifiers presentes');

// 6. Dedup engine exists
const engine = fs.readFileSync(path.join(src, 'services', 'jobEngine.ts'), 'utf8');
assert(engine.includes('deduplicar'), 'função deduplicar existe');

// 7. Recency <=10 exists in both engines/modes via config
assert(radarConfig.includes('janelaMaximaMinutos: 10'), 'janela de recência <=10 minutos configurada');

// 8. Build artifacts
assert(fs.existsSync(path.join(root, 'dist', 'index.html')), 'build artifact dist/index.html existe');

console.log('\n=== Validação concluída ===');
