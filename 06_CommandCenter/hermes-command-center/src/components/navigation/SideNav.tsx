'use client';

const items = [
  { label: 'OVERVIEW', icon: '◉' },
  { label: 'MISSIONS', icon: '◆' },
  { label: 'TASKS', icon: '▤' },
  { label: 'PROJECTS', icon: '▦' },
  { label: 'AGENTS', icon: '◈' },
  { label: 'TOOLS', icon: '⌨' },
  { label: 'SKILLS', icon: '⚡' },
  { label: 'EVENTS', icon: '≡' },
  { label: 'SETTINGS', icon: '⋯' },
];

export function SideNav() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="px-1 text-center text-[10px] text-command-muted">MENU</div>
      {items.map((item) => (
        <button key={item.label} className="rounded-lg border border-transparent bg-command-elevated/40 px-1 py-2 text-center text-[10px] text-command-muted transition hover:border-command-border hover:text-command-text">
          <div className="text-sm leading-none">{item.icon}</div>
          <div className="mt-1 leading-none">{item.label}</div>
        </button>
      ))}
    </div>
  );
}
