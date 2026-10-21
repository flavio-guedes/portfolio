'use client';

import { useState } from 'react';
import type { Task, Category } from '@/types/events';
import { TaskCard } from '../TaskCard';
import { TaskDetailDrawer } from '../TaskDetailDrawer';

const columns = [
  { id: 'BACKLOG', label: 'ACÚMULO DE TRABALHO' },
  { id: 'READY', label: 'PREPARAR' },
  { id: 'RUNNING', label: 'CORRENDO' },
  { id: 'WAITING', label: 'ESPERANDO' },
  { id: 'BLOCKED', label: 'BLOQUEADO' },
  { id: 'DONE', label: 'FEITO' },
];

export function KanbanView({ tasks, categories }: { tasks: Task[]; categories: Category[] }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filtered = categoryFilter === 'ALL' ? tasks : tasks.filter((t) => t.category === categoryFilter);
  const grouped = columns.reduce<Record<string, Task[]>>((acc, col) => ({ ...acc, [col.id]: [] }), {});
  for (const col of columns) {
    grouped[col.id] = filtered
      .filter((t) => t.status === col.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  return (
    <div className="h-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-command-text tracking-wide">TAREFAS</div>
          <div className="text-[11px] text-command-muted">Kanban by status</div>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-command-border bg-white px-2 py-1 text-[11px] text-command-text"
        >
          <option value="ALL">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="flex h-[calc(100%-40px)] gap-3 overflow-x-auto">
        {columns.map((col) => (
          <div key={col.id} className="min-w-[240px] flex-1 rounded-xl border border-command-border bg-command-surface/60 p-2">
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-command-text">{col.label}</span>
              <span className="text-command-muted">{grouped[col.id].length}</span>
            </div>
            <div className="space-y-2">
              {grouped[col.id].map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
