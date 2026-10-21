const mockJobs = [
  { id: 'm1', titulo: 'Head de Design', senioridade: 'HEAD', modalidade: 'REMOTO', area: 'Design', aderencia: 'Muito alta', descricaoClara: true, empresaIdentificada: true, linkCandidatura: true, publicadoEm: new Date(Date.now() - 1*60000).toISOString(), url: 'https://linkedin.com/jobs/view/1' },
  { id: 'm10', titulo: 'Product Designer JR', senioridade: 'JÚNIOR', modalidade: 'HÍBRIDO', area: 'Product Design', aderencia: 'Média', descricaoClara: true, empresaIdentificada: true, linkCandidatura: true, publicadoEm: new Date(Date.now() - 11*60000).toISOString(), url: 'https://linkedin.com/jobs/view/10' },
  { id: 'm2', titulo: 'Diretor Criativo', senioridade: 'DIRETOR', modalidade: 'REMOTO', area: 'Design', aderencia: 'Alta', descricaoClara: true, empresaIdentificada: true, linkCandidatura: true, publicadoEm: new Date(Date.now() - 3*60000).toISOString(), url: 'https://linkedin.com/jobs/view/2' },
  { id: 'm2', titulo: 'Diretor Criativo', senioridade: 'DIRETOR', modalidade: 'REMOTO', area: 'Design', aderencia: 'Alta', descricaoClara: true, empresaIdentificada: true, linkCandidatura: true, publicadoEm: new Date(Date.now() - 3*60000).toISOString(), url: 'https://linkedin.com/jobs/view/2' },
];

function score(job) {
  const peso = { HEAD: 50, DIRETOR: 45, LEAD: 40, COORDENADOR: 35, 'SÊNIOR': 30, PLENO: 20, JÚNIOR: 10 };
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(job.publicadoEm).getTime()) / 60000));
  const recencia = minutos <= 2 ? 30 : minutos <= 5 ? 25 : minutos <= 8 ? 20 : minutos <= 10 ? 15 : 0;
  const modalidade = job.modalidade === 'REMOTO' ? 25 : job.modalidade === 'HÍBRIDO' ? 15 : 5;
  const aderencia = job.aderencia === 'Muito alta' ? 20 : job.aderencia === 'Alta' ? 15 : job.aderencia === 'Média' ? 10 : 0;
  const qualidade = (job.descricaoClara ? 5 : 0) + (job.empresaIdentificada ? 5 : 0) + (job.linkCandidatura ? 5 : 0);
  return (peso[job.senioridade] || 0) + recencia + modalidade + aderencia + qualidade;
}

function dedup(items) {
  const vistos = new Set();
  const out = [];
  for (const j of items) {
    const chave = `${j.empresa}||${j.titulo}||${j.url}`.toLowerCase();
    const chave2 = `${j.empresa}||${j.titulo}`.toLowerCase();
    if (vistos.has(chave) || vistos.has(chave2)) continue;
    vistos.add(chave); vistos.add(chave2);
    out.push(j);
  }
  return out;
}

function windowFilter(items) {
  return items.filter(j => Math.max(0, Math.floor((Date.now() - new Date(j.publicadoEm).getTime()) / 60000)) <= 10);
}

function ordenar(items) {
  return [...items].sort((a,b) => score(b) - score(a)).slice(0,10);
}

const antes = [...mockJobs];
const deduped = dedup(antes);
const filtrados = windowFilter(deduped);
const ordenados = ordenar(filtrados);

console.log('total:', antes.length);
console.log('dedup:', deduped.length);
console.log('janela:', filtrados.length);
console.log('limit:', ordenados.length);
console.log('scores:', ordenados.map(j => ({ id: j.id, score: score(j) })));
console.log('removidos vaga >10min:', antes.some(j => score(j) === 0));
