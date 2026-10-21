'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Skill, Category } from '@/types/events';

export function SkillsPanel({ skills, categories }: { skills: Skill[]; categories: Category[] }) {
  const [selected, setSelected] = useState<string>('ALL');
  const available = categories ?? [];
  const filtered =
    selected === 'ALL' ? skills : skills.filter((s) => s.category === selected);
  const active = skills.filter((s) => s.active).length;

  return (
    <div className="h-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <div>
          <div className="text-xs font-semibold text-command-text">SKILLS</div>
          <div className="text-[11px] text-command-muted">{active}/{skills.length} active</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 px-1">
        <FilterChip label="ALL" active={selected === 'ALL'} onClick={() => setSelected('ALL')} />
        {available.map((c) => (
          <FilterChip
            key={c.id}
            label={c.name}
            active={selected === c.id}
            onClick={() => setSelected(c.id)}
            color={c.color}
          />
        ))}
      </div>
      <div className="mt-2 space-y-1 overflow-y-auto pr-1">
        {filtered.map((s) => (
          <motion.div layout key={s.id} className="flex items-center justify-between rounded-lg border border-command-border bg-command-elevated/60 px-3 py-2">
            <div>
              <div className="text-[11px] text-command-text">{s.name}</div>
              <div className="text-[10px] text-command-muted">{s.category}</div>
            </div>
            <span className={`text-[10px] font-mono ${s.active ? 'text-command-success' : 'text-command-muted'}`}>
              {s.active ? 'ACTIVE' : 'IDLE'}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-[10px] ${
        active ? 'border-command-accent/40 bg-command-accent/10 text-command-text' : 'border-command-border text-command-muted'
      }`}
      style={active && color ? { borderColor: `${color}55`, backgroundColor: `${color}18` } : undefined}
    >
      {label}
    </button>
  );
}
