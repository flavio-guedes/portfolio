'use client';


import { Tool } from '@/types/events';

export function ToolsPanel({ tools }: { tools: Tool[] }) {
  const groups = tools.reduce<Record<string, Tool[]>>((acc, t) => {
    acc[t.category] = acc[t.category] || [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="h-full">
      <div className="mb-2 px-1">
        <div className="text-xs font-semibold text-command-text">TOOLS</div>
        <div className="text-[11px] text-command-muted">Hierarchy: Skills → Tools</div>
      </div>
      <div className="space-y-2">
        {Object.entries(groups).map(([category, items]) => (
          <div key={category} className="rounded-lg border border-command-border bg-command-elevated/60 p-2">
            <div className="text-[10px] text-command-muted">{category}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {items.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1 rounded-full border border-command-border bg-command-bg px-2 py-0.5 text-[10px] text-command-text">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${t.status === 'active' ? 'bg-command-success' : 'bg-command-muted'}`} />
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
