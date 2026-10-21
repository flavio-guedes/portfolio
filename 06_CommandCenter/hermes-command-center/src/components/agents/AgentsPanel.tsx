'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Agent } from '@/types/events';

export function AgentsPanel({ agents }: { agents: Agent[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedAgent = selected ? agents.find((a) => a.id === selected) : null;

  return (
    <div className="h-full">
      <div className="mb-3 px-1">
        <div className="text-xs font-semibold text-command-text">AGENTS</div>
        <div className="text-[11px] text-command-muted">Active topology</div>
      </div>
      <div className="space-y-1">
        {agents.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelected(a.id)}
            className={`w-full rounded-lg border px-3 py-2 text-left transition ${
              selected === a.id ? 'border-command-accent/40 bg-command-elevated' : 'border-command-border bg-command-elevated/60 hover:border-command-accent/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-command-text">{a.name}</div>
                <div className="text-[10px] text-command-muted">{a.role}</div>
              </div>
              <StatusChip status={a.status} />
            </div>
          </button>
        ))}
      </div>
      {selectedAgent && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-lg border border-command-border bg-command-elevated/70 p-3">
          <div className="text-[11px] font-semibold text-command-text">{selectedAgent.name}</div>
          <div className="mt-2 space-y-1 text-[11px] text-command-muted">
            <div>Status: {selectedAgent.status}</div>
            <div>Mission: {selectedAgent.mission || '—'}</div>
            <div>Skills: {selectedAgent.skills?.join(', ') || '—'}</div>
            <div>Tools: {selectedAgent.tools?.join(', ') || '—'}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const color =
    status === 'ACTIVE' || status === 'RUNNING' ? 'text-command-success'
      : status === 'IDLE' ? 'text-command-muted'
        : status === 'REQUIRES_APPROVAL' || status === 'BLOCKED' ? 'text-command-danger'
          : 'text-command-warning';
  return (
    <span className={`text-[10px] font-mono ${color}`}>
      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
