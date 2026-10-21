'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { ApprovalRequest } from '@/types/events';

export function ApprovalPanel({ approvals }: { approvals: ApprovalRequest[] }) {
  return (
    <div className="h-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <div>
          <div className="text-xs font-semibold text-command-text">GOVERNANCE</div>
          <div className="text-[11px] text-command-muted">Security & approvals</div>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-command-success/20 bg-command-success/10 px-2 py-0.5 text-[10px] font-mono text-command-success">
          <ShieldCheck size={12} /> SYSTEM SECURE
        </span>
      </div>
      <div className="space-y-2">
        {approvals.map(a => (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} key={a.id} className="rounded-lg border border-command-warning/20 bg-command-warning/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 text-command-warning" />
              <div>
                <div className="text-[11px] font-semibold text-command-text">ACTION REQUIRES APPROVAL</div>
                <div className="mt-1 space-y-0.5 text-[11px] text-command-muted">
                  <div>Agent: {a.actor}</div>
                  <div>Action: {a.action}</div>
                  <div>Risk: {a.risk.toUpperCase()}</div>
                  <div>Reason: {a.reason}</div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button className="rounded-lg border border-command-success/20 bg-command-success/10 px-2 py-1 text-[11px] text-command-success">Approve</button>
                  <button className="rounded-lg border border-command-danger/20 bg-command-danger/10 px-2 py-1 text-[11px] text-command-danger">Deny</button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
