'use client';

import { useMemo, useState } from 'react';
import type { Task } from '@/types/events';
import { TaskDetailDrawer } from '../TaskDetailDrawer';

type Day = { date: Date; tasks: Task[] };

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const [cursor, setCursor] = useState<Date>(new Date('2026-08-13'));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');

  const days = useMemo(() => buildDays(cursor, view, tasks), [cursor, view, tasks]);

  const prev = () => setCursor((d) => addDate(d, view === 'month' ? -1 : -7));
  const next = () => setCursor((d) => addDate(d, view === 'month' ? 1 : 7));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-wide text-command-text">CALENDÁRIO</div>
          <div className="text-[10px] text-command-muted">Visualização por data</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text">←</button>
          <span className="text-[11px] font-semibold text-command-text">{formatRange(cursor, view)}</span>
          <button onClick={next} className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text">→</button>
          <select value={view} onChange={(e) => setView(e.target.value as 'month' | 'week')} className="rounded-md border border-command-border bg-white px-2 py-1 text-[10px] text-command-text"><option value="month">Mês</option><option value="week">Semana</option></select>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-7 gap-2 overflow-hidden">
        {days.map((day, idx) => (
          <div key={idx} className={`flex flex-col overflow-hidden rounded-lg border bg-command-surface ${day.date.toDateString() === new Date('2026-08-13').toDateString() ? 'border-command-text' : 'border-command-border'}`}>
            <div className="border-b border-command-border px-1 py-1 text-center text-[10px] text-command-muted">
              <div className="font-semibold text-command-text">{formatDate(day.date)}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
              <div className="space-y-1">
                {day.tasks.map((task) => (
                  <button key={task.id} onClick={() => setSelectedTask(task)} className={`w-full rounded-md border bg-white p-1.5 text-left ${task.status === 'BLOCKED' ? 'border-command-danger/40 bg-command-danger/5' : 'border-command-border'}`}>
                    <div className="text-[10px] font-semibold text-command-text">{task.title}</div>
                    <div className="text-[9px] text-command-muted">{task.agent}</div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-command-border">
                      <div className={`h-full ${task.status === 'BLOCKED' ? 'bg-command-danger' : 'bg-command-text'}`} style={{ width: `${task.progress ?? 0}%` }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedTask && <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function buildDays(cursor: Date, view: 'month' | 'week', tasks: Task[]): Day[] {
  const items: Day[] = [];
  if (view === 'month') {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const d = new Date(start);
    while (d <= end) {
      const date = new Date(d);
      const tasksForDay = tasks.filter((t) => t.startDate && sameDay(new Date(t.startDate), date));
      items.push({ date, tasks: tasksForDay });
      d.setDate(d.getDate() + 1);
    }
    return items;
  }
  const start = startOfWeek(cursor);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const d = new Date(start);
  while (d <= end) {
    const date = new Date(d);
    const tasksForDay = tasks.filter((t) => t.startDate && sameDay(new Date(t.startDate), date));
    items.push({ date, tasks: tasksForDay });
    d.setDate(d.getDate() + 1);
  }
  return items;
}

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDate(d: Date, amount: number) {
  const n = new Date(d);
  n.setDate(n.getDate() + amount);
  return n;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatRange(d: Date, view: 'month' | 'week') {
  if (view === 'month') return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${formatDate(start)} - ${formatDate(end)}`;
}
