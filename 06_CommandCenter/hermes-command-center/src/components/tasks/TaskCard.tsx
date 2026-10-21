'use client';

import type { Task } from '@/types/events';

const statusTone: Record<Task['status'], string> = {
  BACKLOG: 'text-command-muted',
  READY: 'text-command-accent',
  RUNNING: 'text-command-success',
  WAITING: 'text-command-warning',
  BLOCKED: 'text-command-danger',
  DONE: 'text-command-success',
};

const priorityTone: Record<Task['priority'], string> = {
  LOW: 'text-command-muted',
  MEDIUM: 'text-command-accent',
  HIGH: 'text-command-warning',
  CRITICAL: 'text-command-danger',
};

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full command-card command-card-hover p-3 text-left ${
        task.status === 'BLOCKED' ? 'border-command-danger/60 bg-command-danger/5' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-command-text">{task.title}</div>
          <div className="text-[10px] text-command-muted">{task.project}</div>
        </div>
        <span className={`text-[10px] font-mono ${statusTone[task.status]}`}>{task.status}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-command-muted">
        <span>🤖 {task.agent}</span>
        <span className={priorityTone[task.priority]}>{task.priority}</span>
      </div>
      <div className="mt-1 text-[10px] text-command-muted">Atualizado há {formatDelta(task.updatedAt)}</div>
      {task.blocker && (
        <div className="mt-2 rounded-md border border-command-danger/40 bg-command-danger/5 p-2 text-[10px] text-command-danger">
          <div className="font-semibold">STATUS: BLOCKED</div>
          <div className="mt-0.5">MOTIVO: {task.blocker}</div>
          {task.nextAction && <div className="mt-0.5">AÇÃO: {task.nextAction}</div>}
          <button className="mt-2 rounded-lg border border-command-danger/40 bg-white px-2 py-1 text-[10px]">RESOLVER</button>
        </div>
      )}
    </button>
  );
}

function formatDelta(updatedAt: string) {
  const diff = Date.now() - new Date(updatedAt).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
