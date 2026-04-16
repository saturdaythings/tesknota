"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useMobileNav } from '@/lib/mobile-nav-context';
import { LogOut } from '@/components/ui/Icons';

interface NavItem {
  href: string;
  label: string;
  count?: number;
  hasNewActivity?: boolean;
  exact?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  navSections: NavSection[];
  userName: string;
  onSignOut?: () => void;
}

function CountBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className="ml-auto font-sans tabular-nums"
      style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 400,
        letterSpacing: '0.08em',
        color: active ? 'var(--color-cream)' : 'var(--color-sand-muted)',
      }}
    >
      {count}
    </span>
  );
}

function LiveDot() {
  return (
    <span
      className="ml-1 inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: 'var(--color-live)' }}
      aria-label="New activity"
    />
  );
}

export function Sidebar({ navSections, userName, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const { open, close } = useMobileNav();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          'fixed inset-0 z-[299] md:hidden transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        style={{ background: 'var(--color-navy-backdrop)' }}
      />

      <aside
        className={cn(
          'flex flex-col flex-shrink-0 z-[300] h-dvh overflow-hidden',
          'w-[220px]',
          'fixed top-0 left-0 transition-transform duration-200',
          'md:relative md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        style={{ background: 'var(--color-navy)' }}
      >
        {/* Logo area */}
        <div className="px-5 pt-8 pb-6 flex-shrink-0">
          <div
            className="font-serif italic leading-none mb-1"
            style={{ fontSize: 'var(--text-logo)', color: 'var(--color-cream)' }}
          >
            t&#281;sknota
          </div>
          <div
            className="font-sans font-medium uppercase leading-none mb-3"
            style={{
              fontSize: 'var(--text-xxs)',
              color: 'var(--color-cream-muted)',
              letterSpacing: '0.22em',
            }}
          >
            Fragrance Tracker
          </div>
          <div
            className="font-serif italic leading-snug"
            style={{ fontSize: 'var(--text-md)', color: 'var(--color-sand)' }}
          >
            [ t&#603;sk-&#712;n&#596;-ta ] &middot; a deep longing for what is absent or past
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto pb-2">
          {navSections.map((section) => (
            <div key={section.label} className="mt-6">
              <div
                className="px-5 mb-1 font-sans font-medium uppercase"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-sand-label)',
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                }}
              >
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="flex items-center transition-colors duration-100"
                    style={{
                      height: 'var(--space-10)',
                      paddingLeft: 'var(--space-5)',
                      paddingRight: 'var(--space-5)',
                      borderLeft: isActive
                        ? '3px solid var(--color-cream)'
                        : '3px solid transparent',
                      background: isActive ? 'var(--color-white-subtle)' : 'transparent',
                      color: isActive
                        ? 'var(--color-cream)'
                        : 'var(--color-sand-muted)',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.04em',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hasNewActivity && <LiveDot />}
                    {item.count !== undefined && <CountBadge count={item.count} active={isActive} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user section */}
        <div
          className="flex-shrink-0 px-5 py-5 border-t"
          style={{ borderColor: 'var(--color-white-subtle)' }}
        >
          <div
            className="font-sans mb-1 truncate"
            style={{ fontSize: 'var(--text-ui)', color: 'var(--color-cream)' }}
          >
            {userName}
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 font-sans font-medium uppercase tracking-[0.08em] transition-opacity hover:opacity-100 bg-transparent border-none cursor-pointer p-0"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-muted)' }}
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
