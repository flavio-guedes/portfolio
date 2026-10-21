export function minutosDesde(publicadoEm: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(publicadoEm).getTime()) / 60000));
}

export function formatarMinutos(minutos: number): string {
  if (minutos === 1) return 'há 1 min';
  return `há ${minutos} min`;
}
