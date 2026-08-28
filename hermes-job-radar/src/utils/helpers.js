export function badgeForJob(job) {
  if (job.seniority === 'HEAD') return '🔥 HEAD';
  if (job.seniority === 'DIRETOR') return '👑 DIRETOR';
  if (job.seniority === 'LEAD') return '⚡ LEAD';
  if (job.seniority === 'COORDENADOR') return '🎯 COORDENADOR';
  if (job.seniority === 'SENIOR') return '🏆 SÊNIOR';
  if (job.seniority === 'PLENO') return '📈 PLENO';
  return '🌱 JÚNIOR';
}

export function modalityBadge(modality) {
  if (modality === 'REMOTO') return '🌎 REMOTO';
  if (modality === 'HÍBRIDO') return '🏢 HÍBRIDO';
  return '📍 PRESENCIAL';
}

export function recencyBadge(job) {
  const minutes = computeJobAgeMinutes(job);
  if (minutes <= 10) return '⚡ LIVE';
  if (minutes <= 60) return '🟢 FRESH';
  if (minutes <= 24 * 60) return '🔵 TODAY';
  return '⚪ OLDER';
}

export function computeJobAgeMinutes(job) {
  const postedAt = new Date(job.postedAt).getTime();
  if (Number.isNaN(postedAt)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - postedAt) / 60000));
}

export function formatJobAge(job) {
  const minutes = computeJobAgeMinutes(job);
  if (minutes <= 10) return 'há poucos minutos';
  if (minutes === 1) return 'há 1 min';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'há 1h';
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'há 1 dia';
  return `há ${days} dias`;
}

export function shortMatchReasons(reasons, max = 2) {
  if (!Array.isArray(reasons)) return '';
  const unique = Array.from(new Set(reasons));
  return unique.slice(0, max).join(' ');
}

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
