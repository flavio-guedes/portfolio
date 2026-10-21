'use client';

import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/AppShell';
import { useMockStream } from '@/hooks/useMockStream';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { DashboardViews } from '@/components/tasks/views/DashboardViews';

const ExecutiveDashboard = dynamic(() => import('@/components/dashboard/ExecutiveDashboard').then(mod => ({ default: mod.ExecutiveDashboard })), { ssr: false });
const SideNav = dynamic(() => import('@/components/navigation/SideNav').then(mod => ({ default: mod.SideNav })), { ssr: false });
const EventStream = dynamic(() => import('@/components/event-stream/EventStream').then(mod => ({ default: mod.EventStream })), { ssr: false });

export default function Page() {
  const { kpis, mission, approvals, tasks, categories, events } = useMockStream();

  return (
    <div className="mx-auto w-full max-w-[1920px]">
      <AppShell
        nav={<SideNav />}
        topBar={<TopBar />}
        dashboard={
          <div className="space-y-4">
            <HeroSection />
            <ExecutiveDashboard kpis={kpis} mission={mission} approvals={approvals} />
          </div>
        }
        main={<DashboardViews tasks={tasks} categories={categories} events={events} />}
        bottom={<EventStream events={events} />}
      />
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="font-display text-lg font-semibold tracking-tight text-command-text">HERMES</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-command-success/40 bg-command-success/5 px-2.5 py-1 text-[10px] font-mono text-command-success">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-current" />
          SYSTEM ONLINE
        </span>
      </div>
      <nav className="hidden md:flex items-center gap-4 text-xs text-command-muted">
        <button className="hover:text-command-text">Missões</button>
        <button className="hover:text-command-text">Tarefas</button>
        <button className="hover:text-command-text">Projetos</button>
        <button className="hover:text-command-text">Agentes</button>
      </nav>
    </div>
  );
}
