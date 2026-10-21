'use client';

import { useMemo, useState } from 'react';
import type { Task, Category, TaskFilters } from '@/types/events';
import { TaskDetailDrawer } from '../TaskDetailDrawer';

type Zoom = 'day' | 'week' | 'month';

export function GanttView({ tasks, filters, onChangeFilters }: { tasks: Task[]; categories: Category[]; filters: TaskFilters; onChangeFilters: (f: TaskFilters) => void }) {
  const [zoom, setZoom] = useState<Zoom>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const timeline = useMemo(() => buildTimeline(tasks, zoom), [tasks, zoom]);
  const timelineDays = useMemo(() => timeline.days, [timeline]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let list = tasks;
    if (filters.status !== 'ALL') list = list.filter((t) => t.status === filters.status);
    if (filters.priority !== 'ALL') list = list.filter((t) => t.priority === filters.priority);
    if (filters.project) list = list.filter((t) => t.project.toLowerCase().includes(filters.project.toLowerCase()));
    if (filters.assignee) list = list.filter((t) => t.agent.toLowerCase().includes(filters.assignee.toLowerCase()));
    if (filters.category !== 'ALL') list = list.filter((t) => t.category === filters.category);
    if (q) list = list.filter((t) => [t.title, t.project, t.agent].some((v) => v?.toLowerCase().includes(q)));
    return list;
  }, [tasks, filters]);

  const update = (patch: Partial<TaskFilters>) => onChangeFilters({ ...filters, ...patch });

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-wide text-command-text">GANTT</div>
          <div className="text-[10px] text-command-muted">Linha do tempo das tarefas</div>
        </div>
        <div className="flex items-center gap-2">
          <input value={filters.search} onChange={(e) => update({ search: e.target.value })} placeholder="Search..." className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text" />
          <select value={zoom} onChange={(e) => setZoom(e.target.value as Zoom)} className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text"><option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option></select>
        </div>
      </div>
      <div className="flex-1 overflow-auto rounded-lg border border-command-border">
        <div className="min-w-[720px]">
          <div className="grid border-b border-command-border bg-command-surface text-left text-[10px] text-command-muted" style={{ gridTemplateColumns: `220px repeat(${timelineDays.length}, minmax(48px, 1fr))` }}>
            <div className="px-2 py-1.5 font-semibold text-command-text">TAREFA</div>
            {timelineDays.map((day) => (
              <div key={day.key} className="px-1 py-1.5 text-center">
                <div className="font-semibold text-command-text">{day.labelDay}</div>
                <div>{day.labelMonth}</div>
              </div>
            ))}
          </div>
          <div>
            {filtered.map((task) => {
              const bar = barFor(task, timelineDays);
              return (
                <div key={task.id} onClick={() => setSelectedTask(task)} className="grid cursor-pointer border-b border-command-border hover:bg-command-surface/70" style={{ gridTemplateColumns: `220px repeat(${timelineDays.length}, minmax(48px, 1fr))` }}>
                  <div className="px-2 py-1.5">
                    <div className="text-[11px] font-semibold text-command-text">{task.title}</div>
                    <div className="text-[10px] text-command-muted">{task.agent}</div>
                  </div>
                  {timelineDays.map((day, idx) => (
                    <div key={day.key} className="relative border-l border-command-border/60">
                      {bar.start === idx && <div className={`absolute left-1 right-1 top-1 h-3 rounded-sm ${barColor(task.status)}`} style={{ width: `${Math.max(bar.width, 1) * 100}%` }} />}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {selectedTask && <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function buildTimeline(tasks: Task[], zoom: Zoom) {
  const dateStrings: string[] = [];
  tasks.forEach((t) => {
    if (t.startDate) { const d = new Date(t.startDate); if (!isNaN(d.getTime())) dateStrings.push(d.toISOString().slice(0, 10)); }
    if (t.dueDate) { const d = new Date(t.dueDate); if (!isNaN(d.getTime())) dateStrings.push(d.toISOString().slice(0, 10)); }
  });
  const sorted = dateStrings.slice().sort();
  const unique: string[] = [];
  for (let i = 0; i < sorted.length; i++) { if (i === 0 || sorted[i] !== sorted[i - 1]) unique.push(sorted[i]); }
  const base = unique.length ? new Date(unique[0]) : new Date('2026-08-13');
  const count = zoom === 'day' ? 14 : zoom === 'week' ? 14 : 12;
  const days: Array<{ key: string; labelDay: string; labelMonth: string }> = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    days.push({ key: d.toISOString(), labelDay: String(d.getDate()).padStart(2, '0'), labelMonth: d.toLocaleDateString('pt-BR', { month: 'short' }) });
  }
  return { days, start: new Date(`${days[0].key.slice(0, 10)}T00:00:00`) };
}

function barFor(task: Task, days: Array<{ key: string }>) {
  const start = task.startDate ? days.findIndex((d) => d.key.slice(0, 10) === new Date(task.startDate as string).toISOString().slice(0, 10)) : 0;
  const due = task.dueDate ? days.findIndex((d) => d.key.slice(0, 10) === new Date(task.dueDate as string).toISOString().slice(0, 10)) : start + 1;
  const width = Math.max(1, (due < 0 ? 1 : due) - (start < 0 ? 0 : start));
  return { start: start < 0 ? 0 : start, width };
}

function barColor(status: string) {
  if (status === 'BLOCKED') return 'bg-command-danger';
  if (status === 'RUNNING') return 'bg-command-text';
  if (status === 'DONE') return 'bg-command-success';
  return 'bg-command-muted';
}
