"use client";

import { cn } from "@/lib/utils";

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ sidebar, children, className }: AppShellProps) {
  return (
    <div
      className={cn(
        "flex h-dvh overflow-hidden bg-[var(--off)] text-[var(--ink)] font-[var(--body)] text-sm leading-normal",
        className,
      )}
    >
      {sidebar}
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
