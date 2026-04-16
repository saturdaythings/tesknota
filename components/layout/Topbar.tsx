"use client";

import { cn } from "@/lib/utils";

interface TopbarProps {
    title: string;
    search?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function Topbar({ title, search, actions, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "flex items-center gap-3 pl-[var(--topbar-px-mobile)] pr-[var(--topbar-px-mobile)] md:pl-[var(--topbar-px)] md:pr-[var(--page-margin)] flex-shrink-0 z-[100]",
        "h-[var(--header-height)] border-b border-[var(--color-sand-light)]",
        className,
      )}
      style={{ background: "var(--color-cream)" }}
    >
      <div
        className="flex-1 min-w-0 flex flex-col justify-center"
        style={{ gap: 'var(--space-half)' }}
      >
        <div
          className="font-sans font-medium uppercase leading-none"
          style={{ fontSize: "var(--text-xs)", color: "var(--color-navy-mid)", letterSpacing: 'var(--tracking-lg)' }}
        >
          T&#280;SKNOTA
        </div>
        <div
          className="font-serif italic truncate"
          style={{
            fontSize: "var(--text-page-title)",
            fontWeight: 'var(--font-weight-normal)',
            color: "var(--color-navy)",
            lineHeight: 'var(--leading-tight)',
          }}
        >
          {title}
        </div>
      </div>

      {search && <div className="flex-shrink-0">{search}</div>}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
