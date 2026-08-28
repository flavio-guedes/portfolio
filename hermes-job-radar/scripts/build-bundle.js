import fs from 'fs';
import path from 'path';

const workspace = path.resolve('/Users/mac/HermesWorkspace/hermes-job-radar');
const previewDir = path.join(workspace, 'preview');

const modules = [
  'scoring.config.js',
  'src/domain/job.js',
  'src/profile/profile.js',
  'src/scoring/engine.js',
  'src/filters/engine.js',
  'src/pipeline/stage.js',
  'src/storage/store.js',
  'src/utils/helpers.js',
  'src/adapters/manual-source.js',
  'src/adapters/mock-source.js',
  'src/adapters/input-parser.js',
  'src/services/radar.js',
  'src/services/app.js'
];

function stripModuleSyntax(content) {
  return content
    .split('\n')
    .filter((line) => !line.trim().startsWith('import ') && !line.trim().startsWith('export '))
    .join('\n');
}

function ensureUniqueNames(content, namespace) {
  const prefix = namespace.replace(/[^a-zA-Z0-9]/g, '_');
  const replaced = content.replace(/^(export\s+)?(const|let|var|function|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, (match, exportKeyword, kind, name) => {
    const newName = `${prefix}__${name}`;
    const rest = match.slice((exportKeyword || '').length).replace(name, newName);
    return `${kind} ${newName}`;
  });
  return replaced;
}

function updateCalls(content, namespace) {
  const prefix = namespace.replace(/[^a-zA-Z0-9]/g, '_');
  const replacements = [
    ['scoringConfig', `${prefix}__scoringConfig`],
    ['createNormalizedJob', `${prefix}__createNormalizedJob`],
    ['normalizeSeniority', `${prefix}__normalizeSeniority`],
    ['normalizeModality', `${prefix}__normalizeModality`],
    ['normalizeTimestamp', `${prefix}__normalizeTimestamp`],
    ['clampNumber', `${prefix}__clampNumber`],
    ['classifyRecency', `${prefix}__classifyRecency`],
    ['computeJobAgeMinutes', `${prefix}__computeJobAgeMinutes`],
    ['priorityModality', `${prefix}__priorityModality`],
    ['seniorityScoreMap', `${prefix}__seniorityScoreMap`],
    ['defaultProfile', `${prefix}__defaultProfile`],
    ['matchProfile', `${prefix}__matchProfile`],
    ['clampProfileScore', `${prefix}__clampProfileScore`],
    ['buildOpportunityScore', `${prefix}__buildOpportunityScore`],
    ['passesFilters', `${prefix}__passesFilters`],
    ['pipelineStages', `${prefix}__pipelineStages`],
    ['stageLabels', `${prefix}__stageLabels`],
    ['nextStage', `${prefix}__nextStage`],
    ['isTerminalStage', `${prefix}__isTerminalStage`],
    ['loadStore', `${prefix}__loadStore`],
    ['saveStore', `${prefix}__saveStore`],
    ['createEmptyStore', `${prefix}__createEmptyStore`],
    ['badgeForJob', `${prefix}__badgeForJob`],
    ['modalityBadge', `${prefix}__modalityBadge`],
    ['recencyBadge', `${prefix}__recencyBadge`],
    ['formatJobAge', `${prefix}__formatJobAge`],
    ['shortMatchReasons', `${prefix}__shortMatchReasons`],
    ['escapeHtml', `${prefix}__escapeHtml`],
    ['ManualJobSource', `${prefix}__ManualJobSource`],
    ['MockJobSource', `${prefix}__MockJobSource`],
    ['buildMockJobs', `${prefix}__buildMockJobs`],
    ['RadarEngine', `${prefix}__RadarEngine`],
    ['createApp', `${prefix}__createApp`],
    ['buildManualInput', `${prefix}__buildManualInput`],
    ['parseImportedText', `${prefix}__parseImportedText`],
    ['countQueryTerms', `${prefix}__countQueryTerms`],
    ['validateQuery', `${prefix}__validateQuery`],
    ['splitIntoValidQueries', `${prefix}__splitIntoValidQueries`],
    ['buildQueries', `${prefix}__buildQueries`]
  ];

  for (const [original, replacement] of replacements) {
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    content = content.replace(regex, replacement);
  }

  return content;
}

const bundleParts = [];
for (const file of modules) {
  let content = fs.readFileSync(path.join(workspace, file), 'utf8');
  content = stripModuleSyntax(content);
  const namespace = path.basename(file, path.extname(file));
  content = ensureUniqueNames(content, namespace);
  content = updateCalls(content, namespace);
  bundleParts.push(`// --- ${file} ---\n${content}\n`);
}

let appContent = fs.readFileSync(path.join(previewDir, 'app.js'), 'utf8');
appContent = stripModuleSyntax(appContent);
appContent = ensureUniqueNames(appContent, 'app');
appContent = updateCalls(appContent, 'app');
bundleParts.push(`// --- preview/app.js ---\n${appContent}\n`);

const bundle = bundleParts.join('\n');
fs.writeFileSync(path.join(previewDir, 'bundle-app.js'), bundle);
console.log('Bundle atualizado.');
