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

function CountBadge({ count }: { count: number }) {
  return (
    <span
      className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full font-sans font-medium leading-none"
      style={{ fontSize: '11px', background: 'var(--color-cream)', color: 'var(--color-navy)' }}
    >
      {count}
    </span>
  );
}

function LiveDot() {
  return (
    <span
      className="ml-1 inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: '#22c55e' }}
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
        style={{ background: 'rgba(30,45,69,0.5)' }}
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
        <div className="px-5 pt-8 pb-4 flex-shrink-0">
          <div
            className="font-serif italic leading-none mb-1"
            style={{ fontSize: '28px', color: 'var(--color-cream)' }}
          >
            t&#281;sknota
          </div>
          <div
            className="font-sans font-medium uppercase leading-none mb-3"
            style={{
              fontSize: '10px',
              color: 'rgba(245,240,232,0.7)',
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
            <div key={section.label} className="mt-4">
              <div
                className="px-5 mb-1 font-sans font-medium uppercase"
                style={{
                  fontSize: '10px',
                  color: 'rgba(200,184,154,0.6)',
                  letterSpacing: '0.15em',
                  lineHeight: 1,
                }}
              >
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="flex items-center transition-colors duration-100"
                    style={{
                      height: '40px',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                      borderLeft: isActive
                        ? '3px solid var(--color-cream)'
                        : '3px solid transparent',
                      background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: isActive
                        ? 'var(--color-cream)'
                        : 'rgba(200,184,154,0.8)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hasNewActivity && <LiveDot />}
                    {item.count !== undefined && <CountBadge count={item.count} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user section */}
        <div
          className="flex-shrink-0 px-5 py-5 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="font-sans font-medium mb-1 truncate"
            style={{ fontSize: '15px', color: 'var(--color-cream)' }}
          >
            {userName}
          </div>
          <Link
            href="/settings"
            className="block font-sans mb-2 transition-opacity hover:opacity-100"
            style={{ fontSize: '13px', color: 'var(--color-sand)', opacity: 0.8 }}
          >
            Settings
          </Link>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 font-sans font-medium uppercase tracking-[0.12em] transition-opacity hover:opacity-100 bg-transparent border-none cursor-pointer p-0"
            style={{ fontSize: '11px', color: 'rgba(200,184,154,0.6)' }}
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
