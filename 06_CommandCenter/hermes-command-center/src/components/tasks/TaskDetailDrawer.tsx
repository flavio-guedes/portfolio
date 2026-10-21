'use client';

import { motion } from 'framer-motion';
import type { Task } from '@/types/events';

export function TaskDetailDrawer({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="w-full max-w-xl command-card hud-corner p-5 shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-command-text tracking-wide">TASK DETAIL</div>
            <div className="text-[11px] text-command-muted">{task.title}</div>
          </div>
          <button onClick={onClose} className="text-[11px] text-command-muted">CLOSE</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
          <Field label="Category" value={task.category} />
          <Field label="Project" value={task.project} />
          <Field label="Agent" value={task.agent} />
          <Field label="Status" value={task.status} />
          <Field label="Priority" value={task.priority} />
          <Field label="Created" value={new Date(task.createdAt).toLocaleString()} />
          <Field label="Updated" value={new Date(task.updatedAt).toLocaleString()} />
          <Field label="Duration" value={task.duration || '—'} />
          <Field label="Next Action" value={task.nextAction || '—'} />
          <Field label="Result" value={task.result || '—'} />
        </div>
        {task.blocker && (
          <div className="mt-3 rounded-lg border border-command-danger/40 bg-command-danger/5 p-3 text-[11px] text-command-danger">
            <div className="font-semibold">BLOCKER</div>
            <div>{task.blocker}</div>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          {task.blocker && <button className="rounded-lg border border-command-success/40 bg-command-success/5 px-2 py-1 text-[11px] text-command-success">RESOLVE</button>}
          <button className="rounded-lg border border-command-border bg-white px-2 py-1 text-[11px] text-command-text">VIEW LOG</button>
          <button className="rounded-lg border border-command-border bg-white px-2 py-1 text-[11px] text-command-text">VIEW PROJECT</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-command-muted">{label}</div>
      <div className="text-[11px] text-command-text">{value}</div>
    </div>
  );
}
