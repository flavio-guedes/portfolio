import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * EVOLUTION 01-05 acceptance gate
 */

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');
const results = [];

function check(name, condition, detail) {
  results.push({ name, pass: condition, detail });
}

// EVOLUTION 01 checks
check('detail element exists', html.includes('id="detail"'), 'Painel de detalhes presente no DOM');
check('.status-bar CSS exists', html.includes('.status-bar {') && html.includes('flex-shrink: 0'), 'Regra .status-bar com dimensões e flex-shrink');
check('.status-fill CSS exists', html.includes('.status-fill {') && html.includes('background: linear-gradient(90deg, var(--cyan), var(--green))'), 'Regra .status-fill com gradiente');
check('.panel-title--compact exists', html.includes('.panel-title--compact'), 'Modificador compacto para título de KPI existe');
check('skill chip class is correct', html.includes("const maturityClass = skill.maturity === 'high' ? 'ok'") && html.includes('class="chip ${maturityClass}"') && !['chip chip ok', 'chip chip warn', 'chip chip plan'].some(s => html.includes(s)), 'Skill chip usa sufixo sem duplicar chip');
check('no #viewport reference', !html.includes("getElementById('viewport')"), 'Sem referência a viewport inexistente');
check('KPIs have data-target', html.includes('data-target="ecosystem"') && html.includes('data-target="insights"'), 'KPIs do header possuem data-target');
check('no inline status-row cssText', !html.includes('row.style.cssText'), 'Linhas de maturidade sem style.cssText inline');
check('header panels are clickable', html.includes('panel[data-target]') && html.includes('switchTab(panel.dataset.target)'), 'Painéis do header são clicáveis');

// EVOLUTION 02 checks
check('competencies tab exists', html.includes('data-tab="competencies"'), 'Aba Competências existe');
check('competencies render function exists', html.includes('function renderCompetencies()'), 'Função de renderização de competências existe');
check('radar shows data context', html.includes('Maturidade média') && html.includes('Ecossistema') && html.includes('Próximos passos'), 'Raio-X mostra ecossistema, maturidade média, alertas e próximos passos');

// EVOLUTION 03 checks
check('severity classes exist', html.includes('severity-high') && html.includes('severity-mid') && html.includes('severity-low'), 'Classes de severidade visual existem');
check('insights use severity classes', html.includes('severity-${ins.severity}'), 'Insights aplicam classe de severidade');
check('high severity is visually distinct', html.includes('box-shadow') && html.includes('rgba(248,113,113,0.15)'), 'Severidade alta tem destaque visual');
check('insights are sorted by severity', html.includes("order[a.severity] ?? 9") && html.includes("order[b.severity] ?? 9"), 'Insights são ordenados por severidade');
check('KPIs have contextual subtext', html.includes('metric-ecosystem-sub') && html.includes('metric-skills-sub') && html.includes('metric-frameworks-sub') && html.includes('metric-alerts-sub'), 'KPIs possuem subtítulo contextual');
check('alerts KPI has context', html.includes('crítico(s)'), 'KPI de alertas mostra contagem crítica');

// EVOLUTION 04 checks
check('brain has state class', html.includes('state-${state}') && html.includes('brain-svg.state-radar'), 'Brain SVG tem classe de estado para affordance');
check('non-radar brain has reduced glow', html.includes('.brain-svg:not(.state-radar):hover') && html.includes('filter: none'), 'Hover glow desativado fora do radar');
check('filters exist for skills', html.includes('id="skill-filters"'), 'Filtros existem para skills');
check('filters exist for frameworks', html.includes('id="framework-filters"'), 'Filtros existem para frameworks');
check('filters exist for insights', html.includes('id="insight-filters"'), 'Filtros existem para insights');

// EVOLUTION 05 checks
check('clickable items have role=button', html.includes("setAttribute('role', 'button')") || html.includes('role="button"'), 'Elementos clicáveis tem role=button');
check('clickable items have tabindex=0', html.includes("setAttribute('tabindex', '0')") || html.includes('tabindex="0"'), 'Elementos clicáveis tem tabindex=0');
check('keyboard activation exists', html.includes("e.key === 'Enter'") && html.includes("e.key === ' '"), 'Ativação por teclado Enter/Space existe');
check('text-muted contrast improved', html.includes('--text-muted: #a0c4e0'), 'Token --text-muted ajustado para contraste AA');
check('focus visible styles exist', html.includes(':focus-visible') || html.includes(':focus'), 'Estilos de foco visível existem');

// EVOLUTION 06 checks
check('command bar exists', html.includes('id="command-input"') && html.includes('id="command-results"'), 'Central Command Bar existe');
check('insights have actions', html.includes('insight-actions') && html.includes('data-action="mark-read"'), 'Insights tem ações associadas');
check('feedback mechanism exists', html.includes('insight-feedback') && html.includes('showFeedback'), 'Mecanismo de feedback existe');
check('commands include navigation', html.includes("label: 'Ir para Insights'") && html.includes("label: 'Ir para Ecossistema'"), 'Comandos incluem navegação');
check('commands include actions', html.includes("label: 'Marcar insight como visto'") && html.includes("label: 'Criar próximo passo'"), 'Comandos incluem ações');

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass);

console.log(`\n=== EVOLUTION 01-05 Eval ===`);
console.log(`Passed: ${passed}/${results.length}\n`);

results.forEach(r => {
  const status = r.pass ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${r.name}: ${r.detail}`);
});

if (failed.length > 0) {
  console.log(`\n${failed.length} check(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
  process.exit(0);
}
