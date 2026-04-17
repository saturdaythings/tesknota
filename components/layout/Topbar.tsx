"use client";

import { cn } from "@/lib/utils";
import { useMobileNav } from "@/lib/mobile-nav-context";
import { Menu } from "@/components/ui/Icons";

interface TopbarProps {
    title: string;
    search?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function Topbar({ title, search, actions, className }: TopbarProps) {
  const { toggle } = useMobileNav();

  return (
    <header
      className={cn(
        "flex items-center gap-3 pl-[var(--topbar-px-mobile)] pr-[var(--topbar-px-mobile)] md:pl-[var(--topbar-px)] md:pr-[var(--page-margin)] flex-shrink-0 z-[100]",
        "h-[var(--header-height)] border-b border-[var(--color-sand-light)]",
        className,
      )}
      style={{ background: "var(--color-cream)" }}
    >
      <button
        onClick={toggle}
        className="md:hidden flex-shrink-0 flex items-center justify-center"
        style={{
          width: 'var(--space-8)',
          height: 'var(--space-8)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-navy)',
          padding: 0,
        }}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

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
