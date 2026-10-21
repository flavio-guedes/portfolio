'use client';

import { useState, useMemo } from 'react';
import type { Task, Category, TaskFilters } from '@/types/events';
import { TaskDetailDrawer } from '../TaskDetailDrawer';

const statuses = ['ALL','BACKLOG','READY','RUNNING','WAITING','BLOCKED','DONE'];
const priorities = ['ALL','LOW','MEDIUM','HIGH','CRITICAL'];

export function ListView({ tasks, categories, filters, onChangeFilters }: { tasks: Task[]; categories: Category[]; filters: TaskFilters; onChangeFilters: (f: TaskFilters) => void }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sortKey, setSortKey] = useState<string>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let list = tasks;
    if (filters.status !== 'ALL') list = list.filter((t) => t.status === filters.status);
    if (filters.priority !== 'ALL') list = list.filter((t) => t.priority === filters.priority);
    if (filters.project) list = list.filter((t) => t.project.toLowerCase().includes(filters.project.toLowerCase()));
    if (filters.assignee) list = list.filter((t) => t.agent.toLowerCase().includes(filters.assignee.toLowerCase()));
    if (filters.category !== 'ALL') list = list.filter((t) => t.category === filters.category);
    if (q) list = list.filter((t) => [t.title, t.project, t.agent, t.status, t.priority, t.blocker, t.nextAction].some((v) => v?.toLowerCase().includes(q)));
    return [...list].sort((a, b) => {
      const av = a[sortKey as keyof Task];
      const bv = b[sortKey as keyof Task];
      const cmp = typeof av === 'string' && typeof bv === 'string' ? av.localeCompare(bv) : typeof av === 'number' && typeof bv === 'number' ? av - bv : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [tasks, filters, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    setSortDir((d) => (sortKey === key ? (d === 'asc' ? 'desc' : 'asc') : 'desc'));
    setSortKey(key);
  };

  const header = (label: string, key: string) => (
    <button onClick={() => toggleSort(key)} className={`text-[10px] font-semibold ${sortKey === key ? 'text-command-text' : 'text-command-muted'}`}>
      {label} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </button>
  );

  const update = (patch: Partial<TaskFilters>) => onChangeFilters({ ...filters, ...patch });

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-wide text-command-text">LISTA</div>
          <div className="text-[10px] text-command-muted">Compact table view</div>
        </div>
        <div className="flex items-center gap-2">
          <input value={filters.search} onChange={(e) => update({ search: e.target.value })} placeholder="Search..." className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text" />
          <select value={filters.status} onChange={(e) => update({ status: e.target.value })} className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text">{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <select value={filters.priority} onChange={(e) => update({ priority: e.target.value })} className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text">{priorities.map((p) => <option key={p} value={p}>{p}</option>)}</select>
          <select value={filters.category} onChange={(e) => update({ category: e.target.value })} className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text"><option value="ALL">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
      </div>
      <div className="flex-1 overflow-auto rounded-lg border border-command-border">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-command-border bg-command-surface text-left">
              <th className="px-2 py-1.5">{header('STATUS', 'status')}</th>
              <th className="px-2 py-1.5">{header('PROJETO', 'project')}</th>
              <th className="px-2 py-1.5">{header('TAREFA', 'title')}</th>
              <th className="px-2 py-1.5">{header('RESPONSÁVEL', 'agent')}</th>
              <th className="px-2 py-1.5">{header('PRIORIDADE', 'priority')}</th>
              <th className="px-2 py-1.5">{header('INÍCIO', 'startDate')}</th>
              <th className="px-2 py-1.5">{header('PRAZO', 'dueDate')}</th>
              <th className="px-2 py-1.5">{header('PROGRESSO', 'progress')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <tr key={task.id} onClick={() => setSelectedTask(task)} className="cursor-pointer border-b border-command-border hover:bg-command-surface/70">
                <td className={`px-2 py-1.5 ${statusTone(task.status)}`}>{task.status}</td>
                <td className="px-2 py-1.5 text-command-text">{task.project}</td>
                <td className="px-2 py-1.5 text-command-text">{task.title}</td>
                <td className="px-2 py-1.5 text-command-muted">{task.agent}</td>
                <td className="px-2 py-1.5">{priorityTone(task.priority)}</td>
                <td className="px-2 py-1.5 text-command-muted">{fmt(task.startDate)}</td>
                <td className="px-2 py-1.5 text-command-muted">{fmt(task.dueDate)}</td>
                <td className="px-2 py-1.5">{progressBar(task.progress)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedTask && <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function statusTone(status: string) {
  if (status === 'BLOCKED') return 'text-command-danger';
  if (status === 'DONE') return 'text-command-success';
  if (status === 'RUNNING') return 'text-command-accent';
  return 'text-command-muted';
}

function priorityTone(p: string) {
  if (p === 'CRITICAL') return 'text-command-danger';
  if (p === 'HIGH') return 'text-command-warning';
  if (p === 'MEDIUM') return 'text-command-accent';
  return 'text-command-muted';
}

function progressBar(v?: number) {
  const p = v ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-command-border">
        <div className="h-full bg-command-text" style={{ width: `${Math.min(100, p)}%` }} />
      </div>
      <span className="font-mono text-[10px] text-command-muted">{p}%</span>
    </div>
  );
}

function fmt(v?: string) {
  if (!v) return '—';
  return new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
