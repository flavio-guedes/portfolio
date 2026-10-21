'use client';

import { useState } from 'react';
import type { Task, Category, TaskFilters, ExecutionEvent } from '@/types/events';
import { KanbanView } from './KanbanView';
import { ListView } from './ListView';
import { CalendarView } from './CalendarView';
import { GanttView } from './GanttView';
import { TimelineView } from './TimelineView';

const views = [
  { id: 'kanban', label: 'KANBAN' },
  { id: 'list', label: 'LISTA' },
  { id: 'calendar', label: 'CALENDÁRIO' },
  { id: 'gantt', label: 'GANTT' },
  { id: 'timeline', label: 'TIMELINE' },
];

export function DashboardViews({ tasks, categories, events }: { tasks: Task[]; categories: Category[]; events: ExecutionEvent[] }) {
  const [view, setView] = useState<string>('kanban');
  const [filters, setFilters] = useState<TaskFilters>({ search: '', status: 'ALL', assignee: '', priority: 'ALL', project: '', category: 'ALL' });

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {views.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)} className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${view === v.id ? 'border-command-text bg-command-text text-white' : 'border-command-border bg-white text-command-muted hover:text-command-text'}`}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Buscar..." className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text" />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text"><option value="ALL">Status</option><option value="BACKLOG">ACÚMULO</option><option value="READY">PREPARAR</option><option value="RUNNING">CORRENDO</option><option value="WAITING">ESPERANDO</option><option value="BLOCKED">BLOQUEADO</option><option value="DONE">FEITO</option></select>
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text"><option value="ALL">Prioridade</option><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option></select>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text"><option value="ALL">Categorias</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {view === 'kanban' && <KanbanView tasks={tasks} categories={categories} />}
        {view === 'list' && <ListView tasks={tasks} categories={categories} filters={filters} onChangeFilters={setFilters} />}
        {view === 'calendar' && <CalendarView tasks={tasks} />}
        {view === 'gantt' && <GanttView tasks={tasks} categories={categories} filters={filters} onChangeFilters={setFilters} />}
        {view === 'timeline' && <TimelineView events={events} tasks={tasks} filters={filters} onChangeFilters={setFilters} />}
      </div>
    </div>
  );
}
