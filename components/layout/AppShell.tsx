"use client";

import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
}

export function AppShell({ children, sidebar, className }: AppShellProps) {
  return (
    <div
      className={cn('flex h-dvh overflow-hidden', className)}
      style={{ background: 'var(--color-cream)', color: 'var(--color-navy)', fontFamily: 'var(--font-sans)' }}
    >
      {sidebar}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}
