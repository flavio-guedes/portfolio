'use client';

import { motion } from 'framer-motion';
import { Mission } from '@/types/events';
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function MissionView({ mission }: { mission: Mission }) {
  const elapsed = useMemo(() => {
    if (!mission.startedAt) return '—';
    const s = Math.floor((Date.now() - new Date(mission.startedAt).getTime()) / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  }, [mission.startedAt]);

  return (
    <div className="h-full">
      <div className="px-4 py-3">
        <div className="text-xs font-semibold text-command-text">MISSION STATUS</div>
        <div className="text-[11px] text-command-muted">Current execution context</div>
      </div>
      <div className="px-4 pb-4 space-y-4">
        <div className="space-y-1">
          <Field label="MISSION" value={mission.name} />
          <Field label="STATUS" value={mission.status} />
          <Field label="STARTED" value={mission.startedAt ? formatDistanceToNow(new Date(mission.startedAt), { addSuffix: true, locale: ptBR }) : '—'} />
          <Field label="ELAPSED" value={elapsed} />
          <Field label="CURRENT AGENT" value={mission.currentAgent || '—'} />
          <Field label="CURRENT SKILL" value={mission.currentSkill || '—'} />
          <Field label="CURRENT TOOL" value={mission.currentTool || '—'} />
          <Field label="GOVERNANCE" value={mission.governance} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-command-muted">
            <span>Progress</span>
            <span className="font-mono text-command-text">{mission.progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-command-border">
            <motion.div
              className="h-full rounded-full bg-command-accent"
              initial={{ width: 0 }}
              animate={{ width: `${mission.progress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[10px] text-command-muted">{label}</span>
      <span className="text-right text-[11px] text-command-text">{value}</span>
    </div>
  );
}
