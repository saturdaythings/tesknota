"use client";

import { cn } from "@/lib/utils";
import { useMobileNav } from "@/lib/mobile-nav-context";

interface TopbarProps {
  title: string;
  search?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function Topbar({
  title,
  search,
  actions,
  className,
}: TopbarProps) {
  const { toggle } = useMobileNav();

  return (
    <header
      className={cn(
        "flex items-center gap-3 px-[18px] md:px-[26px] flex-shrink-0 z-[100]",
        "h-[var(--header-height)] bg-[var(--color-cream)] border-b border-[var(--color-cream-dark)]",
        className,
      )}
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggle}
        aria-label="Open menu"
        className="md:hidden flex flex-col gap-[5px] p-1 mr-1 text-[var(--color-sand)] hover:text-[var(--color-navy)] transition-colors"
      >
        <span className="block w-[18px] h-[1.5px] bg-current" />
        <span className="block w-[18px] h-[1.5px] bg-current" />
        <span className="block w-[18px] h-[1.5px] bg-current" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="font-[var(--font-sans)] text-[12px] tracking-[0.14em] uppercase text-[var(--color-sand)] leading-none mb-[3px]">
          T\u0118SKNOTA
        </div>
        <div className="font-[var(--font-serif)] text-[32px] italic font-normal text-[var(--color-navy)] leading-[1.2] truncate">
          {title}
        </div>
      </div>
      {search && <div className="flex-shrink-0">{search}</div>}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
