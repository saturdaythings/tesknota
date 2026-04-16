"use client";

import { cn } from "@/lib/utils";
import { useMobileNav } from "@/lib/mobile-nav-context";

interface TopbarProps {
    title: string;
    search?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className="md:hidden p-1 mr-1 text-[var(--color-sand)] hover:text-[var(--color-navy)] transition-colors"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--_ham-gap, 5px)',
        '--_ham-gap': '5px',
        '--_ham-w': '18px',
        '--_ham-h': '1.5px',
      } as React.CSSProperties}
    >
      <span style={{ display: 'block', width: 'var(--_ham-w)', height: 'var(--_ham-h)', background: 'currentColor' }} />
      <span style={{ display: 'block', width: 'var(--_ham-w)', height: 'var(--_ham-h)', background: 'currentColor' }} />
      <span style={{ display: 'block', width: 'var(--_ham-w)', height: 'var(--_ham-h)', background: 'currentColor' }} />
    </button>
  );
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
      <HamburgerButton onClick={toggle} />

      {/* Breadcrumb title block */}
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
