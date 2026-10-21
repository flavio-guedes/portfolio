'use client';

import { useMemo, useState } from 'react';
import type { ExecutionEvent, Task, TaskFilters } from '@/types/events';
import { TaskDetailDrawer } from '../TaskDetailDrawer';

export function TimelineView({ events, filters, onChangeFilters }: { events: ExecutionEvent[]; tasks: Task[]; filters: TaskFilters; onChangeFilters: (f: TaskFilters) => void }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const items = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let list = events;
    if (filters.assignee) list = list.filter((e) => e.actor?.toLowerCase().includes(filters.assignee.toLowerCase()));
    if (q) list = list.filter((e) => [e.message, e.actor, e.tool, e.skill].some((v) => v?.toLowerCase().includes(q)));
    return list.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [events, filters]);

  const toggle = (id: string) => setExpandedId((v) => (v === id ? null : id));
  const update = (patch: Partial<TaskFilters>) => onChangeFilters({ ...filters, ...patch });

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-wide text-command-text">TIMELINE</div>
          <div className="text-[10px] text-command-muted">Marcos e eventos operacionais</div>
        </div>
        <div className="flex items-center gap-2">
          <input value={filters.search} onChange={(e) => update({ search: e.target.value })} placeholder="Search..." className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text" />
          <input value={filters.assignee} onChange={(e) => update({ assignee: e.target.value })} placeholder="Responsável" className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          <div className="absolute left-6 top-0 h-full w-px bg-command-border" />
          <div className="space-y-2">
            {items.map((evt) => (
              <div key={evt.id} className="grid grid-cols-[48px_1fr] items-start gap-3">
                <div className="text-[10px] font-mono text-command-muted leading-5">{new Date(evt.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                <div className="rounded-lg border border-command-border bg-white p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold text-command-text">{evt.actor}</div>
                    <span className={`text-[10px] font-mono ${tone(evt.status)}`}>{evt.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-command-muted">{evt.message}</p>
                  {expandedId === evt.id && (
                    <div className="mt-2 space-y-1 border-t border-command-border pt-2 text-[10px] text-command-text">
                      <Row label="Tipo" value={evt.eventType} />
                      <Row label="Ferramenta" value={evt.tool || '—'} />
                      <Row label="Skill" value={evt.skill || '—'} />
                      <Row label="Execução" value={evt.executionId} />
                    </div>
                  )}
                  <button onClick={() => toggle(evt.id)} className="mt-2 text-[10px] text-command-accent">
                    {expandedId === evt.id ? 'Recolher' : 'Expandir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {selectedTask && <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function tone(status: string) {
  if (status === 'completed') return 'text-command-success';
  if (status === 'running') return 'text-command-accent';
  if (status === 'failed' || status === 'waiting') return 'text-command-warning';
  return 'text-command-muted';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-command-muted">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
