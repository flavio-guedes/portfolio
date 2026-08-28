export const pipelineStages = Object.freeze([
  'RADAR',
  'INTERESSANTE',
  'SALVA',
  'CANDIDATEI',
  'CONTATO',
  'ENTREVISTA',
  'PROCESSO',
  'OFERTA',
  'RECUSADO'
]);

export const stageLabels = Object.freeze({
  RADAR: '📡 Radar',
  INTERESSANTE: '🔍 Interessante',
  SALVA: '⭐ Salva',
  CANDIDATEI: '📤 Candidaturei',
  CONTATO: '📞 Contato',
  ENTREVISTA: '🎙 Entrevista',
  PROCESSO: '📋 Processo',
  OFERTA: '💰 Oferta',
  RECUSADO: '❌ Recusado'
});

export function nextStage(current) {
  const idx = pipelineStages.indexOf(current);
  if (idx < 0) return 'RADAR';
  if (idx >= pipelineStages.length - 1) return 'RECUSADO';
  return pipelineStages[idx + 1];
}

export function isTerminalStage(stage) {
  return stage === 'OFERTA' || stage === 'RECUSADO';
}
