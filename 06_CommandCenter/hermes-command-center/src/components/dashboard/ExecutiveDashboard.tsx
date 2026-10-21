'use client';

import { useMemo } from 'react';
import type { KPIs, ApprovalRequest } from '@/types/events';

export function ExecutiveDashboard({ kpis, mission, approvals }: { kpis: KPIs; mission: { name: string; status: string; progress: number; governance: string }; approvals: ApprovalRequest[] }) {
  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING').length;
  const stats = useMemo(() => [
    { label: 'MISSÕES', value: kpis.totalMissions },
    { label: 'EM EXECUÇÃO', value: kpis.running },
    { label: 'BLOQUEADAS', value: kpis.blocked, tone: 'danger' as const },
    { label: 'CONCLUÍDAS', value: kpis.completed },
    { label: 'AGENTES ATIVOS', value: kpis.activeAgents },
    { label: 'TAREFAS HOJE', value: kpis.recentExecutions },
    { label: 'ALERTAS', value: kpis.alerts, tone: 'warning' as const },
    { label: 'PENDÊNCIAS', value: pendingApprovals + kpis.waitingApproval, tone: pendingApprovals ? 'warning' as const : undefined },
  ], [kpis, pendingApprovals]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="command-card hud-corner px-4 py-3">
            <div className="text-[11px] font-medium tracking-wide text-command-muted">{stat.label}</div>
            <div className={`mt-1 text-2xl font-semibold tracking-tight ${stat.tone === 'danger' ? 'text-command-danger' : stat.tone === 'warning' ? 'text-command-warning' : 'text-command-text'}`}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="futuristic-line" />
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-command-muted">
        <div>
          <span className="text-command-text">Missão atual:</span> {mission.name}
        </div>
        <div>
          <span className="text-command-text">Status:</span> {mission.status}
        </div>
        <div>
          <span className="text-command-text">Progresso:</span> {mission.progress}%
        </div>
        <div>
          <span className="text-command-text">Governança:</span> {mission.governance}
        </div>
      </div>
    </div>
  );
}
