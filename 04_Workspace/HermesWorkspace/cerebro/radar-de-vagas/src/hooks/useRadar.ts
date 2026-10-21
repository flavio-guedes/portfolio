import { useState, useMemo, useCallback } from 'react';
import type { JobOpportunity, SearchMode, RadarStats } from '../types/opportunity';
import type { NetworkContact as NetworkContactType } from '../types/network';
import { mockOpportunities, mockContacts, recomputeScores, scoreContacts, relateContacts } from '../services/jobEngine';
import { aplicarJanela, aplicarOrdemPrioridade, deduplicar, limite, buildStats } from '../services/jobEngine';

export function useRadar() {
  const [mode, setMode] = useState<SearchMode>('jobs');
  const [updating, setUpdating] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('');
  const [result, setResult] = useState<JobOpportunity[]>([]);

  const atualizar = useCallback((proximoModo: SearchMode = mode) => {
    setUpdating(true);

    setTimeout(() => {
      const jobsBase = recomputeScores(mockOpportunities.filter(j => j.source === 'linkedin_jobs'));
      const postsBase = recomputeScores(mockOpportunities.filter(j => j.source === 'linkedin_posts'));

      const jobsLive = limite(aplicarOrdemPrioridade(deduplicar(aplicarJanela(jobsBase))));
      const postsLive = limite(aplicarOrdemPrioridade(deduplicar(aplicarJanela(postsBase))));

      const combined = deduplicar([...jobsLive, ...postsLive]);
      const ranked = aplicarOrdemPrioridade(combined);
      const top = limite(ranked);

      setResult(top);
      setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR'));
      setMode(proximoModo);
      setUpdating(false);
    }, 700);
  }, [mode]);

  const jobs = useMemo(() => result.filter(opp => opp.source === 'linkedin_jobs'), [result]);
  const posts = useMemo(() => result.filter(opp => opp.source === 'linkedin_posts'), [result]);
  const todos = useMemo(() => result, [result]);

  const networkContacts = useMemo(() => {
    const relatedJobs = deduplicar([...todos]);
    const relations = relateContacts(mockContacts, relatedJobs);
    const scored = scoreContacts(mockContacts.map(c => ({ ...c, relatedJobId: relations.find(r => r.contactId === c.id)?.jobId })));
    return scored as unknown as NetworkContactType[];
  }, [todos]);

  const stats = useMemo(() => buildStats(todos), [todos]);
  const radarStats: RadarStats = useMemo(() => ({
    ...stats,
    ultimaAtualizacao,
  }), [stats, ultimaAtualizacao]);

  return {
    jobs,
    posts,
    todos,
    mode,
    setMode,
    networkContacts,
    stats: radarStats,
    ultimaAtualizacao,
    updating,
    atualizar,
  };
}
