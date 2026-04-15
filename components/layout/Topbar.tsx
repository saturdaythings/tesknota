"use client";

import { cn } from "@/lib/utils";
import { useMobileNav } from "@/lib/mobile-nav-context";

interface TopbarProps {
  category?: string;
  title: string;
  search?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function Topbar({
  category,
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
        "h-[var(--th)] bg-[var(--off)] border-b border-[var(--b2)]",
        className,
      )}
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggle}
        aria-label="Open menu"
        className="md:hidden flex flex-col gap-[5px] p-1 mr-1 text-[var(--ink3)] hover:text-[var(--ink)] transition-colors"
      >
        <span className="block w-[18px] h-[1.5px] bg-current" />
        <span className="block w-[18px] h-[1.5px] bg-current" />
        <span className="block w-[18px] h-[1.5px] bg-current" />
      </button>

      <div className="flex-1 min-w-0">
        {category && (
          <div className="font-[var(--mono)] text-xs tracking-[0.2em] uppercase text-[var(--ink3)]">
            {category}
          </div>
        )}
        <div className="font-[var(--serif)] text-base font-normal text-[var(--ink)] mt-[1px] leading-[1.3] truncate">
          {title}
        </div>
      </div>
      {search && <div className="flex-shrink-0">{search}</div>}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
