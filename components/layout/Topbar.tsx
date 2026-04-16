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
                          "h-[var(--header-height)] border-b border-[var(--color-sand-light)]",
                          className,
                        )}
                style={{ background: "var(--color-cream)" }}
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
        
          {/* Breadcrumb title block */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-[2px]">
                      <div
                                  className="font-sans font-medium uppercase leading-none tracking-[0.12em]"
                                  style={{ fontSize: "10px", color: "var(--color-navy-mid)" }}
                                >
                                T&#280;SKNOTA
                      </div>
                      <div
                                  className="font-serif truncate leading-[1.2]"
                                  style={{
                                                fontSize: "18px",
                                                fontStyle: "normal",
                                                fontWeight: 400,
                                                color: "var(--color-navy)",
                                  }}
                                >
                        {title}
                      </div>
              </div>
        
          {/* Search */}
          {search && (
                        <div className="flex-shrink-0">
                          {search}
                        </div>
              )}
        
          {/* Actions */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      );
}
