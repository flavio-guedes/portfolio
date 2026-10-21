'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ExecutionEvent } from '@/types/events';

function toneForStatus(status: ExecutionEvent['status']) {
  if (status === 'completed' || status === 'running') return 'text-command-success';
  if (status === 'failed' || status === 'waiting') return 'text-command-warning';
  if (status === 'queued') return 'text-command-muted';
  return 'text-command-danger';
}

export function EventStream({ events }: { events: ExecutionEvent[] }) {
  return (
    <div className="h-full min-h-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <div>
          <div className="text-xs font-semibold text-command-text">EVENT STREAM</div>
          <div className="text-[11px] text-command-muted">Execution log</div>
        </div>
        <span className="text-[10px] text-command-muted">{events.length} events</span>
      </div>
      <div className="h-[220px] space-y-2 overflow-y-auto pr-1">
        {events.map((e) => (
          <motion.div
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            key={e.id}
            className="grid grid-cols-[80px_1fr] items-start gap-2 rounded-lg border border-command-border bg-command-elevated/60 px-3 py-2"
          >
            <div className="text-[10px] font-mono text-command-muted leading-5">
              {format(new Date(e.timestamp), 'HH:mm:ss', { locale: ptBR })}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-command-text">{e.actor.toUpperCase()}</span>
                <span className={`text-[10px] font-mono ${toneForStatus(e.status)}`}>● {e.status.toUpperCase()}</span>
              </div>
              <p className="text-[11px] text-command-muted leading-5">{e.message}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
