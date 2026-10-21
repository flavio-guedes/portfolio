'use client';

import React, { ReactNode } from 'react';

export function AppShell({ nav, topBar, dashboard, main, bottom }: {
  nav?: ReactNode;
  topBar?: ReactNode;
  dashboard?: ReactNode;
  main?: ReactNode;
  bottom?: ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-white text-command-text">
      <header className="sticky top-0 z-20 border-b border-command-border bg-white/90 backdrop-blur">
        {topBar}
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden md:block w-60 border-r border-command-border bg-white">
          {nav}
        </aside>
        <main className="flex min-h-0 flex-1 flex-col">
          <section className="border-b border-command-border bg-command-surface/70 px-6 py-4">
            {dashboard}
          </section>
          <section className="flex-1 overflow-hidden p-6">
            <div className="h-full overflow-x-auto">
              {main}
            </div>
          </section>
          {bottom && (
            <section className="border-t border-command-border bg-command-surface/70 px-6 py-4">
              {bottom}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
