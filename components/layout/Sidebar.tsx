"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMobileNav } from "@/lib/mobile-nav-context";

interface NavItem {
  href: string;
  label: string;
  count?: number;
  badge?: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  navSections: NavSection[];
  userName: string;
  onSignOut?: () => void;
  onUserClick?: () => void;
  className?: string;
}

export function Sidebar({
  navSections,
  userName,
  onSignOut,
  onUserClick,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { open, close } = useMobileNav();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[299] bg-black/40 md:hidden transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={close}
      />

      <aside
        className={cn(
          "flex flex-col flex-shrink-0 z-[300] bg-[var(--blue3)]",
          "w-[var(--sw)]",
          // Mobile: fixed drawer, slide in/out
          "fixed inset-y-0 left-0 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop: back to normal flow
          "md:relative md:inset-auto md:translate-x-0",
          className,
        )}
      >
        {/* Logo */}
        <div className="px-5 pt-7 pb-[22px] border-b border-white/[0.07]">
          <div className="font-[var(--script)] text-2xl italic text-[var(--warm2)] tracking-[0.02em] leading-none">
            tesknota
          </div>
          <div className="font-[var(--mono)] text-[10px] tracking-[0.22em] uppercase text-white/70 mt-1">
            Fragrance Journal
          </div>
          <div className="font-[var(--script)] text-sm italic text-[rgba(var(--warm-ch),0.92)] leading-[1.45] mt-[10px] tracking-[0.01em]">
            a scent is a memory waiting to be written
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 overscroll-contain">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="font-[var(--mono)] text-[10px] tracking-[0.22em] uppercase text-white/55 px-5 mt-6 mb-1 pointer-events-none select-none">
                {section.label}
              </div>
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={cn(
                      "flex items-center justify-between px-5 py-[5px] text-[13px] tracking-[0.02em] select-none transition-all duration-[140ms]",
                      active
                        ? "text-[var(--warm2)] bg-[rgba(var(--warm-ch),0.14)] border-r-2 border-[var(--warm)] opacity-100"
                        : "text-white/65 opacity-65 hover:text-[var(--warm2)] hover:bg-white/[0.05] hover:opacity-100",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {item.label}
                      {item.badge}
                    </span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="font-[var(--mono)] text-[10px] text-[rgba(var(--warm-ch),0.8)]">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div
            onClick={() => { close(); onUserClick?.(); }}
            className="text-xs text-white/45 cursor-pointer transition-all duration-[140ms] hover:text-[var(--warm2)]"
          >
            <b className="block font-normal text-[13px] text-white/70 mb-[1px]">
              {userName}
            </b>
            Settings
          </div>
          <div
            onClick={onSignOut}
            className="font-[var(--mono)] text-[10px] tracking-[0.1em] uppercase text-white/25 cursor-pointer mt-[10px] transition-colors duration-[140ms] hover:text-white/55"
          >
            Sign out
          </div>
        </div>
      </aside>
    </>
  );
}
